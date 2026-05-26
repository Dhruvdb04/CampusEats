// controllers/ContactUs.js
const {contactUsTemplate} = require('../Utils/emailTemplates');
const mailService = require('../Utils/mailSender');
const multer = require('multer');   //middleware for multimedia/form-data
const path = require('path');       //for working with files and directories
const fs = require('fs');           //working with file systems

  // check if uploads directory exists
  const uploadDir = 'uploads/contact/';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  //multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});


const ContactUs = async (req, res) => {
  // Using multer for file handling
  const uploadMiddleware = upload.array('attachments', 3); // max 3 files

  uploadMiddleware(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      // Get form data
      const { subject, message } = req.body;
      
      // Get user information from authenticated request
      const name = req.user.name;
      const email = req.user.email;

      if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
      }

      // List of file paths that were uploaded
      const attachments = req.files ? req.files.map(file => {
        return {
          filename: file.originalname,
          path: file.path
        };
      }) : [];

      const mailOptions = {
        to: process.env.CONTACT_MAIL,
        replyTo: email, // responses to go directly to the user
        subject: subject, //use subject directly as email subject
        html: contactUsTemplate({ name, email, subject, message }),
        attachments: attachments
      };

      await mailService.sendMail(mailOptions);
      res.status(200).json({ message: 'Your message has been sent successfully.' });
    } catch (error) {
      console.error('Error sending contact email:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
};

// Make sure to export the function
module.exports = {
  ContactUs  
};