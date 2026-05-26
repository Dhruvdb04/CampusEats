// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/Auth');
const ProfileController = require('../controllers/Profile');
const { authenticate } = require('../middleware/auth');
const passport = require('passport');

router.post('/send-otp', AuthController.sendOTP);
router.post('/signup', AuthController.signUp);
router.post('/login', AuthController.login);
router.post('/change-password', AuthController.changePassword);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback
);

router.get('/verify-token', authenticate, ProfileController.verifyToken);
router.get('/user/profile', authenticate, ProfileController.getUserProfile);
router.put('/user/profile', authenticate, ProfileController.updateUserProfile);

module.exports = router;