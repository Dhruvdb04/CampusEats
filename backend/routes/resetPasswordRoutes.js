// routes/resetPasswordRoutes.js
const express = require('express');
const router = express.Router();
const ResetPasswordController = require('../controllers/ResetPassword');

router.post('/token', ResetPasswordController.resetPasswordToken);
router.post('/', ResetPasswordController.resetPassword);

module.exports = router;
