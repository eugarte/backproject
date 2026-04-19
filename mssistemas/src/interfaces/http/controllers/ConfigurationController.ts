import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/persistence/config/data-source';
import { ConfigurationEntity } from '../../../infrastructure/persistence/entities/ConfigurationEntity';
import { ConfigurationHistoryEntity } from '../../../infrastructure/persistence/entities/ConfigurationHistoryEntity';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { asyncHandler, createError } from '../middleware/ErrorMiddleware';

export class ConfigurationController {
  private configRepo = AppDataSource.getRepository(ConfigurationEntity);
  private historyRepo = AppDataSource.getRepository(ConfigurationHistoryEntity);

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      serviceId,
      environment,
      key,
      value,
      type,
      isSecret,
      description,
    } = req.body;

    const existing = await this.configRepo.findOne({
      where: { serviceId, environment, key },
    });

    if (existing) {
      throw createError('Configuration with this key already exists for this service and environment', 409);
    }

    const configuration = this.configRepo.create({
      serviceId,
      environment,
      key,
      value,
      type: type || 'string',
      isSecret: isSecret || false,
      version: 1,
      description,
    });

    await this.configRepo.save(configuration);

    // Save to history
    const history = this.historyRepo.create({
      configurationId: configuration.id,
      value,
      version: 1,
      changedBy: req.user?.userId || 'system',
      changedAt: new Date(),
    });
    await this.historyRepo.save(history);

    res.status(201).json({
      success: true,
      data: configuration,
    });
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const { serviceId, environment } = req.query;

    const where: any = {};
    if (serviceId) where.serviceId = serviceId;
    if (environment) where.environment = environment;

    const configs = await this.configRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: configs,
    });
  });

  findOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const config = await this.configRepo.findOne({ where: { id } });

    if (!config) {
      throw createError('Configuration not found', 404);
    }

    res.json({
      success: true,
      data: config,
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { value, description, isSecret } = req.body;

    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw createError('Configuration not found', 404);
    }

    // Save current to history
    const history = this.historyRepo.create({
      configurationId: config.id,
      value: config.value,
      version: config.version,
      changedBy: req.user?.userId || 'system',
      changedAt: new Date(),
    });
    await this.historyRepo.save(history);

    // Update
    config.value = value ?? config.value;
    config.description = description ?? config.description;
    config.isSecret = isSecret ?? config.isSecret;
    config.version += 1;
    config.updatedAt = new Date();

    await this.configRepo.save(config);

    res.json({
      success: true,
      data: config,
    });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw createError('Configuration not found', 404);
    }

    await this.configRepo.remove(config);

    res.json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw createError('Configuration not found', 404);
    }

    const history = await this.historyRepo.find({
      where: { configurationId: id },
      order: { changedAt: 'DESC' },
    });

    res.json({
      success: true,
      data: history,
    });
  });

  // Public endpoint
  getPublicConfiguration = asyncHandler(async (req: Request, res: Response) => {
    const { service, env, key } = req.params;

    const config = await this.configRepo.findOne({
      where: {
        serviceId: service,
        environment: env,
        key,
      },
    });

    if (!config) {
      throw createError('Configuration not found', 404);
    }

    // Parse value based on type
    let parsedValue: any = config.value;
    if (config.type === 'number') {
      parsedValue = Number(config.value);
    } else if (config.type === 'boolean') {
      parsedValue = config.value.toLowerCase() === 'true';
    } else if (config.type === 'json') {
      try {
        parsedValue = JSON.parse(config.value);
      } catch {
        // Keep as string if JSON parsing fails
      }
    }

    res.json({
      success: true,
      data: {
        key: config.key,
        value: parsedValue,
        type: config.type,
        version: config.version,
      },
    });
  });
}