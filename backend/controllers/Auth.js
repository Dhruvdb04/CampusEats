// controllers/Auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
//const { sendMail } = require('../utils/mailSender');
const otpGenerator = require('otp-generator');
const { otpTemplate, passwordChangedTemplate } = require('../Utils/emailTemplates');
const mailService = require('../Utils/mailSender');


exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already registered' });

    // Generate OTP
    const otp = otpGenerator.generate(6, { alphabets: false, upperCase: false, specialChars: false });
    
    // Save OTP in database (automatically expires -> OTP model)
    await OTP.create({ email, otp });

    // Send OTP by email
    const mailOptions = {
        to: email,
        subject: 'Your OTP for Registration',
        html: otpTemplate({ otp })
      };
    // await sendMail(mailOptions);
    await mailService.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Detailed OTP Send Error:', error);
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
}

exports.signUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, phone, otp } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !confirmPassword || !role || !otp) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    // Allowed roles
    if (!['restaurant_owner', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });  // Check OTP expiration
    
    // Create user using hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role, phone, verified: true });
    
    // Cleanup OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.token = token;
    await user.save();
    
    // Set token in cookie
    res.cookie('token', token, { httpOnly: true, maxAge: 604800000 }); // 7 days
    
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    // Check if the user exists (created by Google OAuth)
    let user = req.user;

    // If user doesn't exist, create a new user
    if (!user) {
      user = await User.create({
        name: req.user.displayName || 'Google User',
        email: req.user.emails[0].value,
        password: await bcrypt.hash(otpGenerator.generate(12), 10), // Generate a random password
        verified: true,
        role: 'student', // Default role for Google Sign-up
        phone: null
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};
















//Haven't implemented this yet
exports.changePassword = async (req, res) => {
  try {
    // Assuming the user is authenticated and OTP verification is done in middleware or passed in request
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields required' });
    
    // Verify OTP for password change
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });
    
    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    // Cleanup OTP record
    await OTP.deleteOne({ _id: otpRecord._id });
    
    // Send confirmation email
    const mailOptions = {
        to: email,
        subject: 'Password Changed Successfully',
        html: passwordChangedTemplate()
      };
    //await sendMail(mailOptions);
    await mailService.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};