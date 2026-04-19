import { NotificationTypeCatalog } from '../../../../src/domain/enums/NotificationType';
import { NotificationTypeRepository } from '../../../../src/infrastructure/persistence/repositories/NotificationTypeRepository';

// Mocks
jest.mock('../../../../src/infrastructure/persistence/config/data-source', () => ({
  AppDataSource: {
    isInitialized: true,
  },
}));

jest.mock('../../../../src/infrastructure/persistence/repositories/NotificationTypeRepository');

describe('NotificationTypeCatalog', () => {
  let mockRepository: jest.Mocked<NotificationTypeRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    NotificationTypeCatalog.reset();
    
    mockRepository = {
      findByCodes: jest.fn(),
      validateCode: jest.fn(),
    } as unknown as jest.Mocked<NotificationTypeRepository>;

    (NotificationTypeRepository as jest.Mock).mockImplementation(() => mockRepository);
  });

  afterEach(() => {
    NotificationTypeCatalog.reset();
  });

  describe('Default Values', () => {
    it('should return default EMAIL value', () => {
      expect(NotificationTypeCatalog.EMAIL).toBe('email');
    });

    it('should return default SMS value', () => {
      expect(NotificationTypeCatalog.SMS).toBe('sms');
    });

    it('should return default PUSH value', () => {
      expect(NotificationTypeCatalog.PUSH).toBe('push');
    });

    it('should return default IN_APP value', () => {
      expect(NotificationTypeCatalog.IN_APP).toBe('in_app');
    });
  });

  describe('getAll', () => {
    it('should return all default values when not initialized', () => {
      const all = NotificationTypeCatalog.getAll();
      expect(all).toContain('email');
      expect(all).toContain('sms');
      expect(all).toContain('push');
      expect(all).toContain('in_app');
    });
  });

  describe('validate', () => {
    it('should validate using default values when repository not available', async () => {
      const result = await NotificationTypeCatalog.validate('email');
      expect(result).toBe(true);
    });

    it('should return false for invalid value with defaults', async () => {
      const result = await NotificationTypeCatalog.validate('invalid');
      expect(result).toBe(false);
    });
  });
});