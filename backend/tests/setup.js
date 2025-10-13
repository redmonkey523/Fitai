// Test setup file for backend tests
const mongoose = require('mongoose');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/fitness_app_test';

// Global test timeout
jest.setTimeout(10000);

// Setup before all tests
beforeAll(async () => {
  // Skip database connection for now - use mocked tests
  console.log('Using mocked tests - no database connection required');
}, 1000);

// Cleanup after all tests
afterAll(async () => {
  // No database cleanup needed for mocked tests
  console.log('Test cleanup completed');
}, 1000);

// Clean up after each test
afterEach(async () => {
  // No database cleanup needed for mocked tests
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
