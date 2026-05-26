// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // user already exists??
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: await bcrypt.hash(otpGenerator.generate(12), 10),
          verified: true,
          role: 'student'
        });
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

module.exports = passport;