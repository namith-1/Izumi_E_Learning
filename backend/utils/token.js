const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60;

const getSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || "izumi_fallback_secret_123";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const sign = (value) => {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
};

const createAuthToken = (user) => {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    user,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  const decoded = decode(payload);
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded.user || null;
};

const getBearerToken = (req) => {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme && scheme.toLowerCase() === "bearer" ? token : null;
};

module.exports = {
  createAuthToken,
  getBearerToken,
  verifyAuthToken,
};
