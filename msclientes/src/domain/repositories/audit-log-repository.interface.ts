import { AuditLog } from '../entities/audit-log';

export interface IAuditLogRepository {
  create(log: AuditLog): Promise<AuditLog>;
  findByEntity(entityType: string, entityId: string, limit?: number): Promise<AuditLog[]>;
  findByDataSubject(dataSubjectId: string, limit?: number): Promise<AuditLog[]>;
  findGdprRelated(limit?: number): Promise<AuditLog[]>;
  findAll(options: { page: number; limit: number }): Promise<{ logs: AuditLog[]; total: number }>;
}
