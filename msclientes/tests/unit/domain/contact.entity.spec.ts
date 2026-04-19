import { Contact } from '../../../src/domain/entities/contact';
import { ContactType } from '../../../src/domain/value-objects/customer-enums';

describe('Contact Entity', () => {
  const validContactProps = {
    id: 'contact-001',
    customerId: 'cust-001',
    contactType: ContactType.EMAIL,
    value: 'test@example.com',
    label: 'Personal',
    isPrimary: false,
    isVerified: false,
    canContact: true,
    contactSchedule: '9-17',
    timezone: 'Europe/Madrid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Creation', () => {
    it('should create a valid email contact', () => {
      const contact = new Contact(validContactProps);
      expect(contact.value).toBe('test@example.com');
      expect(contact.contactType).toBe(ContactType.EMAIL);
    });

    it('should create a valid phone contact', () => {
      const contact = new Contact({
        ...validContactProps,
        contactType: ContactType.PHONE,
        value: '+1234567890',
      });
      expect(contact.value).toBe('+1234567890');
    });

    it('should throw error for invalid email', () => {
      expect(() => new Contact({
        ...validContactProps,
        value: 'invalid-email',
      })).toThrow('Invalid email format');
    });
  });

  describe('Methods', () => {
    it('should verify contact', () => {
      const contact = new Contact(validContactProps);
      contact.verify();
      expect(contact.isVerified).toBe(true);
      expect(contact.verificationDate).toBeDefined();
    });

    it('should anonymize', () => {
      const contact = new Contact(validContactProps);
      contact.anonymize();
      expect(contact.value).toBe('anonymized@deleted.local');
      expect(contact.canContact).toBe(false);
    });
  });
});
