import { Request, Response } from 'express';
import { ValidateTaxIdUseCase } from '../../../application/use-cases/validate-tax-id.use-case';

export class TaxIdController {
  constructor(
    private readonly validateTaxIdUseCase: ValidateTaxIdUseCase,
  ) {}

  validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taxId, taxIdType, countryCode } = req.body;
      
      if (!taxId || !taxIdType || !countryCode) {
        res.status(400).json({ error: 'taxId, taxIdType, and countryCode are required' });
        return;
      }

      const result = await this.validateTaxIdUseCase.execute({ taxId, taxIdType, countryCode });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };
}
