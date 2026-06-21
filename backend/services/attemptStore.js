const AuthAttempt = require("../models/AuthAttempt");
const { promisify } = require("util");
const authLogger = require("../middleware/authLogger");

// Try to use redis if configured, otherwise fallback to in-memory store
let redisClient = null;
let usingRedis = false;
try {
  const IORedis = require("ioredis");
  const redisUrl = process.env.REDIS_URL || null;
  if (redisUrl) {
    redisClient = new IORedis(redisUrl);
    usingRedis = true;
  }
} catch (e) {
  // redis not available — will fall back to in-memory
}

const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS || "5", 10);
const BLOCK_TIME_MS = parseInt(
  process.env.BLOCK_TIME_MS || String(5 * 60 * 1000),
  10,
);

// in-memory fallback
const memory = new Map();

const keyForRedis = (key) => `auth:${key}`;

async function readRec(key) {
  if (usingRedis) {
    const val = await redisClient.get(keyForRedis(key));
    return val ? JSON.parse(val) : null;
  }
  return memory.get(key) || null;
}

async function writeRec(key, rec) {
  rec.lastAttemptAt = new Date();
  if (usingRedis) {
    await redisClient.set(
      keyForRedis(key),
      JSON.stringify(rec),
      "PX",
      BLOCK_TIME_MS * 10,
    );
  } else {
    memory.set(key, rec);
  }
}

async function isBlocked(key) {
  const rec = await readRec(key);
  if (!rec) return { blocked: false };
  if (rec.blockedUntil && Date.now() < new Date(rec.blockedUntil).getTime()) {
    return { blocked: true, rec };
  }
  return { blocked: false, rec };
}

async function recordFailedAttempt(key, ip) {
  const now = Date.now();
  let rec = await readRec(key);
  if (!rec) rec = { count: 0, firstAt: now, blockedUntil: null };

  // reset window if too old
  if (now - new Date(rec.firstAt).getTime() > BLOCK_TIME_MS * 6) {
    rec.count = 0;
    rec.firstAt = now;
    rec.blockedUntil = null;
  }

  rec.count = (rec.count || 0) + 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.blockedUntil = new Date(Date.now() + BLOCK_TIME_MS);
  }
  rec.ip = ip || rec.ip;
  await writeRec(key, rec);

  // write audit record in MongoDB for analysis
  try {
    await AuthAttempt.create({
      key,
      count: rec.count,
      firstAt: rec.firstAt,
      blockedUntil: rec.blockedUntil,
      ip: rec.ip,
      lastAttemptAt: rec.lastAttemptAt,
    });
  } catch (e) {
    // ignore DB write errors but still log the attempt to the auth log
    console.error("AuthAttempt DB write failed", e && e.message);
  }

  // Always write a short audit line to auth log (even if DB write failed)
  try {
    const bu = rec.blockedUntil ? rec.blockedUntil : null;
    const ipstr = rec.ip ? ` ip=${rec.ip}` : "";
    authLogger.write(
      `AuthAttempts ${key} count=${rec.count} blockedUntil=${bu}${ipstr}`,
    );
  } catch (e) {
    // ignore logging errors
    console.error("Auth log write failed", e && e.message);
  }

  return rec;
}

async function clearAttempts(key) {
  if (usingRedis) {
    await redisClient.del(keyForRedis(key));
  } else {
    memory.delete(key);
  }
  try {
    authLogger.write(`AuthAttempts ${key} cleared`);
  } catch (e) {
    console.error("Auth log write failed", e && e.message);
  }
}

module.exports = {
  isBlocked,
  recordFailedAttempt,
  clearAttempts,
  MAX_ATTEMPTS,
  BLOCK_TIME_MS,
  usingRedis,
};
