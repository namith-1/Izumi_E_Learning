const Redis = require("ioredis");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars specifically for this service if needed
dotenv.config({ path: path.join(__dirname, "../.env") });

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      // If redis is down, we don't want to crash the whole app.
      // We'll just log and disable caching.
      if (times > 3) {
        console.warn("Redis connection failed. Caching disabled.");
        return null;
      }
      return Math.min(times * 100, 2000);
    },
  });

  redis.on("error", (err) => {
    // Suppress noise but log major issues
    if (err.code !== "ECONNREFUSED") {
      console.error("Redis Error:", err);
    }
  });
} catch (e) {
  console.error("Failed to initialize Redis:", e);
}

const CACHE_TTL = 300; // 5 minutes default

const cacheService = {
  get: async (key) => {
    if (!redis || redis.status !== "ready") return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Cache Get Error [${key}]:`, err);
      return null;
    }
  },

  set: async (key, value, ttl = CACHE_TTL) => {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (err) {
      console.error(`Cache Set Error [${key}]:`, err);
    }
  },

  del: async (key) => {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.del(key);
    } catch (err) {
      console.error(`Cache Del Error [${key}]:`, err);
    }
  },

  // Clear keys by pattern (e.g., courses:*)
  delByPattern: async (pattern) => {
    if (!redis || redis.status !== "ready") return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error(`Cache DelPattern Error [${pattern}]:`, err);
    }
  },
};

module.exports = cacheService;
