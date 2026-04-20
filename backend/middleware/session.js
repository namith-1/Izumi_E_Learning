const session = require('express-session');
const { MongoStore } = require('connect-mongo'); 

const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'izumi_fallback_secret_123',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Render uses proxies, always trust for cookie setting
    store: process.env.MONGO_URI ? MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 
    }) : undefined,
    cookie: { 
        secure: true, // Requirement for SameSite: 'none'
        httpOnly: true,
        sameSite: 'none', // Allow cross-domain cookies for Render subdomains
        maxAge: 14 * 24 * 60 * 60 * 1000 
    }
});

module.exports = sessionConfig;