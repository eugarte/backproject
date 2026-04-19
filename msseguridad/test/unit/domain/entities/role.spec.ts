import { Role } from '@domain/entities/role';
import { Permission } from '@domain/entities/permission';

describe('Role Entity', () => {
  let role: Role;

  beforeEach(() => {
    role = new Role();
    role.id = 'role-1';
    role.name = 'Administrator';
    role.slug = 'admin';
    role.description = 'System administrator with full access';
    role.hierarchyLevel = 100;
    role.isSystem = true;
    role.createdAt = new Date();
    role.updatedAt = new Date();
    role.permissions = [];
    role.users = [];
  });

  describe('basic properties', () => {
    it('should have id property', () => {
      expect(role.id).toBe('role-1');
    });

    it('should have name property', () => {
      expect(role.name).toBe('Administrator');
    });

    it('should have slug property', () => {
      expect(role.slug).toBe('admin');
    });

    it('should have description property', () => {
      expect(role.description).toBe('System administrator with full access');
    });

    it('should have hierarchy level', () => {
      expect(role.hierarchyLevel).toBe(100);
    });

    it('should track if system role', () => {
      expect(role.isSystem).toBe(true);
    });
  });

  describe('permissions', () => {
    it('should have empty permissions array by default', () => {
      expect(role.permissions).toEqual([]);
    });

    it('should add permissions', () => {
      const permission = new Permission();
      permission.id = 'perm-1';
      permission.resource = 'users';
      permission.action = 'read';
      permission.slug = 'users:read';
      role.permissions = [permission];
      expect(role.permissions).toHaveLength(1);
      expect(role.permissions[0].slug).toBe('users:read');
    });

    it('should have multiple permissions', () => {
      const perm1 = new Permission();
      perm1.id = 'perm-1';
      perm1.slug = 'users:read';
      const perm2 = new Permission();
      perm2.id = 'perm-2';
      perm2.slug = 'users:write';
      role.permissions = [perm1, perm2];
      expect(role.permissions).toHaveLength(2);
    });
  });

  describe('users', () => {
    it('should have users assigned', () => {
      expect(role.users).toEqual([]);
    });
  });

  describe('hierarchy', () => {
    it('should compare hierarchy levels', () => {
      const adminRole = new Role();
      adminRole.hierarchyLevel = 100;
      const userRole = new Role();
      userRole.hierarchyLevel = 10;
      expect(adminRole.hierarchyLevel).toBeGreaterThan(userRole.hierarchyLevel);
    });
  });

  describe('timestamps', () => {
    it('should have createdAt', () => {
      expect(role.createdAt).toBeInstanceOf(Date);
    });

    it('should have updatedAt', () => {
      expect(role.updatedAt).toBeInstanceOf(Date);
    });
  });
});
