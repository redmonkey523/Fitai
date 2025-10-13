/**
 * User-based rate limiting middleware
 * Implements token bucket algorithm per userId instead of per IP
 */

// Simple in-memory store for rate limiting
// For production, consider using Redis
const userRateLimits = new Map();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [userId, data] of userRateLimits.entries()) {
    if (now - data.lastReset > oneHour) {
      userRateLimits.delete(userId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message
 * @returns {Function} Express middleware
 */
function createUserRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests from this user, please try again later.'
  } = options;

  return function userRateLimiter(req, res, next) {
    // Skip rate limiting if no user (unauthenticated requests)
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id.toString();
    const now = Date.now();

    // Get or create user's rate limit data
    let userData = userRateLimits.get(userId);
    
    if (!userData) {
      userData = {
        count: 0,
        lastReset: now,
        firstRequest: now
      };
      userRateLimits.set(userId, userData);
    }

    // Reset counter if window has passed
    if (now - userData.lastReset > windowMs) {
      userData.count = 0;
      userData.lastReset = now;
      userData.firstRequest = now;
    }

    // Increment request count
    userData.count += 1;

    // Check if limit exceeded
    if (userData.count > maxRequests) {
      const retryAfter = Math.ceil((userData.lastReset + windowMs - now) / 1000);
      
      // Set headers
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(userData.lastReset + windowMs).toISOString());

      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
          retry_after: retryAfter
        }
      });
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - userData.count);
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(userData.lastReset + windowMs).toISOString());

    next();
  };
}

/**
 * Aggressive rate limiter for expensive operations
 */
const aggressiveUserRateLimiter = createUserRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests to this endpoint, please slow down.'
});

/**
 * Standard rate limiter for normal API requests
 */
const standardUserRateLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this user, please try again later.'
});

/**
 * Lenient rate limiter for read-only operations
 */
const lenientUserRateLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many requests from this user, please try again later.'
});

module.exports = {
  createUserRateLimiter,
  aggressiveUserRateLimiter,
  standardUserRateLimiter,
  lenientUserRateLimiter,
  userRateLimits // Export for testing/monitoring
};

