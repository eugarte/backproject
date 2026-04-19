import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/persistence/config/data-source';
import { SecretEntity } from '../../../infrastructure/persistence/entities/SecretEntity';
import { SecretAccessLogEntity } from '../../../infrastructure/persistence/entities/SecretAccessLogEntity';
import { AesEncryptionService } from '../../../infrastructure/encryption/AesEncryptionService';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { asyncHandler, createError } from '../middleware/ErrorMiddleware';

export class SecretController {
  private secretRepo = AppDataSource.getRepository(SecretEntity);
  private accessLogRepo = AppDataSource.getRepository(SecretAccessLogEntity);
  private encryptionService = new AesEncryptionService();

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serviceId, environment, key, value } = req.body;

    const existing = await this.secretRepo.findOne({
      where: { serviceId, environment, key },
    });

    if (existing) {
      throw createError('Secret with this key already exists for this service and environment', 409);
    }

    const encryptedValue = this.encryptionService.encrypt(value);

    const secret = this.secretRepo.create({
      serviceId,
      environment,
      key,
      encryptedValue,
      encryptionVersion: 'v1',
    });

    await this.secretRepo.save(secret);

    // Return without the encrypted value
    const { encryptedValue: _, ...secretData } = secret;

    res.status(201).json({
      success: true,
      data: secretData,
    });
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const { serviceId, environment } = req.query;

    const where: any = {};
    if (serviceId) where.serviceId = serviceId;
    if (environment) where.environment = environment;

    const secrets = await this.secretRepo.find({
      where,
      select: ['id', 'serviceId', 'environment', 'key', 'encryptionVersion', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: secrets,
    });
  });

  findOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) {
      throw createError('Secret not found', 404);
    }

    // Decrypt the value
    const decryptedValue = this.encryptionService.decrypt(secret.encryptedValue);

    // Log access
    const accessLog = this.accessLogRepo.create({
      secretId: id,
      accessedBy: req.user?.userId || 'system',
      accessedAt: new Date(),
      action: 'READ',
    });
    await this.accessLogRepo.save(accessLog);

    res.json({
      success: true,
      data: {
        id: secret.id,
        serviceId: secret.serviceId,
        environment: secret.environment,
        key: secret.key,
        value: decryptedValue,
        encryptionVersion: secret.encryptionVersion,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      },
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { value } = req.body;

    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) {
      throw createError('Secret not found', 404);
    }

    const encryptedValue = this.encryptionService.encrypt(value);

    secret.encryptedValue = encryptedValue;
    secret.updatedAt = new Date();

    await this.secretRepo.save(secret);

    // Log access
    const accessLog = this.accessLogRepo.create({
      secretId: id,
      accessedBy: req.user?.userId || 'system',
      accessedAt: new Date(),
      action: 'UPDATE',
    });
    await this.accessLogRepo.save(accessLog);

    const { encryptedValue: _, ...secretData } = secret;

    res.json({
      success: true,
      data: secretData,
    });
  });

  remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) {
      throw createError('Secret not found', 404);
    }

    await this.secretRepo.remove(secret);

    // Log access
    const accessLog = this.accessLogRepo.create({
      secretId: id,
      accessedBy: req.user?.userId || 'system',
      accessedAt: new Date(),
      action: 'DELETE',
    });
    await this.accessLogRepo.save(accessLog);

    res.json({
      success: true,
      message: 'Secret deleted successfully',
    });
  });

  rotate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newValue } = req.body;

    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) {
      throw createError('Secret not found', 404);
    }

    const encryptedValue = this.encryptionService.encrypt(newValue);

    secret.encryptedValue = encryptedValue;
    secret.updatedAt = new Date();

    await this.secretRepo.save(secret);

    // Log access
    const accessLog = this.accessLogRepo.create({
      secretId: id,
      accessedBy: req.user?.userId || 'system',
      accessedAt: new Date(),
      action: 'ROTATE',
    });
    await this.accessLogRepo.save(accessLog);

    const { encryptedValue: _, ...secretData } = secret;

    res.json({
      success: true,
      message: 'Secret rotated successfully',
      data: secretData,
    });
  });
}