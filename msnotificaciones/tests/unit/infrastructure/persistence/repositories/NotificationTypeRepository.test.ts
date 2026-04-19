import { DataSource } from 'typeorm';
import { NotificationTypeRepository } from '@infrastructure/persistence/repositories/NotificationTypeRepository';

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

describe('NotificationTypeRepository', () => {
  let repository: NotificationTypeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new NotificationTypeRepository(mockDataSource);
  });

  describe('findAll', () => {
    it('should return all active notification types ordered by order', async () => {
      const mockEntities = [
        { id: '1', code: 'EMAIL', label: 'Email', description: 'Email notif', isActive: true, order: 1 },
        { id: '2', code: 'SMS', label: 'SMS', description: 'SMS notif', isActive: true, order: 2 },
      ];
      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('EMAIL');
      expect(result[1].code).toBe('SMS');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { order: 'ASC' },
      });
    });

    it('should return empty array when no notification types exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCode', () => {
    it('should return notification type by code', async () => {
      const mockEntity = { id: '1', code: 'EMAIL', label: 'Email', description: 'Email notif', isActive: true, order: 1 };
      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await repository.findByCode('EMAIL');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('EMAIL');
      expect(result?.label).toBe('Email');
    });

    it('should return null when notification type not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should search with uppercase code', async () => {
      const mockEntity = { id: '1', code: 'EMAIL', label: 'Email', description: null, isActive: true, order: 1 };
      mockRepository.findOne.mockResolvedValue(mockEntity);

      await repository.findByCode('email');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'EMAIL', isActive: true },
      });
    });
  });

  describe('findByCodes', () => {
    it('should return map of codes to lowercase values', async () => {
      const mockEntities = [
        { id: '1', code: 'EMAIL', label: 'Email', isActive: true, order: 1 },
        { id: '2', code: 'SMS', label: 'SMS', isActive: true, order: 2 },
      ];
      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await repository.findByCodes(['EMAIL', 'SMS']);

      expect(result.get('EMAIL')).toBe('email');
      expect(result.get('SMS')).toBe('sms');
    });

    it('should only include requested codes', async () => {
      const mockEntities = [
        { id: '1', code: 'EMAIL', label: 'Email', isActive: true, order: 1 },
        { id: '2', code: 'SMS', label: 'SMS', isActive: true, order: 2 },
        { id: '3', code: 'PUSH', label: 'Push', isActive: true, order: 3 },
      ];
      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await repository.findByCodes(['EMAIL']);

      expect(result.size).toBe(1);
      expect(result.has('EMAIL')).toBe(true);
      expect(result.has('SMS')).toBe(false);
    });
  });

  describe('validateCode', () => {
    it('should return true for valid code', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.validateCode('EMAIL');

      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await repository.validateCode('INVALID');

      expect(result).toBe(false);
    });

    it('should validate with uppercase code', async () => {
      mockRepository.count.mockResolvedValue(1);

      await repository.validateCode('email');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { code: 'EMAIL', isActive: true },
      });
    });
  });
});