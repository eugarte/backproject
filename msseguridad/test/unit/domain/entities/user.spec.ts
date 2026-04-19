import { User, UserStatus } from '../../../../src/domain/entities/user';
import { Role } from '../../../../src/domain/entities/role';

describe('User Entity', () => {
  let user: User;
  let role: Role;

  beforeEach(() => {
    role = new Role();
    role.id = 'role-1';
    role.name = 'User';
    role.slug = 'user';
    role.hierarchyLevel = 1;

    user = new User();
    user.id = 'user-123';
    user.email = 'test@example.com';
    user.passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$hashedpassword';
    user.status = UserStatus.ACTIVE;
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.lockedUntil = null;
    user.failedAttempts = 0;
    user.failedMfaAttempts = 0;
    user.roles = [role];
    user.refreshTokens = [];
    user.sessions = [];
    user.createdAt = new Date();
    user.updatedAt = new Date();
  });

  describe('isLocked', () => {
    it('should return false when user is not locked', () => {
      expect(user.isLocked()).toBe(false);
    });

    it('should return true when user is locked', () => {
      user.lockedUntil = new Date(Date.now() + 3600000); // 1 hour from now
      expect(user.isLocked()).toBe(true);
    });

    it('should return false when lock has expired', () => {
      user.lockedUntil = new Date(Date.now() - 3600000); // 1 hour ago
      expect(user.isLocked()).toBe(false);
    });

    it('should return false when lockedUntil is null', () => {
      user.lockedUntil = null;
      expect(user.isLocked()).toBe(false);
    });
  });

  describe('canLogin', () => {
    it('should return true for active user not locked', () => {
      expect(user.canLogin()).toBe(true);
    });

    it('should return false for pending user', () => {
      user.status = UserStatus.PENDING;
      expect(user.canLogin()).toBe(false);
    });

    it('should return false for locked user', () => {
      user.lockedUntil = new Date(Date.now() + 3600000);
      expect(user.canLogin()).toBe(false);
    });

    it('should return false for suspended user', () => {
      user.status = UserStatus.SUSPENDED;
      expect(user.canLogin()).toBe(false);
    });

    it('should return false for inactive user', () => {
      user.status = UserStatus.INACTIVE;
      expect(user.canLogin()).toBe(false);
    });
  });

  describe('UserStatus enum', () => {
    it('should have correct status values', () => {
      expect(UserStatus.PENDING).toBe('pending');
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.LOCKED).toBe('locked');
      expect(UserStatus.SUSPENDED).toBe('suspended');
      expect(UserStatus.INACTIVE).toBe('inactive');
    });
  });

  describe('user properties', () => {
    it('should have email property', () => {
      expect(user.email).toBe('test@example.com');
    });

    it('should have passwordHash property', () => {
      expect(user.passwordHash).toContain('argon2id');
    });

    it('should have roles array', () => {
      expect(user.roles).toHaveLength(1);
      expect(user.roles[0].name).toBe('User');
    });

    it('should track failed attempts', () => {
      user.failedAttempts = 3;
      expect(user.failedAttempts).toBe(3);
    });

    it('should track MFA attempts', () => {
      user.failedMfaAttempts = 2;
      expect(user.failedMfaAttempts).toBe(2);
    });
  });
});
