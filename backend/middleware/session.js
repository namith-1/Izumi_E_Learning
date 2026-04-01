const session = require('express-session');
const { MongoStore } = require('connect-mongo'); 

const sessionConfig = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true 
    }
});

module.exports = sessionConfig;