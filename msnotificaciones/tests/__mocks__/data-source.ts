// Mock del AppDataSource para evitar cargar el driver de MySQL en tests
jest.mock('../src/infrastructure/persistence/config/data-source', () => ({
  AppDataSource: {
    isInitialized: false,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn(),
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));