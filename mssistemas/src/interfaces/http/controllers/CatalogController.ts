import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/persistence/config/data-source';
import { CatalogEntity } from '../../../infrastructure/persistence/entities/CatalogEntity';
import { CatalogValueEntity } from '../../../infrastructure/persistence/entities/CatalogValueEntity';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { asyncHandler, createError } from '../middleware/ErrorMiddleware';

export class CatalogController {
  private catalogRepo = AppDataSource.getRepository(CatalogEntity);
  private catalogValueRepo = AppDataSource.getRepository(CatalogValueEntity);

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key, name, description, allowMultiple, isActive } = req.body;

    const existing = await this.catalogRepo.findOne({ where: { key } });
    if (existing) {
      throw createError('Catalog with this key already exists', 409);
    }

    const catalog = this.catalogRepo.create({
      key,
      name,
      description,
      allowMultiple: allowMultiple ?? false,
      isActive: isActive ?? true,
      createdBy: req.user?.userId || 'system',
    });

    await this.catalogRepo.save(catalog);

    res.status(201).json({
      success: true,
      data: catalog,
    });
  });

  findAll = asyncHandler(async (_req: Request, res: Response) => {
    const catalogs = await this.catalogRepo.find({
      relations: ['values'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: catalogs,
    });
  });

  findOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const catalog = await this.catalogRepo.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    res.json({
      success: true,
      data: catalog,
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, allowMultiple, isActive } = req.body;

    const catalog = await this.catalogRepo.findOne({ where: { id } });
    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    catalog.name = name ?? catalog.name;
    catalog.description = description ?? catalog.description;
    catalog.allowMultiple = allowMultiple ?? catalog.allowMultiple;
    catalog.isActive = isActive ?? catalog.isActive;
    catalog.updatedAt = new Date();

    await this.catalogRepo.save(catalog);

    res.json({
      success: true,
      data: catalog,
    });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const catalog = await this.catalogRepo.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    await this.catalogRepo.remove(catalog);

    res.json({
      success: true,
      message: 'Catalog deleted successfully',
    });
  });

  getValues = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const catalog = await this.catalogRepo.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    res.json({
      success: true,
      data: catalog.values,
    });
  });

  createValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { code, label, description, color, sortOrder, isDefault, isActive } = req.body;

    const catalog = await this.catalogRepo.findOne({ where: { id } });
    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    const existingValue = await this.catalogValueRepo.findOne({
      where: { catalogId: id, code },
    });

    if (existingValue) {
      throw createError('Value with this code already exists in this catalog', 409);
    }

    const value = this.catalogValueRepo.create({
      catalogId: id,
      code,
      label,
      description,
      color,
      sortOrder: sortOrder ?? 0,
      isDefault: isDefault ?? false,
      isActive: isActive ?? true,
    });

    await this.catalogValueRepo.save(value);

    res.status(201).json({
      success: true,
      data: value,
    });
  });

  updateValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { valueId } = req.params;
    const { label, description, color, sortOrder, isDefault, isActive } = req.body;

    const value = await this.catalogValueRepo.findOne({ where: { id: valueId } });
    if (!value) {
      throw createError('Catalog value not found', 404);
    }

    value.label = label ?? value.label;
    value.description = description ?? value.description;
    value.color = color ?? value.color;
    value.sortOrder = sortOrder ?? value.sortOrder;
    value.isDefault = isDefault ?? value.isDefault;
    value.isActive = isActive ?? value.isActive;
    value.updatedAt = new Date();

    await this.catalogValueRepo.save(value);

    res.json({
      success: true,
      data: value,
    });
  });

  removeValue = asyncHandler(async (req: Request, res: Response) => {
    const { valueId } = req.params;

    const value = await this.catalogValueRepo.findOne({ where: { id: valueId } });
    if (!value) {
      throw createError('Catalog value not found', 404);
    }

    await this.catalogValueRepo.remove(value);

    res.json({
      success: true,
      message: 'Catalog value deleted successfully',
    });
  });

  // Public endpoints
  getPublicValues = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    const catalog = await this.catalogRepo.findOne({
      where: { key, isActive: true },
      relations: ['values'],
    });

    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    const activeValues = catalog.values.filter(v => v.isActive);

    res.json({
      success: true,
      data: {
        catalog: {
          id: catalog.id,
          key: catalog.key,
          name: catalog.name,
          allowMultiple: catalog.allowMultiple,
        },
        values: activeValues,
      },
    });
  });

  validateValue = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { code } = req.body;

    const catalog = await this.catalogRepo.findOne({
      where: { key, isActive: true },
      relations: ['values'],
    });

    if (!catalog) {
      throw createError('Catalog not found', 404);
    }

    const value = catalog.values.find(
      v => v.code === code && v.isActive
    );

    res.json({
      success: true,
      data: {
        valid: !!value,
        value: value || null,
      },
    });
  });
}