import { GetUserProfileUseCase } from '@application/use-cases/auth/get-user-profile.use-case';
import { UserRepository } from '@domain/repositories/user-repository.interface';
import { User, UserStatus } from '@domain/entities/user';
import { Role } from '@domain/entities/role';
import { Permission } from '@domain/entities/permission';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as jest.Mocked<UserRepository>;

    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should return user profile with roles and permissions', async () => {
      // Arrange
      const permission = new Permission();
      permission.id = 'perm-1';
      permission.slug = 'users:read';
      permission.resource = 'users';
      permission.action = 'read';

      const role = new Role();
      role.id = 'role-1';
      role.name = 'Admin';
      role.slug = 'admin';
      role.permissions = [permission];

      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.status = UserStatus.ACTIVE;
      user.mfaEnabled = false;
      user.createdAt = new Date('2024-01-01');
      user.roles = [role];

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].slug).toBe('admin');
      expect(result.permissions).toContain('users:read');
    });

    it('should return empty roles and permissions when user has no roles', async () => {
      // Arrange
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.status = UserStatus.ACTIVE;
      user.mfaEnabled = false;
      user.createdAt = new Date('2024-01-01');
      user.roles = [];

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should deduplicate permissions when user has multiple roles with same permission', async () => {
      // Arrange
      const permission = new Permission();
      permission.id = 'perm-1';
      permission.slug = 'users:read';
      permission.resource = 'users';
      permission.action = 'read';

      const role1 = new Role();
      role1.id = 'role-1';
      role1.name = 'Admin';
      role1.slug = 'admin';
      role1.permissions = [permission];

      const role2 = new Role();
      role2.id = 'role-2';
      role2.name = 'Manager';
      role2.slug = 'manager';
      role2.permissions = [permission]; // Same permission

      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.status = UserStatus.ACTIVE;
      user.mfaEnabled = false;
      user.createdAt = new Date('2024-01-01');
      user.roles = [role1, role2];

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0]).toBe('users:read');
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ userId: 'non-existent' }))
        .rejects
        .toThrow('User not found');
    });

    it('should include optional lastLoginAt when present', async () => {
      // Arrange
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.status = UserStatus.ACTIVE;
      user.mfaEnabled = false;
      user.createdAt = new Date('2024-01-01');
      user.lastLoginAt = new Date('2024-04-01');
      user.roles = [];

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.lastLoginAt).toEqual(user.lastLoginAt);
    });

    it('should not include lastLoginAt when not present', async () => {
      // Arrange
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.status = UserStatus.ACTIVE;
      user.mfaEnabled = false;
      user.createdAt = new Date('2024-01-01');
      user.roles = [];

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.lastLoginAt).toBeUndefined();
    });
  });
});