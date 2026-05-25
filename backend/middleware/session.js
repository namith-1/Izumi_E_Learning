const session = require('express-session');
const { MongoStore } = require('connect-mongo'); 

const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    process.env.FORCE_SECURE_COOKIES === 'true';

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'izumi_fallback_secret_123',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind proxies (Render)
    store: process.env.MONGO_URI ? MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 
    }) : undefined,
    cookie: { 
        // Secure should only be true when on HTTPS (Production)
        // Localhost browsers fail to save cookies if secure is true on HTTP
        secure: isProduction, 
        httpOnly: true,
        // sameSite must be 'none' for cross-domain on Render, but 'lax' is better for local dev
        sameSite: isProduction ? 'none' : 'lax', 
        maxAge: 14 * 24 * 60 * 60 * 1000 
    }
});

module.exports = sessionConfig;
