import { Request, Response } from 'express';
import { UploadDocumentUseCase, GetCustomerDocumentsUseCase, FileInfo } from '../../../application/use-cases/document.use-case';

export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly getCustomerDocumentsUseCase: GetCustomerDocumentsUseCase,
  ) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileInfo: FileInfo = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      const document = await this.uploadDocumentUseCase.execute(
        id,
        req.body,
        fileInfo,
        req.user?.userId
      );
      res.status(201).json(document);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };

  getByCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const documents = await this.getCustomerDocumentsUseCase.execute(id);
      res.status(200).json(documents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };
}
