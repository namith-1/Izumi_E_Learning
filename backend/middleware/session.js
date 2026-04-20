const session = require('express-session');
const { MongoStore } = require('connect-mongo'); 

const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'izumi_fallback_secret_123',
    resave: false,
    saveUninitialized: false,
    proxy: isProduction, // Trust proxy only in production
    store: process.env.MONGO_URI ? MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 
    }) : undefined,
    cookie: { 
        secure: isProduction, // Only require HTTPS in production
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax', // Use 'lax' for local development compatibility
        maxAge: 14 * 24 * 60 * 60 * 1000 
    }
});

module.exports = sessionConfig;