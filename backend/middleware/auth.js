const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Resolve User model at request-time to avoid race with late Mongo connections
const getUserModel = () => {
  const isMongoConnected = mongoose.connection?.readyState === 1;
  if (process.env.USE_IN_MEMORY_DB === 'true' || !isMongoConnected) {
    if (!isMongoConnected) {
      console.warn('Auth middleware: using in-memory User model (Mongo not connected).');
    }
    return require('../temp-memory-db');
  }
  return require('../models/User');
};

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (supports both Mongoose and in-memory implementations)
    const User = getUserModel();
    // Some implementations (e.g., Mongoose) return a Query that supports chainable select()
    // Our in-memory fallback returns a Promise<User>, so we need a two-step resolve
    let user = await User.findById(decoded.userId);
    if (user && typeof user.select === 'function') {
      // In-memory select() is implemented on the instance; for Mongoose, this is harmless
      user = user.select('-password');
    }
    
    if (!user) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token - user not found'
        }
      });
    }

    if (!user.isActive) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Account is deactivated'
        }
      });
    }

    // Add user to request object
    req.user = user;
    // Trial enforcement (30 days) if not premium
    try {
      const now = Date.now();
      const isPremium = Boolean(user.isPremium);
      const premiumExpiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt).getTime() : null;
      const createdAtMs = user.createdAt ? new Date(user.createdAt).getTime() : null;
      const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : (createdAtMs ? createdAtMs + 30*24*60*60*1000 : null);
      const premiumActive = premiumExpiresAt && premiumExpiresAt > now;
      if (!premiumActive && !isPremium && trialEndsAt && now > trialEndsAt) {
        const full = `${req.baseUrl || ''}${req.path || ''}`;
        const allow = ['/api/auth', '/api/auth/me'];
        const allowed = allow.some(p => full.startsWith(p));
        if (!allowed) {
          return res.status(402).json({ success: false, message: 'Trial expired. Please upgrade.' });
        }
      }
    } catch {}
    next();
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token expired'
        }
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Middleware to check if user is premium
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    // Check if premium has expired
    if (req.user.premiumExpiresAt && new Date() > req.user.premiumExpiresAt) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription has expired'
      });
    }

    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Premium check error'
    });
  }
};

// Middleware to check if user has verified email
const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification check error'
    });
  }
};

// Middleware to check user permissions
const checkPermissions = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // For now, we'll implement basic role-based permissions
      // In a more complex system, you might have roles and permissions tables
      
      if (requiredPermissions.length === 0) {
        return next();
      }

      // Check if user has admin role (you can expand this)
      if (req.user.role === 'admin') {
        return next();
      }

      // Check specific permissions
      const hasPermission = requiredPermissions.some(permission => 
        req.user.permissions && req.user.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check error'
      });
    }
  };
};

// Middleware to rate limit specific actions
const rateLimitAction = (action, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return async (req, res, next) => {
    try {
      const userId = req.user._id.toString();
      const key = `${userId}:${action}`;
      const now = Date.now();
      
      const userAttempts = attempts.get(key) || [];
      
      // Remove old attempts outside the window
      const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: `Too many ${action} attempts. Please try again later.`
        });
      }
      
      // Add current attempt
      validAttempts.push(now);
      attempts.set(key, validAttempts);
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  requirePremium,
  requireEmailVerification,
  checkPermissions,
  rateLimitAction,
  generateToken,
  generateRefreshToken
};
