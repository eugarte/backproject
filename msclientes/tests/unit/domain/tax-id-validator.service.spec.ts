import { TaxIdValidatorService } from '../../../src/domain/services/tax-id-validator.service';

describe('TaxIdValidatorService', () => {
  const validator = new TaxIdValidatorService();

  describe('Spanish Tax IDs', () => {
    it('should validate valid DNI', async () => {
      const result = await validator.validate('12345678A', 'DNI', 'ES');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid DNI format', async () => {
      const result = await validator.validate('1234567', 'DNI', 'ES');
      expect(result.valid).toBe(false);
    });

    it('should validate valid NIF', async () => {
      const result = await validator.validate('12345678Z', 'NIF', 'ES');
      expect(result.valid).toBe(true);
    });

    it('should validate valid CIF', async () => {
      const result = await validator.validate('A12345674', 'CIF', 'ES');
      expect(result.valid).toBe(true);
    });
  });

  describe('Mexican RFC', () => {
    it('should validate valid RFC', async () => {
      const result = await validator.validate('ABCD010101ABC', 'RFC', 'MX');
      expect(result.valid).toBe(true);
    });
  });

  describe('Argentinian CUIT', () => {
    it('should validate valid CUIT', async () => {
      const result = await validator.validate('20345678901', 'CUIT', 'AR');
      expect(result.valid).toBe(true);
    });
  });

  describe('Generic validation', () => {
    it('should accept any tax ID for unknown countries with length >= 5', async () => {
      const result = await validator.validate('ABC12345', 'TAX', 'XX');
      expect(result.valid).toBe(true);
    });
  });
});
