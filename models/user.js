const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static create(userData, callback) {
    const { name, email, password } = userData;
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err);
      
      const sql = `INSERT INTO users (name, email, password, verification_token) 
                   VALUES (?, ?, ?, ?)`;
      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      
      db.run(sql, [name, email, hashedPassword, verificationToken], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, name, email, verification_token: verificationToken });
      });
    });
  }

  // Find user by email
  static findByEmail(email, callback) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  }

  // Find user by ID
  static findById(id, callback) {
    const sql = 'SELECT id, name, email, is_verified FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  }

  // Verify user email
  static verifyEmail(token, callback) {
    const sql = 'UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?';
    db.run(sql, [token], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }

  // Set password reset token
  static setResetToken(email, token, expiry, callback) {
    const sql = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?';
    db.run(sql, [token, expiry, email], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }

  // Reset password
  static resetPassword(token, newPassword, callback) {
    // First verify the token is valid and not expired
    const checkSql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")';
    
    db.get(checkSql, [token], (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(new Error('Invalid or expired reset token'));
      
      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) return callback(err);
        
        const updateSql = 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?';
        db.run(updateSql, [hashedPassword, token], function(err) {
          if (err) return callback(err);
          callback(null, { changes: this.changes });
        });
      });
    });
  }

  // Compare password
  static comparePassword(plainPassword, hashedPassword, callback) {
    bcrypt.compare(plainPassword, hashedPassword, callback);
  }
}

module.exports = User;