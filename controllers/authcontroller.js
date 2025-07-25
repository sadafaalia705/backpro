import sendMail from '../utils/mailer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Send OTP
export const sendOTP = async (req, res) => {
    console.log("han bhai function to chl gya");
  const { email } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '❌ Email already registered! Please try logging in instead.' });
    }

    const otp = generateOTP();
   console.log ("haan ye kaam bhi hogya otp bnanane wala");
    await pool.query(
      `INSERT INTO email_verifications (email, otp, is_verified, created_at)
       VALUES (?, ?, false, NOW())
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), is_verified = false, created_at = NOW()`,
      [email, otp]
    );
   console.log("ab mail bhejne ki baari");
    await sendMail({
      to: email,
      subject: '📧 Verify Your Email - Health App',
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="color:#2e7d32;text-align:center;">📧 Email Verification</h1>
          <p>Welcome to <strong>Health App</strong>! Please verify your email to continue.</p>
          <div style="text-align:center;margin:30px 0;padding:20px;background-color:#e8f5e8;border-radius:8px;border:2px solid #4CAF50;">
            <h2 style="font-size:32px;letter-spacing:8px;">${otp}</h2>
            <p>Your 6-digit verification code</p>
          </div>
          <p><strong>⏰ This code is valid for 10 minutes.</strong></p>
          <p>If you didn't sign up, ignore this email.</p>
        </div>`
    });
    console.log("mail bhejdi gyi hai");

    res.json({ message: '✅ Verification code sent! Check your inbox.' });
  } catch (err) {
    console.error('[sendOTP]', err);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
};

// 2. Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [result] = await pool.query(
      'SELECT * FROM email_verifications WHERE email = ? AND otp = ? AND created_at > NOW() - INTERVAL 10 MINUTE',
      [email, otp]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code!' });
    }

    await pool.query('UPDATE email_verifications SET is_verified = true WHERE email = ?', [email]);

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('[verifyOTP]', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// 3. Register
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [verification] = await pool.query('SELECT * FROM email_verifications WHERE email = ? AND is_verified = true', [email]);
    if (verification.length === 0) {
      return res.status(400).json({ error: 'Please verify your email first.' });
    }

    const [existingUser] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashed, 'user']);

    const [userResult] = await pool.query('SELECT user_id, name, email, role FROM users WHERE email = ?', [email]);
    const user = userResult[0];

    await pool.query('DELETE FROM email_verifications WHERE email = ?', [email]);

    await sendMail({
      to: email,
      subject: '🎉 Welcome to Health App!',
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="color:#2e7d32;text-align:center;">🎉 Welcome, ${name}!</h1>
          <p>Thanks for joining <strong>Health App</strong>. Let’s get you started!</p>
          <div style="text-align:center;margin-top:30px;">
            <a href="https://healthapp.com/dashboard" style="padding:12px 25px;background-color:#4CAF50;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">🚀 Go to Dashboard</a>
          </div>
        </div>`
    });

    res.status(201).json({ message: '🎉 Registration successful!', user });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// 4. Login
export const login = async (req, res) => {
  console.log('Login function called');
  const { email, password, role } = req.body;

  try {
    // Use fallback JWT_SECRET if not configured
    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-2024-health-app';
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not configured, using fallback secret');
    }

    const [userResult] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = userResult[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!role || user.role !== role) {
      return res.status(403).json({ error: `Not authorized to login as ${role}.` });
    }

    const token = jwt.sign({ id: user.user_id }, jwtSecret, { expiresIn: '7d' }); // Extended to 7 days
    console.log('Login successful for user:', user.user_id, 'Token created with secret length:', jwtSecret.length);

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed. Try again later.' });
  }
};

// 5. Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [userCheck] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const resetCode = generateOTP();

    await pool.query(
      `INSERT INTO email_verifications (email, otp, is_verified, created_at)
       VALUES (?, ?, false, NOW())
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), is_verified = false, created_at = NOW()`,
      [email, resetCode]
    );

    await sendMail({
      to: email,
      subject: '🔐 Reset Your Password - Health App',
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="text-align:center;">🔐 Password Reset Request</h1>
          <p>Use this code to reset your password:</p>
          <div style="text-align:center;padding:20px;background:#e8f5e8;border:2px solid #4CAF50;border-radius:8px;">
            <h2 style="letter-spacing:8px;">${resetCode}</h2>
          </div>
          <p>This code is valid for 10 minutes.</p>
        </div>`
    });

    res.json({ message: 'Reset code sent! Check your email.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ error: 'Failed to send reset code.' });
  }
};

// 6. Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const [verificationReset] = await pool.query(
      'SELECT * FROM email_verifications WHERE email = ? AND otp = ? AND created_at > NOW() - INTERVAL 10 MINUTE',
      [email, otp]
    );

    if (verificationReset.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code!' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    await pool.query('DELETE FROM email_verifications WHERE email = ?', [email]);

    await sendMail({
      to: email,
      subject: '✅ Password Successfully Reset - Health App',
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="text-align:center;">✅ Password Reset Successful</h1>
          <p>You can now log in to your Health App account with your new password.</p>
          <div style="text-align:center;margin-top:20px;">
            <a href="https://healthapp.com/signin" style="padding:12px 25px;background-color:#4CAF50;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Login Now</a>
          </div>
        </div>`
    });

    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error('[resetPassword]', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

// 7. Get User Profile
export const getProfile = async (req, res) => {
  try {
    // The user ID should be set by authentication middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [userResult] = await pool.query('SELECT user_id, name, email, role FROM users WHERE user_id = ?', [userId]);
    if (!userResult.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: userResult[0] });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }


};


//Sleep tracking 
export const addSleepLog = async (req, res) => {
    const { sleep_date, sleep_start, sleep_end, notes } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    try {
        // Correct template string usage for date construction
        const start = new Date(`${sleep_date}T${sleep_start}`);
        let end = new Date(`${sleep_date}T${sleep_end}`);
        if (end <= start) {
            end.setDate(end.getDate() + 1);
        }

        const durationHours = (end - start) / (1000 * 60 * 60);

        let sleep_quality = 'Average';
        if (durationHours < 6) sleep_quality = 'Poor';
        else if (durationHours >= 6 && durationHours <= 8) sleep_quality = 'Excellent';
        else if (durationHours > 8) sleep_quality = 'Sleeping Too Much';

        // Use pool instead of db for database queries (to match the rest of the file)
        const [result] = await pool.query(
            'INSERT INTO sleep_logs (user_id, sleep_date, sleep_start, sleep_end, sleep_quality, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, sleep_date, start, end, sleep_quality, notes]
        );

        res.status(201).json({
            message: '🛏 Sleep log added successfully. Have a nice sleep!',
            wakeupNotification: `⏰ You will wake up at ${end.toLocaleTimeString()}`,
            logId: result.insertId,
            sleep_quality
        });
    } catch (err) {
        console.error('[addSleepLog]', err);
        res.status(500).json({ error: 'Failed to add sleep log. Please try again.' });
    }
};


export const getWeeklySleepSummary = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request

    try {
        const [rows] = await pool.query(`
            SELECT sleep_date, sleep_start, sleep_end, duration_minutes, sleep_quality, notes
            FROM sleep_logs 
            WHERE user_id = ? 
              AND sleep_date >= CURDATE() - INTERVAL 7 DAY
            ORDER BY sleep_date DESC
        `, [userId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error('[getWeeklySleepSummary]', err);
        res.status(500).json({ error: 'Failed to retrieve weekly sleep summary.' });
    }
};

// Get all sleep logs for a user
export const getUserSleepLogs = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request

    try {
        const [rows] = await pool.query(
            'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY sleep_date DESC',
            [userId]
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('[getUserSleepLogs]', err);
        res.status(500).json({ error: 'Failed to retrieve sleep logs. Please try again.' });
    }
};
