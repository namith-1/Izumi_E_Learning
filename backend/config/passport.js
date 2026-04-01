const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Student = require('../models/Student');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in your DB
      let user = await Student.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Sign-up logic: Create new student if they don't exist
        user = await Student.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          // Password is not required for OAuth users
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Passport session setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;