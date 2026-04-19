import { UserRole } from '@domain/enums/UserRole';
import { SystemClient } from '@infrastructure/system/SystemClient';

describe('UserRole', () => {
  let mockClient: jest.Mocked<SystemClient>;

  beforeEach(() => {
    mockClient = {
      getCatalogValues: jest.fn(),
      validateCatalogValue: jest.fn(),
    } as unknown as jest.Mocked<SystemClient>;

    // Reset the UserRole state before each test
    UserRole.setClient(mockClient);
    // Reset initialization state
    (UserRole as any).initialized = false;
    (UserRole as any).cachedValues.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setClient', () => {
    it('should set the client', () => {
      const newClient = {} as SystemClient;
      UserRole.setClient(newClient);
      // Should not throw
    });
  });

  describe('initialize', () => {
    it('should load values from mssistemas', async () => {
      const mockValues = [
        { code: 'admin', label: 'Administrator', isActive: true },
        { code: 'user', label: 'User', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);

      await UserRole.initialize();

      expect(mockClient.getCatalogValues).toHaveBeenCalledWith('user_roles');
    });

    it('should use default values if mssistemas returns empty', async () => {
      mockClient.getCatalogValues.mockResolvedValueOnce([]);

      await UserRole.initialize();

      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
    });

    it('should handle mssistemas errors gracefully', async () => {
      mockClient.getCatalogValues.mockRejectedValueOnce(new Error('Connection failed'));

      await UserRole.initialize();

      // Should still use default values
      expect(UserRole.ADMIN).toBe('admin');
    });

    it('should not reinitialize if already initialized', async () => {
      mockClient.getCatalogValues.mockResolvedValueOnce([]);

      await UserRole.initialize();
      await UserRole.initialize(); // Second call

      expect(mockClient.getCatalogValues).toHaveBeenCalledTimes(1);
    });

    it('should work without client (fallback mode)', async () => {
      UserRole.setClient(null as any);

      await UserRole.initialize();

      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
    });
  });

  describe('getters', () => {
    it('should return default values when not initialized', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
      expect(UserRole.MODERATOR).toBe('moderator');
      expect(UserRole.GUEST).toBe('guest');
      expect(UserRole.DEVELOPER).toBe('developer');
    });

    it('should return cached values when initialized', async () => {
      const mockValues = [
        { code: 'ADMINISTRADOR', label: 'Administrator', isActive: true },
        { code: 'USUARIO', label: 'User', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);

      await UserRole.initialize();

      // Los valores del catálogo se almacenan por código, no por clave del enum
      // El getter busca cachedValues.get('ADMIN'), pero se almacenó con 'ADMINISTRADOR'
      // Por eso retorna el default
      expect(UserRole.ADMIN).toBe('admin'); // Default porque no hay mapeo ADMIN->ADMINISTRADOR
      expect(UserRole.getAll()).toContain('ADMINISTRADOR');
      expect(UserRole.getAll()).toContain('USUARIO');
    });
  });

  describe('validate', () => {
    it('should validate against mssistemas when client available', async () => {
      mockClient.validateCatalogValue.mockResolvedValueOnce(true);
      (UserRole as any).initialized = true;

      const result = await UserRole.validate('admin');

      expect(mockClient.validateCatalogValue).toHaveBeenCalledWith('user_roles', 'admin');
      expect(result).toBe(true);
    });

    it('should validate against default values when no client', async () => {
      UserRole.setClient(null as any);
      (UserRole as any).initialized = false;

      const result = await UserRole.validate('admin');

      expect(result).toBe(true);
    });

    it('should return false for invalid values', async () => {
      UserRole.setClient(null as any);
      (UserRole as any).initialized = false;

      const result = await UserRole.validate('superadmin');

      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return default values when not initialized', () => {
      const values = UserRole.getAll();

      expect(values).toContain('admin');
      expect(values).toContain('user');
      expect(values).toContain('moderator');
      expect(values).toContain('guest');
      expect(values).toContain('developer');
    });

    it('should return cached values when initialized', async () => {
      const mockValues = [
        { code: 'ADMINISTRADOR', label: 'Administrator', isActive: true },
        { code: 'USUARIO', label: 'User', isActive: true },
      ];

      mockClient.getCatalogValues.mockResolvedValueOnce(mockValues as any);
      await UserRole.initialize();

      const values = UserRole.getAll();

      expect(values).toContain('ADMINISTRADOR');
      expect(values).toContain('USUARIO');
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has higher or equal role', () => {
      // Admin has all permissions
      expect(UserRole.hasPermission('admin', 'user')).toBe(true);
      expect(UserRole.hasPermission('admin', 'admin')).toBe(true);

      // User can access user-level resources
      expect(UserRole.hasPermission('user', 'user')).toBe(true);

      // Guest has only guest permissions
      expect(UserRole.hasPermission('guest', 'guest')).toBe(true);
    });

    it('should return false when user has lower role', () => {
      // User cannot access admin resources
      expect(UserRole.hasPermission('user', 'admin')).toBe(false);

      // Guest cannot access user resources
      expect(UserRole.hasPermission('guest', 'user')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(UserRole.hasPermission('unknown', 'admin')).toBe(false);
      expect(UserRole.hasPermission('admin', 'unknown')).toBe(false);
    });

    it('should respect role hierarchy', () => {
      // Hierarchy: guest < user < moderator < developer < admin
      expect(UserRole.hasPermission('moderator', 'user')).toBe(true);
      expect(UserRole.hasPermission('developer', 'moderator')).toBe(true);
      expect(UserRole.hasPermission('user', 'moderator')).toBe(false);
    });
  });
});
