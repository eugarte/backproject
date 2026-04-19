import { Customer } from '../../../src/domain/entities/customer';
import { CustomerStatus, CustomerType, Gender } from '../../../src/domain/value-objects/customer-enums';

describe('Customer Entity', () => {
  // Factory function to create fresh props for each test
  const createValidCustomerProps = () => ({
    id: 'cust-001',
    customerCode: 'CUST-2024-000001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    taxId: '12345678A',
    taxIdType: 'DNI',
    dateOfBirth: new Date('1990-01-01'),
    gender: Gender.MALE,
    nationality: 'ES',
    preferredLanguage: 'es',
    status: CustomerStatus.ACTIVE,
    customerType: CustomerType.INDIVIDUAL,
    companyName: undefined,
    industry: undefined,
    annualRevenue: undefined,
    employeeCount: undefined,
    creditScore: undefined,
    creditLimit: undefined,
    gdprConsent: false,
    marketingConsent: false,
    dataProcessingConsent: false,
    // 8 Custom Fields
    customVarchar: undefined,
    customInt: undefined,
    customDecimal: undefined,
    customDatetime: undefined,
    customBool: undefined,
    customText: undefined,
    customJson: undefined,
    customDate: undefined,
    addresses: [],
    contacts: [],
    documents: [],
    tags: [],
    preferences: [],
    creditHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('Creation', () => {
    it('should create a valid customer', () => {
      const customer = new Customer(createValidCustomerProps());
      expect(customer.id).toBe('cust-001');
      expect(customer.fullName).toBe('John Doe');
      expect(customer.status).toBe(CustomerStatus.ACTIVE);
    });

    it('should throw error for missing id', () => {
      const props = createValidCustomerProps();
      expect(() => new Customer({ ...props, id: '' })).toThrow('Customer ID is required');
    });

    it('should throw error for missing customer code', () => {
      const props = createValidCustomerProps();
      expect(() => new Customer({ ...props, customerCode: '' })).toThrow('Customer code is required');
    });

    it('should throw error for missing first name', () => {
      const props = createValidCustomerProps();
      expect(() => new Customer({ ...props, firstName: '' })).toThrow('First name is required');
    });

    it('should throw error for invalid email', () => {
      const props = createValidCustomerProps();
      expect(() => new Customer({ ...props, email: 'invalid-email' })).toThrow('Invalid email format');
    });
  });

  describe('Creation with Custom Fields', () => {
    it('should create customer with all 8 custom fields', () => {
      const customer = new Customer({
        ...createValidCustomerProps(),
        customVarchar: 'Texto personalizado',
        customInt: 42,
        customDecimal: 123.4567,
        customDatetime: new Date('2024-01-15T10:30:00'),
        customBool: true,
        customText: 'Texto largo personalizado con mucho contenido',
        customJson: { key1: 'value1', key2: 123, nested: { data: true } },
        customDate: new Date('2024-06-01'),
      });

      expect(customer.customVarchar).toBe('Texto personalizado');
      expect(customer.customInt).toBe(42);
      expect(customer.customDecimal).toBe(123.4567);
      expect(customer.customDatetime).toEqual(new Date('2024-01-15T10:30:00'));
      expect(customer.customBool).toBe(true);
      expect(customer.customText).toBe('Texto largo personalizado con mucho contenido');
      expect(customer.customJson).toEqual({ key1: 'value1', key2: 123, nested: { data: true } });
      expect(customer.customDate).toEqual(new Date('2024-06-01'));
    });

    it('should create customer without custom fields (all undefined)', () => {
      const customer = new Customer(createValidCustomerProps());
      expect(customer.customVarchar).toBeUndefined();
      expect(customer.customInt).toBeUndefined();
      expect(customer.customDecimal).toBeUndefined();
      expect(customer.customDatetime).toBeUndefined();
      expect(customer.customBool).toBeUndefined();
      expect(customer.customText).toBeUndefined();
      expect(customer.customJson).toBeUndefined();
      expect(customer.customDate).toBeUndefined();
    });
  });

  describe('Updates', () => {
    it('should update basic info', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.updateBasicInfo({ firstName: 'Jane' });
      expect(customer.firstName).toBe('Jane');
    });

    it('should update GDPR consent', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.updateGdprConsent({
        gdprConsent: true,
        marketingConsent: true,
        dataProcessingConsent: true,
        version: '2.0',
      });
      expect(customer.gdprConsent).toBe(true);
      expect(customer.marketingConsent).toBe(true);
    });

    it('should update all 8 custom fields', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.updateCustomFields({
        customVarchar: 'Nuevo valor',
        customInt: 100,
        customDecimal: 999.99,
        customDatetime: new Date('2024-12-25T00:00:00'),
        customBool: false,
        customText: 'Texto actualizado',
        customJson: { updated: true },
        customDate: new Date('2024-12-31'),
      });

      expect(customer.customVarchar).toBe('Nuevo valor');
      expect(customer.customInt).toBe(100);
      expect(customer.customDecimal).toBe(999.99);
      expect(customer.customDatetime).toEqual(new Date('2024-12-25T00:00:00'));
      expect(customer.customBool).toBe(false);
      expect(customer.customText).toBe('Texto actualizado');
      expect(customer.customJson).toEqual({ updated: true });
      expect(customer.customDate).toEqual(new Date('2024-12-31'));
    });

    it('should update partial custom fields', () => {
      const customer = new Customer({
        ...createValidCustomerProps(),
        customVarchar: 'Original',
        customInt: 50,
      });

      customer.updateCustomFields({
        customInt: 75,
        customBool: true,
      });

      expect(customer.customVarchar).toBe('Original'); // unchanged
      expect(customer.customInt).toBe(75);
      expect(customer.customBool).toBe(true);
    });

    it('should not update anonymized customer', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.anonymize('test');
      expect(() => customer.updateBasicInfo({ firstName: 'Jane' })).toThrow('Cannot update anonymized customer');
    });

    it('should not update custom fields on anonymized customer', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.anonymize('test');
      expect(() => customer.updateCustomFields({ customVarchar: 'test' })).toThrow('Cannot update anonymized customer');
    });
  });

  describe('Anonymization', () => {
    it('should anonymize customer data', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.anonymize('GDPR request');
      expect(customer.isAnonymized).toBe(true);
      expect(customer.firstName).toBe('ANONYMIZED');
      expect(customer.lastName).toBe('ANONYMIZED');
      expect(customer.email).toBeUndefined();
    });

    it('should clear all 8 custom fields on anonymization', () => {
      const customer = new Customer({
        ...createValidCustomerProps(),
        customVarchar: 'Texto',
        customInt: 42,
        customDecimal: 123.45,
        customDatetime: new Date(),
        customBool: true,
        customText: 'Texto largo',
        customJson: { data: true },
        customDate: new Date(),
      });

      customer.anonymize('GDPR request');

      expect(customer.isAnonymized).toBe(true);
      expect(customer.customVarchar).toBeUndefined();
      expect(customer.customInt).toBeUndefined();
      expect(customer.customDecimal).toBeUndefined();
      expect(customer.customDatetime).toBeUndefined();
      expect(customer.customBool).toBeUndefined();
      expect(customer.customText).toBeUndefined();
      expect(customer.customJson).toBeUndefined();
      expect(customer.customDate).toBeUndefined();
    });

    it('should export data for GDPR including custom fields', () => {
      const customer = new Customer({
        ...createValidCustomerProps(),
        customVarchar: 'Test',
        customInt: 10,
      });
      const exported = customer.exportData();
      expect(exported.customer).toBeDefined();
      expect(exported.exportDate).toBeDefined();
      expect((exported.customer as any).customVarchar).toBe('Test');
      expect((exported.customer as any).customInt).toBe(10);
    });
  });

  describe('toJSON', () => {
    it('should include all 8 custom fields in JSON output', () => {
      const customer = new Customer({
        ...createValidCustomerProps(),
        customVarchar: 'JSON test',
        customInt: 999,
        customJson: { test: true },
      });

      const json = customer.toJSON();
      expect(json.customVarchar).toBe('JSON test');
      expect(json.customInt).toBe(999);
      expect(json.customJson).toEqual({ test: true });
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete customer', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.softDelete('user-001');
      expect(customer.isDeleted).toBe(true);
    });

    it('should restore deleted customer', () => {
      const customer = new Customer(createValidCustomerProps());
      customer.softDelete('user-001');
      customer.restore();
      expect(customer.isDeleted).toBe(false);
    });
  });
});
