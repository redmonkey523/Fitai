// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user ? req.user._id : 'unauthenticated',
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests';
    error = { message, statusCode: 429 };
  }

  // Network errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = { message, statusCode: 503 };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Set Content-Type header
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Add Retry-After header for rate limiting
  if (statusCode === 429) {
    res.setHeader('Retry-After', '60'); // 60 seconds
  }

  // Map status code to error code
  const errorCode = statusCode === 400 ? 'BAD_REQUEST'
    : statusCode === 401 ? 'UNAUTHORIZED'
    : statusCode === 403 ? 'FORBIDDEN'
    : statusCode === 404 ? 'NOT_FOUND'
    : statusCode === 429 ? 'TOO_MANY_REQUESTS'
    : statusCode === 503 ? 'SERVICE_UNAVAILABLE'
    : 'INTERNAL_ERROR';

  // Format response according to spec: {error: {code, message}}
  const response = {
    error: {
      code: errorCode,
      message
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Basic validation - can be expanded
  if (req.method === 'POST' && !req.body && Object.keys(req.body || {}).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request body is required'
    });
  }
  next();
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  notFound,
  validateRequest
};
