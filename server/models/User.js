const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isEmail } = require('validator');
const crypto = require('crypto'); // ✅ FIX: import crypto
const Session = require('./Session');
const Schema = mongoose.Schema;



const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    trim: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid email address'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    select: false, // Don't return password by default
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'restaurant_owner'],
    default: 'user',
    required: true
  },
  address: {   // ✅ FIX: proper nesting
    country: {
      type: String,
      default: ''
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Account security
  passwordChangedAt: Date,
  accountLocked: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lockUntil: {   // ✅ FIX: added lockUntil field
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    if (this.isModified('email')) {
      this.isEmailVerified = false;
    }
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000;
    this.loginAttempts = 0;
    this.accountLocked = false;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (this.accountLocked && this.lockUntil > Date.now()) {
      return false; // Return false instead of throwing error
    }

    if (!this.password) {
      return false; // Return false instead of throwing error
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    if (!isMatch) {
      this.loginAttempts += 1;

      if (this.loginAttempts >= 5) {
        this.accountLocked = true;
        this.lockUntil = Date.now() + 30 * 60 * 1000; // lock 30 minutes
        await this.save();
      } else {
        await this.save();
      }
      
      return false; // Return false instead of throwing error
    }

    // Reset login attempts on successful login
    if (this.loginAttempts > 0 || this.accountLocked) {
      this.loginAttempts = 0;
      this.accountLocked = false;
      this.lockUntil = undefined;
      await this.save();
    }

    return true;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false; // Return false on any error
  }
};

// Check if password was changed after token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

// Generate JWT
userSchema.methods.generateAuthToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { userId: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Create a new session
userSchema.methods.createSession = async function(userAgent = '', ipAddress = '') {
  const token = this.generateAuthToken();
  const session = await Session.createSession(this, token, userAgent, ipAddress);
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });

  return session;
};

// End all active sessions
userSchema.methods.endAllSessions = async function() {
  await Session.updateMany(
    { user: this._id, expiresAt: { $gt: new Date() } },
    { $set: { expiresAt: new Date() } }
  );
};

// Get active sessions
userSchema.methods.getActiveSessions = function() {
  return Session.find({ user: this._id, expiresAt: { $gt: new Date() } }).sort('-lastActivity');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
