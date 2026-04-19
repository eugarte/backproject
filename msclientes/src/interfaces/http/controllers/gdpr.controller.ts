import { Request, Response } from 'express';
import { GdprExportDataUseCase } from '../../../application/use-cases/gdpr.use-case';

export class GdprController {
  constructor(
    private readonly gdprExportUseCase: GdprExportDataUseCase,
  ) {}

  exportData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const format = (req.query.format as 'json' | 'csv' | 'pdf') || 'json';
      
      const result = await this.gdprExportUseCase.execute({
        customerId: id,
        format,
        requestedBy: req.user?.userId || 'system',
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="customer-${id}-export.json"`);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };
}
