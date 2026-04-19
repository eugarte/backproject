import { Request, Response } from 'express';
import {
  CreateCatalogValueUseCase,
  GetCatalogValuesByCatalogIdUseCase,
  GetCatalogValueByIdUseCase,
  GetCatalogValueByCodeUseCase,
  GetDefaultCatalogValueUseCase,
  UpdateCatalogValueUseCase,
  DeleteCatalogValueUseCase,
  ValidateCatalogValueUseCase,
  GetPublicCatalogValuesUseCase
} from '@application/use-cases/catalog-value';
import { CatalogRepository } from '@infrastructure/persistence/repositories/CatalogRepository';
import { CatalogValueRepository } from '@infrastructure/persistence/repositories/CatalogValueRepository';

export class CatalogValueController {
  private createCatalogValueUseCase: CreateCatalogValueUseCase;
  private getCatalogValuesByCatalogIdUseCase: GetCatalogValuesByCatalogIdUseCase;
  private getCatalogValueByIdUseCase: GetCatalogValueByIdUseCase;
  private getCatalogValueByCodeUseCase: GetCatalogValueByCodeUseCase;
  private getDefaultCatalogValueUseCase: GetDefaultCatalogValueUseCase;
  private updateCatalogValueUseCase: UpdateCatalogValueUseCase;
  private deleteCatalogValueUseCase: DeleteCatalogValueUseCase;
  private validateCatalogValueUseCase: ValidateCatalogValueUseCase;
  private getPublicCatalogValuesUseCase: GetPublicCatalogValuesUseCase;

  constructor() {
    const catalogRepository = new CatalogRepository();
    const catalogValueRepository = new CatalogValueRepository();
    
    this.createCatalogValueUseCase = new CreateCatalogValueUseCase(catalogValueRepository, catalogRepository);
    this.getCatalogValuesByCatalogIdUseCase = new GetCatalogValuesByCatalogIdUseCase(catalogValueRepository);
    this.getCatalogValueByIdUseCase = new GetCatalogValueByIdUseCase(catalogValueRepository);
    this.getCatalogValueByCodeUseCase = new GetCatalogValueByCodeUseCase(catalogValueRepository);
    this.getDefaultCatalogValueUseCase = new GetDefaultCatalogValueUseCase(catalogValueRepository);
    this.updateCatalogValueUseCase = new UpdateCatalogValueUseCase(catalogValueRepository);
    this.deleteCatalogValueUseCase = new DeleteCatalogValueUseCase(catalogValueRepository);
    this.validateCatalogValueUseCase = new ValidateCatalogValueUseCase(catalogRepository, catalogValueRepository);
    this.getPublicCatalogValuesUseCase = new GetPublicCatalogValuesUseCase(catalogRepository, catalogValueRepository);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: catalogId } = req.params;
      const { code, label, description, color, sortOrder, isDefault, isActive } = req.body;
      
      const catalogValue = await this.createCatalogValueUseCase.execute({
        catalogId,
        code,
        label,
        description,
        color,
        sortOrder,
        isDefault,
        isActive
      });
      
      res.status(201).json(catalogValue);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  findByCatalogId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const values = await this.getCatalogValuesByCatalogIdUseCase.execute(id);
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { valueId } = req.params;
      const value = await this.getCatalogValueByIdUseCase.execute(valueId);
      
      if (!value) {
        res.status(404).json({ error: 'Catalog value not found' });
        return;
      }
      
      res.json(value);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  findByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: catalogId } = req.params;
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code query parameter is required' });
        return;
      }
      
      const value = await this.getCatalogValueByCodeUseCase.execute(catalogId, code);
      
      if (!value) {
        res.status(404).json({ error: 'Catalog value not found' });
        return;
      }
      
      res.json(value);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getDefault = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: catalogId } = req.params;
      const value = await this.getDefaultCatalogValueUseCase.execute(catalogId);
      
      if (!value) {
        res.status(404).json({ error: 'No default value found' });
        return;
      }
      
      res.json(value);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { valueId } = req.params;
      const value = await this.updateCatalogValueUseCase.execute(valueId, req.body);
      res.json(value);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { valueId } = req.params;
      const { permanent } = req.query;
      await this.deleteCatalogValueUseCase.execute(valueId, permanent === 'true');
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Public API endpoints
  getPublicValues = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const values = await this.getPublicCatalogValuesUseCase.execute(key);
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  validateValue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const { code } = req.body;
      
      const result = await this.validateCatalogValueUseCase.execute({ catalogKey: key, code });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
