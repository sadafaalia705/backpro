import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async ({ to, subject, html, attachments }) => {
  try {
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
    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Email sending error:', err.message || err);
    throw err; 
  }
};

export default sendMail;
