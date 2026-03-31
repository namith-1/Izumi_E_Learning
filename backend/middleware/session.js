const session = require('express-session');
const { MongoStore } = require('connect-mongo');

let sessionStore;

if (process.env.MONGO_URI) {
    sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
    });
} else {
    console.warn('MONGO_URI not set, using in-memory session store (not for production)');
    sessionStore = new session.MemoryStore();
}

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    },
});

module.exports = sessionConfig;