// Test setup file
import 'reflect-metadata';

// Mock crypto.randomUUID for tests
if (!global.crypto) {
  (global as any).crypto = {};
}
(global.crypto as any).randomUUID = () => 'test-uuid-' + Math.random().toString(36).substring(2, 15);

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'msclientes_test';
