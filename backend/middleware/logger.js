const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');
const fs = require('fs');

// Helper to pad numbers (e.g., 8 becomes "08")
const pad = num => (num > 9 ? "" : "0") + num;

const generator = (time, index) => {
    // Force a date if time is not provided (handles the first file startup)
    const date = time || new Date();

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    // This creates the filename: 20260206-0805-access.log
    return `${year}${month}${day}-${hour}${minute}-access.log`;
};

const setupLogging = (app) => {
    const logDirectory = path.join(__dirname, '../logs');

    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    const accessLogStream = rfs.createStream(generator, {
        interval: '5m', 
        path: logDirectory,
        // immutable: true, 
    });

    // morgan token that emits auth attempt info when available on req
    morgan.token('auth', (req) => {
        try {
            if (req.authAttemptInfo && req.authAttemptInfo.key) {
                const key = req.authAttemptInfo.key;
                const rec = req.authAttemptInfo.rec || {};
                const bu = rec.blockedUntil ? rec.blockedUntil : null;
                return `AuthAttempts ${key} count=${rec.count || 0} blockedUntil=${bu}`;
            }
        } catch (e) {
            return '';
        }
        return '';
    });

    const logFormat = '[:date[iso]] :method :url :status :response-time ms :auth';
    app.use(morgan(logFormat, { stream: accessLogStream }));
};

module.exports = setupLogging;