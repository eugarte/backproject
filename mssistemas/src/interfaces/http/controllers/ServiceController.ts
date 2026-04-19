import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/persistence/config/data-source';
import { ServiceEntity } from '../../../infrastructure/persistence/entities/ServiceEntity';
import { ServiceHeartbeatEntity } from '../../../infrastructure/persistence/entities/ServiceHeartbeatEntity';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { asyncHandler, createError } from '../middleware/ErrorMiddleware';

export class ServiceController {
  private serviceRepo = AppDataSource.getRepository(ServiceEntity);
  private heartbeatRepo = AppDataSource.getRepository(ServiceHeartbeatEntity);

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      displayName,
      description,
      version,
      statusCatalogId,
      statusValue,
      teamOwner,
      repositoryUrl,
      documentationUrl,
      technologyStack,
      healthCheckUrl,
    } = req.body;

    const existing = await this.serviceRepo.findOne({ where: { name } });
    if (existing) {
      throw createError('Service with this name already exists', 409);
    }

    const service = this.serviceRepo.create({
      name,
      displayName,
      description,
      version: version || '1.0.0',
      statusCatalogId,
      statusValue,
      teamOwner,
      repositoryUrl,
      documentationUrl,
      technologyStack: technologyStack || [],
      healthCheckUrl,
      isActive: true,
    });

    await this.serviceRepo.save(service);

    res.status(201).json({
      success: true,
      data: service,
    });
  });

  findAll = asyncHandler(async (_req: Request, res: Response) => {
    const services = await this.serviceRepo.find({
      relations: ['heartbeats'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: services,
    });
  });

  findOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['heartbeats'],
    });

    if (!service) {
      throw createError('Service not found', 404);
    }

    res.json({
      success: true,
      data: service,
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      displayName,
      description,
      version,
      statusCatalogId,
      statusValue,
      teamOwner,
      repositoryUrl,
      documentationUrl,
      technologyStack,
      healthCheckUrl,
      isActive,
    } = req.body;

    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) {
      throw createError('Service not found', 404);
    }

    service.displayName = displayName ?? service.displayName;
    service.description = description ?? service.description;
    service.version = version ?? service.version;
    service.statusCatalogId = statusCatalogId ?? service.statusCatalogId;
    service.statusValue = statusValue ?? service.statusValue;
    service.teamOwner = teamOwner ?? service.teamOwner;
    service.repositoryUrl = repositoryUrl ?? service.repositoryUrl;
    service.documentationUrl = documentationUrl ?? service.documentationUrl;
    service.technologyStack = technologyStack ?? service.technologyStack;
    service.healthCheckUrl = healthCheckUrl ?? service.healthCheckUrl;
    service.isActive = isActive ?? service.isActive;
    service.updatedAt = new Date();

    await this.serviceRepo.save(service);

    res.json({
      success: true,
      data: service,
    });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['heartbeats'],
    });

    if (!service) {
      throw createError('Service not found', 404);
    }

    await this.serviceRepo.remove(service);

    res.json({
      success: true,
      message: 'Service deleted successfully',
    });
  });

  heartbeat = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, responseTimeMs, metadata } = req.body;

    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) {
      throw createError('Service not found', 404);
    }

    const heartbeat = this.heartbeatRepo.create({
      serviceId: id,
      status: status || 'healthy',
      responseTimeMs: responseTimeMs || 0,
      metadata: metadata || {},
      reportedAt: new Date(),
    });

    await this.heartbeatRepo.save(heartbeat);

    // Update service last heartbeat
    service.updatedAt = new Date();
    await this.serviceRepo.save(service);

    res.status(201).json({
      success: true,
      data: heartbeat,
    });
  });

  getHealth = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['heartbeats'],
    });

    if (!service) {
      throw createError('Service not found', 404);
    }

    const latestHeartbeat = service.heartbeats
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0];

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isHealthy = latestHeartbeat && 
      new Date(latestHeartbeat.reportedAt) > fiveMinutesAgo &&
      latestHeartbeat.status === 'healthy';

    res.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          displayName: service.displayName,
          isActive: service.isActive,
        },
        health: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastHeartbeat: latestHeartbeat || null,
          checkedAt: new Date().toISOString(),
        },
      },
    });
  });
}