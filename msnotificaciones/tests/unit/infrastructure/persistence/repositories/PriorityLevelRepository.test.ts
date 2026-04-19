import { DataSource } from 'typeorm';
import { PriorityLevelRepository } from '@infrastructure/persistence/repositories/PriorityLevelRepository';

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

describe('PriorityLevelRepository', () => {
  let repository: PriorityLevelRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PriorityLevelRepository(mockDataSource);
  });

  describe('findAll', () => {
    it('should return all active priority levels ordered by order', async () => {
      const mockEntities = [
        { id: '1', code: 'LOW', label: 'Baja', isActive: true, order: 1 },
        { id: '2', code: 'HIGH', label: 'Alta', isActive: true, order: 2 },
      ];
      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('LOW');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { order: 'ASC' },
      });
    });

    it('should return empty array when no priority levels exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCode', () => {
    it('should return priority level by code', async () => {
      const mockEntity = { id: '1', code: 'HIGH', label: 'Alta', isActive: true, order: 1 };
      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await repository.findByCode('HIGH');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('HIGH');
    });

    it('should return null when priority level not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('validateCode', () => {
    it('should return true for valid code', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.validateCode('CRITICAL');

      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await repository.validateCode('INVALID');

      expect(result).toBe(false);
    });
  });
});