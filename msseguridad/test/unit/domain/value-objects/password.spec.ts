import { Password } from '../../../../src/domain/value-objects/password';

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create a valid password', () => {
      const password = Password.create('SecureP@ssw0rd123');
      expect(password).toBeDefined();
      expect(password.getValue()).toBe('SecureP@ssw0rd123');
    });

    it('should throw error for password too short', () => {
      expect(() => Password.create('short')).toThrow('Password must be at least 12 characters');
    });

    it('should throw error for password without uppercase', () => {
      expect(() => Password.create('lowercase@12345')).toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without lowercase', () => {
      expect(() => Password.create('UPPERCASE@12345')).toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without number', () => {
      expect(() => Password.create('NoNumbers@Here!')).toThrow('Password must contain at least one number');
    });

    it('should throw error for password without special character', () => {
      expect(() => Password.create('NoSpecial12345')).toThrow('Password must contain at least one special character');
    });

    it('should accept password with all requirements', () => {
      const validPasswords = [
        'SecureP@ssw0rd123',
        'MyP@ss123!@#',
        'C0mpl3x!Pass',
        'Str0ng#Passw0rd'
      ];

      validPasswords.forEach(pwd => {
        expect(() => Password.create(pwd)).not.toThrow();
      });
    });

    it('should reject common passwords', () => {
      expect(() => Password.create('Password123!')).toThrow('Password is too common');
      expect(() => Password.create('Qwerty123!@#')).toThrow('Password is too common');
    });
  });

  describe('hash', () => {
    it('should hash password using argon2id', async () => {
      const password = Password.create('SecureP@ssw0rd123');
      const hashed = await password.hash();
      
      expect(hashed).toContain('$argon2id$');
      expect(hashed).not.toBe('SecureP@ssw0rd123');
    });

    it('should produce different hashes for same password', async () => {
      const password = Password.create('SecureP@ssw0rd123');
      const hash1 = await password.hash();
      const hash2 = await password.hash();
      
      expect(hash1).not.toBe(hash2); // Argon2id uses random salt
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = Password.create('SecureP@ssw0rd123');
      const hashed = await password.hash();
      
      const isValid = await Password.verify('SecureP@ssw0rd123', hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = Password.create('SecureP@ssw0rd123');
      const hashed = await password.hash();
      
      const isValid = await Password.verify('WrongP@ssw0rd123', hashed);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = Password.create('SecureP@ssw0rd123');
      const hashed = await password.hash();
      
      const isValid = await Password.verify('', hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('isHashed', () => {
    it('should return false for plain text', () => {
      const password = Password.create('SecureP@ssw0rd123');
      expect(password.isHashed()).toBe(false);
    });
  });
});
