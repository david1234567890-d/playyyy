const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    User.findByEmail(email, (err, existingUser) => {
      if (err) return res.status(500).json({ success: false, message: 'Server error' });
      if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

      // Create new user
      User.create({ name, email, password }, (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Error creating user' });
        
        // Send verification email
        sendVerificationEmail(user.email, user.verification_token);
        
        res.status(201).json({
          success: true,
          message: 'User registered successfully. Please check your email for verification.',
          data: { userId: user.id, email: user.email }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login user
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    User.findByEmail(email, (err, user) => {
      if (err) return res.status(500).json({ success: false, message: 'Server error' });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      // Check if user is verified
      if (!user.is_verified) {
        return res.status(401).json({ success: false, message: 'Please verify your email first' });
      }

      // Check password
      User.comparePassword(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Generate token
        const token = generateToken(user.id);

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            token
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify email
exports.verifyEmail = (req, res) => {
  try {
    const { token } = req.params;

    User.verifyEmail(token, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server error' });
      if (result.changes === 0) return res.status(400).json({ success: false, message: 'Invalid verification token' });

      res.json({ success: true, message: 'Email verified successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = (req, res) => {
  try {
    const { email } = req.body;

    User.findByEmail(email, (err, user) => {
      if (err) return res.status(500).json({ success: false, message: 'Server error' });
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          success: true, 
          message: 'If the email exists, a reset link has been sent' 
        });
      }

      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      User.setResetToken(email, resetToken, resetTokenExpiry.toISOString(), (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        
        // Send password reset email
        sendPasswordResetEmail(email, resetToken);
        
        res.json({ 
          success: true, 
          message: 'If the email exists, a reset link has been sent' 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    User.resetPassword(token, password, (err, result) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      if (result.changes === 0) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

      res.json({ success: true, message: 'Password reset successfully' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};