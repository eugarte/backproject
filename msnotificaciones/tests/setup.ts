// Jest setup file for msnotificaciones tests
// Configures test environment

// Mock del AppDataSource ANTES de que se carguen otros módulos
jest.mock('../src/infrastructure/persistence/config/data-source', () => ({
  AppDataSource: {
    isInitialized: false,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn(),
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MSSISTEMAS_URL = 'http://localhost:3001';
process.env.MSSISTEMAS_API_KEY = 'test-api-key';