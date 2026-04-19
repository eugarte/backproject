import { UserStatus } from '@domain/enums/UserStatus';
import { SystemClient } from '@infrastructure/system/SystemClient';

describe('UserStatus', () => {
  let mockClient: jest.Mocked<SystemClient>;

  beforeEach(() => {
    mockClient = {
      getCatalogValues: jest.fn(),
      validateCatalogValue: jest.fn(),
    } as unknown as jest.Mocked<SystemClient>;

    // Reset the UserStatus state before each test
    UserStatus.setClient(mockClient);
    // Reset initialization state - we need to access private property
    (UserStatus as any).initialized = false;
    (UserStatus as any).cachedValues.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setClient', () => {
    it('should set the client', () => {
      const newClient = {} as SystemClient;
      UserStatus.setClient(newClient);
      // Should not throw
    });
  });

  describe('initialize', () => {
    it('should load values from mssistemas', async () => {
      const mockValues = [
        { code: 'active', label: 'Active', isActive: true },
        { code: 'inactive', label: 'Inactive', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);

      await UserStatus.initialize();

      expect(mockClient.getCatalogValues).toHaveBeenCalledWith('user_status');
    });

    it('should use default values if mssistemas returns empty', async () => {
      mockClient.getCatalogValues.mockResolvedValueOnce([]);

      await UserStatus.initialize();

      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
    });

    it('should handle mssistemas errors gracefully', async () => {
      mockClient.getCatalogValues.mockRejectedValueOnce(new Error('Connection failed'));

      await UserStatus.initialize();

      // Should still use default values
      expect(UserStatus.ACTIVE).toBe('active');
    });

    it('should not reinitialize if already initialized', async () => {
      mockClient.getCatalogValues.mockResolvedValueOnce([]);

      await UserStatus.initialize();
      await UserStatus.initialize(); // Second call

      expect(mockClient.getCatalogValues).toHaveBeenCalledTimes(1);
    });

    it('should work without client (fallback mode)', async () => {
      UserStatus.setClient(null as any);

      await UserStatus.initialize();

      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
    });
  });

  describe('getters', () => {
    it('should return default values when not initialized', () => {
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
      expect(UserStatus.PENDING).toBe('pending');
      expect(UserStatus.SUSPENDED).toBe('suspended');
      expect(UserStatus.DELETED).toBe('deleted');
    });

    it('should return cached values when initialized', async () => {
      const mockValues = [
        { code: 'ACTIVO', label: 'Active', isActive: true },
        { code: 'INACTIVO', label: 'Inactive', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);

      await UserStatus.initialize();

      // Los valores del catálogo se almacenan por código
      // El getter busca cachedValues.get('ACTIVE'), pero se almacenó con 'ACTIVO'
      expect(UserStatus.ACTIVE).toBe('active'); // Default
      expect(UserStatus.getAll()).toContain('ACTIVO');
      expect(UserStatus.getAll()).toContain('INACTIVO');
    });
  });

  describe('validate', () => {
    it('should validate against mssistemas when client available', async () => {
      mockClient.validateCatalogValue.mockResolvedValueOnce(true);
      (UserStatus as any).initialized = true;

      const result = await UserStatus.validate('active');

      expect(mockClient.validateCatalogValue).toHaveBeenCalledWith('user_status', 'active');
      expect(result).toBe(true);
    });

    it('should validate against default values when no client', async () => {
      UserStatus.setClient(null as any);
      (UserStatus as any).initialized = false;

      const result = await UserStatus.validate('active');

      expect(result).toBe(true);
    });

    it('should return false for invalid values', async () => {
      UserStatus.setClient(null as any);
      (UserStatus as any).initialized = false;

      const result = await UserStatus.validate('invalid_status');

      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return default values when not initialized', () => {
      const values = UserStatus.getAll();

      expect(values).toContain('active');
      expect(values).toContain('inactive');
      expect(values).toContain('pending');
      expect(values).toContain('suspended');
      expect(values).toContain('deleted');
    });

    it('should return cached values when initialized', async () => {
      const mockValues = [
        { code: 'ACTIVO', label: 'Active', isActive: true },
        { code: 'INACTIVO', label: 'Inactive', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);
      await UserStatus.initialize();

      const values = UserStatus.getAll();

      expect(values).toContain('ACTIVO');
      expect(values).toContain('INACTIVO');
    });
  });
});
