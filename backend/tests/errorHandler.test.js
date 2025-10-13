const request = require('supertest');
const express = require('express');

let app;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  
  // Mock error handler middleware
  const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle different types of errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.errors
      });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Default error response
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  
  // Test routes that throw different types of errors
  app.get('/test/validation-error', (req, res, next) => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = ['Field is required'];
    next(error);
  });
  
  app.get('/test/unauthorized-error', (req, res, next) => {
    const error = new Error('Access denied');
    error.name = 'UnauthorizedError';
    next(error);
  });
  
  app.get('/test/not-found-error', (req, res, next) => {
    const error = new Error('User not found');
    error.name = 'NotFoundError';
    next(error);
  });
  
  app.get('/test/generic-error', (req, res, next) => {
    const error = new Error('Something went wrong');
    error.status = 500;
    next(error);
  });
  
  app.get('/test/async-error', async (req, res, next) => {
    try {
      throw new Error('Async operation failed');
    } catch (error) {
      next(error);
    }
  });
  
  // Apply error handler
  app.use(errorHandler);
});

describe('Error Handling Middleware', () => {
  describe('Validation Errors', () => {
    it('should handle validation errors with 400 status', async () => {
      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
      expect(response.body.errors).toBeDefined();
    });
  });
  
  describe('Unauthorized Errors', () => {
    it('should handle unauthorized errors with 401 status', async () => {
      const response = await request(app)
        .get('/test/unauthorized-error')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
  
  describe('Not Found Errors', () => {
    it('should handle not found errors with 404 status', async () => {
      const response = await request(app)
        .get('/test/not-found-error')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Resource not found');
    });
  });
  
  describe('Generic Errors', () => {
    it('should handle generic errors with 500 status', async () => {
      const response = await request(app)
        .get('/test/generic-error')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Something went wrong');
    });
  });
  
  describe('Async Errors', () => {
    it('should handle async errors properly', async () => {
      const response = await request(app)
        .get('/test/async-error')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Async operation failed');
    });
  });
  
  describe('Error Response Structure', () => {
    it('should return consistent error response structure', async () => {
      const response = await request(app)
        .get('/test/generic-error')
        .expect(500);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
    });
  });
});

describe('Input Validation', () => {
  it('should validate required fields', () => {
    const validateRequired = (obj, fields) => {
      const errors = [];
      fields.forEach(field => {
        if (!obj[field] || obj[field].toString().trim() === '') {
          errors.push(`${field} is required`);
        }
      });
      return errors;
    };
    
    const validData = { name: 'John', email: 'john@example.com' };
    const invalidData = { name: '', email: 'john@example.com' };
    const emptyData = {};
    
    expect(validateRequired(validData, ['name', 'email'])).toHaveLength(0);
    expect(validateRequired(invalidData, ['name', 'email'])).toContain('name is required');
    expect(validateRequired(emptyData, ['name', 'email'])).toHaveLength(2);
  });
  
  it('should validate email format', () => {
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
  });
  
  it('should validate numeric ranges', () => {
    const validateRange = (value, min, max) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    };
    
    expect(validateRange('10', 0, 100)).toBe(true);
    expect(validateRange('-5', 0, 100)).toBe(false);
    expect(validateRange('150', 0, 100)).toBe(false);
    expect(validateRange('abc', 0, 100)).toBe(false);
  });
});

describe('Security Validation', () => {
  it('should prevent SQL injection patterns', () => {
    const containsSqlInjection = (input) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
        /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
        /(\b(EXEC|EXECUTE)\b)/i,
        /(\b(SCRIPT|JAVASCRIPT)\b)/i
      ];
      
      return sqlPatterns.some(pattern => pattern.test(input));
    };
    
    expect(containsSqlInjection('SELECT * FROM users')).toBe(true);
    expect(containsSqlInjection('DROP TABLE users')).toBe(true);
    expect(containsSqlInjection('normal text')).toBe(false);
    expect(containsSqlInjection('user@example.com')).toBe(false);
  });
  
  it('should validate password strength', () => {
    const validatePassword = (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      return password.length >= minLength && 
             hasUpperCase && 
             hasLowerCase && 
             hasNumbers && 
             hasSpecialChar;
    };
    
    expect(validatePassword('StrongPass123!')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('NoSpecialChar123')).toBe(false);
    expect(validatePassword('nouppercase123!')).toBe(false);
  });
});
