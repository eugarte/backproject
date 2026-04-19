import { Address } from '../../../src/domain/entities/address';
import { AddressType } from '../../../src/domain/value-objects/customer-enums';

describe('Address Entity', () => {
  const validAddressProps = {
    id: 'addr-001',
    customerId: 'cust-001',
    addressType: AddressType.HOME,
    street: 'Calle Mayor',
    streetNumber: '10',
    apartment: '2B',
    city: 'Madrid',
    stateProvince: 'Madrid',
    postalCode: '28001',
    country: 'Spain',
    countryCode: 'ES',
    isPrimary: false,
    isVerified: false,
    latitude: 40.4168,
    longitude: -3.7038,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Creation', () => {
    it('should create a valid address', () => {
      const address = new Address(validAddressProps);
      expect(address.id).toBe('addr-001');
      expect(address.fullAddress).toContain('Calle Mayor');
      expect(address.fullAddress).toContain('Madrid');
    });

    it('should throw error for missing id', () => {
      expect(() => new Address({ ...validAddressProps, id: '' })).toThrow('Address ID is required');
    });

    it('should throw error for invalid country code', () => {
      expect(() => new Address({ ...validAddressProps, countryCode: 'ESP' })).toThrow('Valid country code');
    });
  });

  describe('Methods', () => {
    it('should set as primary', () => {
      const address = new Address(validAddressProps);
      address.setAsPrimary();
      expect(address.isPrimary).toBe(true);
    });

    it('should verify address', () => {
      const address = new Address(validAddressProps);
      address.verify();
      expect(address.isVerified).toBe(true);
    });

    it('should anonymize', () => {
      const address = new Address(validAddressProps);
      address.anonymize();
      expect(address.street).toBe('ANONYMIZED');
      expect(address.city).toBe('ANONYMIZED');
      expect(address.postalCode).toBe('00000');
    });
  });
});
