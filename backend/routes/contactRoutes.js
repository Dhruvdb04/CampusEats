// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { ContactUs } = require('../controllers/ContactUs');
const { authenticate } = require('../middleware/auth');

// Require authentication for contact submission
router.post('/', authenticate, ContactUs);

module.exports = router;