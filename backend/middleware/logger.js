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

    const logFormat = '[:date[iso]] :method :url :status :response-time ms';
    app.use(morgan(logFormat, { stream: accessLogStream }));
};

module.exports = setupLogging;