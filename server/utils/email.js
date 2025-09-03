const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create a test account if in development
let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production email configuration (using environment variables)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: process.env.NODE_ENV !== 'development',
    },
  });
} else {
  // Development email configuration (using ethereal.email for testing)
  (async function createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      logger.info(`Ethereal test account created: ${testAccount.user}`);
    } catch (error) {
      logger.error('Failed to create test email account', { error });
      throw error;
    }
  })();
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Plain text message
 * @param {string} [options.html] - HTML message (optional)
 * @returns {Promise<Object>} - Result of the send operation
 */
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Food Delivery'}" <${
        process.env.EMAIL_FROM || 'noreply@fooddelivery.com'
      }>`,
      to: email,
      subject,
      text: message,
      html: html || message.replace(/\n/g, '<br>'), // Simple conversion of newlines to <br> if no HTML provided
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the email preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Email preview URL: ' + nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    logger.error('Error sending email', { 
      error: error.message,
      recipient: email,
      subject,
    });
    
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
