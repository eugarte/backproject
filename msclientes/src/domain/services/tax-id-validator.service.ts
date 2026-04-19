export interface TaxIdValidationResult {
  valid: boolean;
  normalized?: string;
  message?: string;
}

export class TaxIdValidatorService {
  async validate(taxId: string, type: string, countryCode: string): Promise<TaxIdValidationResult> {
    const normalized = taxId.replace(/\s/g, '').toUpperCase();
    
    switch (countryCode.toUpperCase()) {
      case 'ES':
        return this.validateSpanishTaxId(normalized, type);
      case 'MX':
        return this.validateMexicanTaxId(normalized, type);
      case 'AR':
        return this.validateArgentinianTaxId(normalized, type);
      default:
        // Generic validation for other countries
        return { valid: normalized.length >= 5, normalized };
    }
  }

  private validateSpanishTaxId(taxId: string, type: string): TaxIdValidationResult {
    // DNI: 8 digits + 1 letter
    if (type === 'DNI') {
      const dniRegex = /^\d{8}[A-Z]$/;
      if (!dniRegex.test(taxId)) {
        return { valid: false, message: 'Spanish DNI must be 8 digits followed by 1 letter' };
      }
      return { valid: true, normalized: taxId };
    }

    // NIF: Same as DNI
    if (type === 'NIF') {
      const nifRegex = /^[0-9XYZ]\d{7}[A-Z]$/;
      if (!nifRegex.test(taxId)) {
        return { valid: false, message: 'Invalid Spanish NIF format' };
      }
      return { valid: true, normalized: taxId };
    }

    // CIF: Company tax ID
    if (type === 'CIF') {
      const cifRegex = /^[A-HJNP-SW]\d{7}[0-9A-J]$/;
      if (!cifRegex.test(taxId)) {
        return { valid: false, message: 'Invalid Spanish CIF format' };
      }
      return { valid: true, normalized: taxId };
    }

    return { valid: false, message: `Unknown tax ID type: ${type}` };
  }

  private validateMexicanTaxId(taxId: string, _type: string): TaxIdValidationResult {
    // RFC: 12 or 13 characters
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(taxId)) {
      return { valid: false, message: 'Invalid Mexican RFC format' };
    }
    return { valid: true, normalized: taxId };
  }

  private validateArgentinianTaxId(taxId: string, _type: string): TaxIdValidationResult {
    // CUIT: 11 digits
    const cuitRegex = /^\d{11}$/;
    if (!cuitRegex.test(taxId)) {
      return { valid: false, message: 'Argentinian CUIT must be 11 digits' };
    }
    return { valid: true, normalized: taxId };
  }
}
