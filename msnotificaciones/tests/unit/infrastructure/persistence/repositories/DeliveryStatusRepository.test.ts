import { DataSource } from 'typeorm';
import { DeliveryStatusRepository } from '@infrastructure/persistence/repositories/DeliveryStatusRepository';

// Mock del DataSource
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockDataSource = {
  isInitialized: true,
  getRepository: jest.fn().mockReturnValue(mockRepository),
} as unknown as DataSource;

describe('DeliveryStatusRepository', () => {
  let repository: DeliveryStatusRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new DeliveryStatusRepository(mockDataSource);
  });

  describe('findAll', () => {
    it('should return all active delivery status ordered by order', async () => {
      const mockEntities = [
        { id: '1', code: 'PENDING', label: 'Pendiente', description: 'Pendiente', isActive: true, order: 1 },
        { id: '2', code: 'DELIVERED', label: 'Entregada', description: 'Entregada', isActive: true, order: 2 },
      ];
      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('PENDING');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { order: 'ASC' },
      });
    });

    it('should return empty array when no delivery status exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCode', () => {
    it('should return delivery status by code', async () => {
      const mockEntity = { id: '1', code: 'PENDING', label: 'Pendiente', isActive: true, order: 1 };
      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await repository.findByCode('PENDING');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('PENDING');
    });

    it('should return null when delivery status not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('validateCode', () => {
    it('should return true for valid code', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.validateCode('DELIVERED');

      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await repository.validateCode('INVALID');

      expect(result).toBe(false);
    });
  });
});