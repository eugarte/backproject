import { Email } from '../../../../src/domain/value-objects/email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('user@example.com');
      expect(email).toBeDefined();
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = Email.create('USER@EXAMPLE.COM');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  user@example.com  ');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid')).toThrow('Invalid email format');
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
      expect(() => Email.create('user@')).toThrow('Invalid email format');
      expect(() => Email.create('user@.com')).toThrow('Invalid email format');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email is required');
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'very.common@example.com',
        'disposable.style.email.with+symbol@example.com',
        'other.email-with-hyphen@example.com',
        'user.name+tag+sorting@example.com',
        'x@example.com',
        'example-indeed@strange-example.com'
      ];

      validEmails.forEach(email => {
        expect(() => Email.create(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missinglocal.com',
        'missing@domain@domain.com',
        '.email@example.com',
        'email.@example.com',
        'email..email@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => Email.create(email)).toThrow();
      });
    });
  });

  describe('getDomain', () => {
    it('should extract domain from email', () => {
      const email = Email.create('user@example.com');
      expect(email.getDomain()).toBe('example.com');
    });

    it('should extract domain from email with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.getDomain()).toBe('mail.example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should extract local part from email', () => {
      const email = Email.create('user@example.com');
      expect(email.getLocalPart()).toBe('user');
    });

    it('should extract local part with dots and plus', () => {
      const email = Email.create('user.name+tag@example.com');
      expect(email.getLocalPart()).toBe('user.name+tag');
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for same email with different case', () => {
      const email1 = Email.create('USER@EXAMPLE.COM');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string', () => {
      const email = Email.create('user@example.com');
      expect(email.toString()).toBe('user@example.com');
    });
  });
});
