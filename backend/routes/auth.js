const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// Use temporary in-memory DB when MongoDB is not available
let User;
try {
  User = require('../models/User');
} catch (error) {
  console.warn('MongoDB User model not available, using temporary in-memory storage');
  User = require('../temp-memory-db');
}
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Please provide a valid gender'),
  body('height.value')
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300'),
  body('weight.value')
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500'),
  body('fitnessLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Please provide a valid fitness level'),
  body('goals')
    .optional()
    .isArray()
    .withMessage('Goals must be an array'),
  body('goals.*')
    .optional()
    .isIn(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness'])
    .withMessage('Please provide valid goals')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// @route   POST /api/auth/test-register
// @desc    Simple test registration (bypasses strict validation)
// @access  Public
router.post('/test-register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, firstName, and lastName are required'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Create user with minimal data
  const user = new User({
    email,
    username: email.split('@')[0],
    password,
    firstName,
    lastName,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'prefer_not_to_say',
    height: { value: 170, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    fitnessLevel: 'beginner',
    goals: ['general_fitness']
  });

  await user.save();

  // Generate tokens
  const token = generateToken(user._id);

  // Send response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fitnessLevel: user.fitnessLevel,
        goals: user.goals,
        isEmailVerified: user.isEmailVerified,
        isPremium: user.isPremium,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    email,
    username,
    password,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    height,
    weight,
    fitnessLevel = 'beginner',
    goals = ['general_fitness'],
    workoutPreferences = {}
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
    });
  }

  // Create user
  const user = new User({
    email,
    username,
    password,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    height,
    weight,
    fitnessLevel,
    goals,
    workoutPreferences
  });

  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Send response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fitnessLevel: user.fitnessLevel,
        goals: user.goals,
        isEmailVerified: user.isEmailVerified,
        isPremium: user.isPremium
      },
      token,
      refreshToken
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last active
  await user.updateLastActive();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Send response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fitnessLevel: user.fitnessLevel,
        goals: user.goals,
        isEmailVerified: user.isEmailVerified,
        isPremium: user.isPremium,
        stats: user.stats
      },
      token,
      refreshToken
    }
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Save reset token to user
  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // TODO: Send email with reset link
  // For now, just return the token (in production, send via email)
  res.json({
    success: true,
    message: 'Password reset email sent',
    data: {
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    }
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Reset token and new password are required'
    });
  }

  // Hash the reset token
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  // Find user with valid verification token
  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', validatePasswordReset, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // TODO: Send verification email
  // For now, just return the token (in production, send via email)
  res.json({
    success: true,
    message: 'Verification email sent',
    data: {
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    }
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client should delete tokens)
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  // In a more complex system, you might want to blacklist the token
  // For now, just return success (client handles token deletion)
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const sanitized = {
    _id: req.user._id,
    email: req.user.email,
    username: req.user.username,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    fitnessLevel: req.user.fitnessLevel,
    goals: req.user.goals,
    isEmailVerified: req.user.isEmailVerified,
    isPremium: req.user.isPremium,
    stats: req.user.stats,
  };

  res.json({
    success: true,
    data: { user: sanitized }
  });
}));

module.exports = router;
