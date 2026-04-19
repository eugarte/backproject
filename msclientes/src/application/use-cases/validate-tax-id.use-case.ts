import { TaxIdValidatorService, TaxIdValidationResult } from '../../domain/services/tax-id-validator.service';
import { TaxIdValidationDto, TaxIdValidationResponseDto } from '../dtos/tax-id.dto';

export class ValidateTaxIdUseCase {
  constructor(private readonly taxIdValidator: TaxIdValidatorService) {}

  async execute(dto: TaxIdValidationDto): Promise<TaxIdValidationResponseDto> {
    const result = await this.taxIdValidator.validate(dto.taxId, dto.taxIdType, dto.countryCode);
    
    return {
      valid: result.valid,
      taxId: dto.taxId,
      taxIdType: dto.taxIdType,
      countryCode: dto.countryCode,
      normalized: result.normalized,
      message: result.message,
    };
  }
}