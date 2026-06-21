const normalizeOrigin = (url) => url && url.trim().replace(/\/$/, "");

const isVercelAppOrigin = (origin) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

const getAllowedOrigins = () => [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.VERCEL_FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5000",
].filter(Boolean).map(normalizeOrigin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return getAllowedOrigins().includes(normalizedOrigin) || isVercelAppOrigin(normalizedOrigin);
};

module.exports = {
  getAllowedOrigins,
  isAllowedOrigin,
};
