// Jest setup file for msnotificaciones tests
// Configures test environment

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MSSISTEMAS_URL = 'http://localhost:3001';
process.env.MSSISTEMAS_API_KEY = 'test-api-key';

// Mock console methods during tests to reduce noise
// Uncomment to enable:
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
