import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Check if email configuration is available
const isEmailConfigured = () => {
  return process.env.EMAIL && process.env.EMAIL_PASS;
};

const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email configuration not found. Please set EMAIL and EMAIL_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    }
  });
};

const transporter = createTransporter();

const sendMail = async ({ to, subject, html, attachments }) => {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.log('📧 Email not configured - skipping email send');
      console.log('📧 Would have sent email to:', to);
      console.log('📧 Subject:', subject);
      
      // Extract OTP from HTML for development
      const otpMatch = html.match(/(\d{6})/);
      if (otpMatch) {
        console.log('🔐 OTP for development:', otpMatch[1]);
      }
      
      return { messageId: 'mock-message-id', response: 'Email not configured' };
    }

    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: `"Health app" <${process.env.EMAIL}>`,
      to,
      subject,
      html
    };
    
    if (attachments) {
      mailOptions.attachments = attachments;
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.response);
    return info;
  } catch (err) {
    console.error('❌ Email sending error:', err.message || err);
    throw err; 
  }
};

export default sendMail;
