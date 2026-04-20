const session = require('express-session');
const { MongoStore } = require('connect-mongo'); 

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'izumi_fallback_secret_123',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Tell express-session to trust the reverse proxy (Render)
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 
    }),
    cookie: { 
        secure: true, // Always true for production HTTPS
        httpOnly: true,
        sameSite: 'none', // Required for cross-site (frontend on one domain, backend on another)
        maxAge: 14 * 24 * 60 * 60 * 1000 
    }
});

module.exports = sessionConfig;