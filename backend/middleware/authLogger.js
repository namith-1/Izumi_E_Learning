const rfs = require("rotating-file-stream");
const path = require("path");
const fs = require("fs");

// Helper to pad numbers (e.g., 8 becomes "08")
const pad = (num) => (num > 9 ? "" : "0") + num;

const generator = (time, index) => {
  const date = time || new Date();
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `auth-${year}${month}${day}-${hour}${minute}.log`;
};

const setupAuthLogger = (options = {}) => {
  const logDirectory = path.join(__dirname, "..", "logs");
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }

  const interval = options.interval || "5m";

  const stream = rfs.createStream(generator, {
    interval,
    path: logDirectory,
  });

  const write = (msg) => {
    const ts = new Date().toISOString();
    stream.write(`[${ts}] ${msg}\n`);
  };

  return { write, stream };
};

// Export a default logger instance with 5m rotation
module.exports = setupAuthLogger({
  interval: process.env.AUTH_LOG_INTERVAL || "5m",
});
