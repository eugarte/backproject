// Test setup file
import 'reflect-metadata';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = 'test-32-character-key-here!!!';
process.env.ENCRYPTION_IV = 'test-16-char-iv';

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Add any cleanup logic here
});