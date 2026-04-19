import { Request, Response } from 'express';
import { AppDataSource } from '../../../infrastructure/persistence/config/data-source';
import { FeatureFlagEntity } from '../../../infrastructure/persistence/entities/FeatureFlagEntity';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { asyncHandler, createError } from '../middleware/ErrorMiddleware';

export class FeatureFlagController {
  private featureFlagRepo = AppDataSource.getRepository(FeatureFlagEntity);

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      key,
      name,
      description,
      enabled,
      strategy,
      percentage,
      targetUsers,
      targetGroups,
      scheduleStart,
      scheduleEnd,
    } = req.body;

    const existing = await this.featureFlagRepo.findOne({ where: { key } });
    if (existing) {
      throw createError('Feature flag with this key already exists', 409);
    }

    const featureFlag = this.featureFlagRepo.create({
      key,
      name,
      description,
      enabled: enabled ?? false,
      strategy: strategy || 'simple',
      percentage: percentage ?? 0,
      targetUsers: targetUsers || [],
      targetGroups: targetGroups || [],
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
      scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : null,
    });

    await this.featureFlagRepo.save(featureFlag);

    res.status(201).json({
      success: true,
      data: featureFlag,
    });
  });

  findAll = asyncHandler(async (_req: Request, res: Response) => {
    const flags = await this.featureFlagRepo.find({
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: flags,
    });
  });

  findOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const flag = await this.featureFlagRepo.findOne({ where: { id } });
    if (!flag) {
      throw createError('Feature flag not found', 404);
    }

    res.json({
      success: true,
      data: flag,
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      name,
      description,
      enabled,
      strategy,
      percentage,
      targetUsers,
      targetGroups,
      scheduleStart,
      scheduleEnd,
    } = req.body;

    const flag = await this.featureFlagRepo.findOne({ where: { id } });
    if (!flag) {
      throw createError('Feature flag not found', 404);
    }

    flag.name = name ?? flag.name;
    flag.description = description ?? flag.description;
    flag.enabled = enabled ?? flag.enabled;
    flag.strategy = strategy ?? flag.strategy;
    flag.percentage = percentage ?? flag.percentage;
    flag.targetUsers = targetUsers ?? flag.targetUsers;
    flag.targetGroups = targetGroups ?? flag.targetGroups;
    flag.scheduleStart = scheduleStart ? new Date(scheduleStart) : flag.scheduleStart;
    flag.scheduleEnd = scheduleEnd ? new Date(scheduleEnd) : flag.scheduleEnd;
    flag.updatedAt = new Date();

    await this.featureFlagRepo.save(flag);

    res.json({
      success: true,
      data: flag,
    });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const flag = await this.featureFlagRepo.findOne({ where: { id } });
    if (!flag) {
      throw createError('Feature flag not found', 404);
    }

    await this.featureFlagRepo.remove(flag);

    res.json({
      success: true,
      message: 'Feature flag deleted successfully',
    });
  });

  toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const flag = await this.featureFlagRepo.findOne({ where: { id } });
    if (!flag) {
      throw createError('Feature flag not found', 404);
    }

    flag.enabled = !flag.enabled;
    flag.updatedAt = new Date();

    await this.featureFlagRepo.save(flag);

    res.json({
      success: true,
      data: flag,
      message: `Feature flag ${flag.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  });

  // Public endpoint
  evaluate = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.body;
    const { userId, userGroups } = req.body.context || {};

    const flag = await this.featureFlagRepo.findOne({ where: { key } });

    if (!flag) {
      throw createError('Feature flag not found', 404);
    }

    const result = this.evaluateFlag(flag, userId, userGroups);

    res.json({
      success: true,
      data: {
        key: flag.key,
        enabled: result,
        flag: {
          name: flag.name,
          description: flag.description,
        },
      },
    });
  });

  private evaluateFlag(
    flag: FeatureFlagEntity,
    userId?: string,
    userGroups?: string[]
  ): boolean {
    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check schedule
    const now = new Date();
    if (flag.scheduleStart && now < flag.scheduleStart) {
      return false;
    }
    if (flag.scheduleEnd && now > flag.scheduleEnd) {
      return false;
    }

    // Check target users
    if (userId && flag.targetUsers.includes(userId)) {
      return true;
    }

    // Check target groups
    if (userGroups && userGroups.some(g => flag.targetGroups.includes(g))) {
      return true;
    }

    // Percentage rollout
    if (flag.strategy === 'percentage' && userId) {
      const hash = this.hashString(userId + flag.key);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.percentage;
    }

    // Simple strategy - enabled for all
    return flag.enabled;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}