// controllers/ResetPassword.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const OTP = require('../models/OTP');
// const { sendMail } = require('../utils/mailSender');
const mailService = require('../Utils/mailSender');

exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.token = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset token
    const mailOptions = {
        to: email,
        subject: 'Password Reset',
        html: passwordResetTemplate({ resetToken })
      };
    //await sendMail(mailOptions);
    await mailService.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset token sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findOne({ email, token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.token = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
