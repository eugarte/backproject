export interface TaxIdValidationDto {
  taxId: string;
  taxIdType: string;
  countryCode: string;
}

export interface TaxIdValidationResponseDto {
  valid: boolean;
  taxId: string;
  taxIdType: string;
  countryCode: string;
  normalized?: string;
  message?: string;
}
