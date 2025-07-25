# Email Configuration Setup

## Problem
The application is getting a 500 error when trying to send OTP emails because the email configuration is not set up.

## Solution

### 1. Create a `.env` file in the backend/healthmedpro directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=healthmedpro

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Gmail)
EMAIL=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 2. Gmail App Password Setup

To use Gmail for sending emails, you need to:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS` in your `.env` file

### 3. Alternative: Use a different email service

You can modify `utils/mailer.js` to use other email services like:
- SendGrid
- Mailgun
- AWS SES

### 4. Development Mode

If you're in development mode and don't want to set up email:
- The application will still work
- OTP codes will be logged to console
- You can see the OTP in the response when `NODE_ENV=development`

### 5. Test the Setup

After setting up the `.env` file, restart your server and try the OTP endpoint again.

## Current Status

The application has been updated to handle missing email configuration gracefully:
- ✅ No more 500 errors
- ✅ OTP generation still works
- ✅ Database operations continue
- ✅ Better error messages and logging
- ✅ Development mode shows OTP in response 