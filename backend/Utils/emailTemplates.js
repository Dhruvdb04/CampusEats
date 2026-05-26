// utils/emailTemplates.js

// Template for Contact Us messages
exports.contactUsTemplate = ({ name, email, subject, message }) => {
  return `
    <h3>New Contact Request</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong> ${message}</p>
  `;
};
  
  // Template for sending OTP (e.g., during registration)
  exports.otpTemplate = ({ otp }) => {
    return `
      <p>Your OTP is <strong>${otp}</strong>. It will expire in 5 minutes. Please do not share this code with anyone.</p>
    `;
  };
  
  // Template for password reset email
  exports.passwordResetTemplate = ({ resetToken }) => {
    return `
      <p>You have requested a password reset.</p>
      <p>Please use the following token to reset your password. This token will expire in 1 hour:</p>
      <p><strong>${resetToken}</strong></p>
      <p>If you did not request this, please ignore this email.</p>
    `;
  };
  
  // Template for password changed confirmation
  exports.passwordChangedTemplate = () => {
    return `
      <p>Your password has been successfully updated. If you did not perform this action, please contact our support immediately.</p>
    `;
  };
  
  // (Optional) Template for order confirmation email
  exports.orderConfirmationTemplate = ({ orderId, totalAmount }) => {
    return `
      <h3>Order Confirmation</h3>
      <p>Your order with ID <strong>${orderId}</strong> has been placed successfully.</p>
      <p>Total Amount: <strong>${totalAmount}</strong></p>
      <p>Thank you for choosing our service!</p>
    `;
  };
  