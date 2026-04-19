import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuditLog } from '../../../domain/entities/audit-log';
import { IAuditLogRepository } from '../../../domain/repositories/audit-log-repository.interface';

export class TypeOrmAuditLogRepository implements IAuditLogRepository {
  private repository: Repository<AuditLogEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLogEntity);
  }

  async create(log: AuditLog): Promise<AuditLog> {
    const entity = this.toEntity(log);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByEntity(entityType: string, entityId: string, limit: number = 50): Promise<AuditLog[]> {
    const entities = await this.repository.find({
      where: { entityType, entityId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByDataSubject(dataSubjectId: string, limit: number = 100): Promise<AuditLog[]> {
    const entities = await this.repository.find({
      where: { dataSubjectId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(e => this.toDomain(e));
  }

  async findGdprRelated(limit: number = 100): Promise<AuditLog[]> {
    const entities = await this.repository.find({
      where: { gdprRelated: true },
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(options: { page: number; limit: number }): Promise<{ logs: AuditLog[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { timestamp: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
    return {
      logs: entities.map(e => this.toDomain(e)),
      total,
    };
  }

  private toDomain(entity: AuditLogEntity): AuditLog {
    return new AuditLog({
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      action: entity.action,
      actionDetails: entity.actionDetails || undefined,
      oldValues: entity.oldValues || undefined,
      newValues: entity.newValues || undefined,
      performedBy: entity.performedBy || undefined,
      performedByType: entity.performedByType as any,
      ipAddress: entity.ipAddress || undefined,
      userAgent: entity.userAgent || undefined,
      requestId: entity.requestId || undefined,
      correlationId: entity.correlationId || undefined,
      timestamp: entity.timestamp,
      gdprRelated: entity.gdprRelated,
      dataSubjectId: entity.dataSubjectId || undefined,
    });
  }

  private toEntity(log: AuditLog): AuditLogEntity {
    const entity = new AuditLogEntity();
    entity.id = log.id;
    entity.entityType = log.entityType;
    entity.entityId = log.entityId;
    entity.action = log.action;
    entity.actionDetails = log['actionDetails'] || null;
    entity.oldValues = log['oldValues'] || null;
    entity.newValues = log['newValues'] || null;
    entity.performedBy = log.performedBy || null;
    entity.performedByType = log.performedByType;
    entity.ipAddress = log['ipAddress'] || null;
    entity.userAgent = log['userAgent'] || null;
    entity.requestId = log['requestId'] || null;
    entity.correlationId = log['correlationId'] || null;
    entity.timestamp = log.timestamp;
    entity.gdprRelated = log.gdprRelated;
    entity.dataSubjectId = log.dataSubjectId || null;
    return entity;
  }
}
