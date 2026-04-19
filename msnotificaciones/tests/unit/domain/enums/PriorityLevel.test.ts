import { PriorityLevelCatalog } from '../../../../src/domain/enums/PriorityLevel';
import { PriorityLevelRepository } from '../../../../src/infrastructure/persistence/repositories/PriorityLevelRepository';

// Mocks
jest.mock('../../../../src/infrastructure/persistence/config/data-source', () => ({
  AppDataSource: {
    isInitialized: true,
  },
}));

jest.mock('../../../../src/infrastructure/persistence/repositories/PriorityLevelRepository');

describe('PriorityLevelCatalog', () => {
  let mockRepository: jest.Mocked<PriorityLevelRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    PriorityLevelCatalog.reset();
    
    mockRepository = {
      findByCodes: jest.fn(),
      validateCode: jest.fn(),
    } as unknown as jest.Mocked<PriorityLevelRepository>;

    (PriorityLevelRepository as jest.Mock).mockImplementation(() => mockRepository);
  });

  afterEach(() => {
    PriorityLevelCatalog.reset();
  });

  describe('Default Values', () => {
    it('should return default LOW value', () => {
      expect(PriorityLevelCatalog.LOW).toBe('low');
    });

    it('should return default MEDIUM value', () => {
      expect(PriorityLevelCatalog.MEDIUM).toBe('medium');
    });

    it('should return default HIGH value', () => {
      expect(PriorityLevelCatalog.HIGH).toBe('high');
    });

    it('should return default CRITICAL value', () => {
      expect(PriorityLevelCatalog.CRITICAL).toBe('critical');
    });
  });

  describe('getAll', () => {
    it('should return all default values when not initialized', () => {
      const all = PriorityLevelCatalog.getAll();
      expect(all).toContain('low');
      expect(all).toContain('medium');
      expect(all).toContain('high');
      expect(all).toContain('critical');
    });
  });

  describe('validate', () => {
    it('should validate using default values when repository not available', async () => {
      const result = await PriorityLevelCatalog.validate('high');
      expect(result).toBe(true);
    });

    it('should return false for invalid value with defaults', async () => {
      const result = await PriorityLevelCatalog.validate('invalid');
      expect(result).toBe(false);
    });
  });
});