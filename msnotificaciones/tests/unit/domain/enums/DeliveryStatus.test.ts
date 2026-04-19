import { DeliveryStatusCatalog } from '../../../../src/domain/enums/DeliveryStatus';
import { DeliveryStatusRepository } from '../../../../src/infrastructure/persistence/repositories/DeliveryStatusRepository';

// Mocks
jest.mock('../../../../src/infrastructure/persistence/config/data-source', () => ({
  AppDataSource: {
    isInitialized: true,
  },
}));

jest.mock('../../../../src/infrastructure/persistence/repositories/DeliveryStatusRepository');

describe('DeliveryStatusCatalog', () => {
  let mockRepository: jest.Mocked<DeliveryStatusRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    DeliveryStatusCatalog.reset();
    
    mockRepository = {
      findByCodes: jest.fn(),
      validateCode: jest.fn(),
    } as unknown as jest.Mocked<DeliveryStatusRepository>;

    (DeliveryStatusRepository as jest.Mock).mockImplementation(() => mockRepository);
  });

  afterEach(() => {
    DeliveryStatusCatalog.reset();
  });

  describe('Default Values', () => {
    it('should return default PENDING value', () => {
      expect(DeliveryStatusCatalog.PENDING).toBe('pending');
    });

    it('should return default QUEUED value', () => {
      expect(DeliveryStatusCatalog.QUEUED).toBe('queued');
    });

    it('should return default SENDING value', () => {
      expect(DeliveryStatusCatalog.SENDING).toBe('sending');
    });

    it('should return default DELIVERED value', () => {
      expect(DeliveryStatusCatalog.DELIVERED).toBe('delivered');
    });

    it('should return default FAILED value', () => {
      expect(DeliveryStatusCatalog.FAILED).toBe('failed');
    });

    it('should return default RETRYING value', () => {
      expect(DeliveryStatusCatalog.RETRYING).toBe('retrying');
    });

    it('should return default CANCELLED value', () => {
      expect(DeliveryStatusCatalog.CANCELLED).toBe('cancelled');
    });
  });

  describe('getAll', () => {
    it('should return all default values when not initialized', () => {
      const all = DeliveryStatusCatalog.getAll();
      expect(all).toContain('pending');
      expect(all).toContain('delivered');
      expect(all).toContain('failed');
    });
  });

  describe('validate', () => {
    it('should validate using default values when repository not available', async () => {
      const result = await DeliveryStatusCatalog.validate('pending');
      expect(result).toBe(true);
    });

    it('should return false for invalid value with defaults', async () => {
      const result = await DeliveryStatusCatalog.validate('invalid');
      expect(result).toBe(false);
    });
  });
});