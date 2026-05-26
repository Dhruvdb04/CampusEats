// utils/mailSender.js
const nodemailer = require('nodemailer');   //to send emails

class MailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'Gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      } else {
        // Create Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal test account created');
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        console.log('Ethereal credentials:', testAccount);
      }
    } catch (error) {
      console.error('Failed to create email transporter:', error);
    }
  }

  async sendMail(mailOptions) {
    if (!this.transporter) {
      throw new Error('Email transporter is not initialized');
    }

    try {
      // Set default "from" if not provided
      if (!mailOptions.from) {
        mailOptions.from = `"CampusEats" <${process.env.EMAIL_USER || 'no-reply@gmail.com'}>`;
      }

      let info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);

      // Preview URL for Ethereal accounts
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return info;
    } catch (error) {
      console.error('Error sending mail:', error);
      throw error;
    }
  }
}

module.exports = new MailService();