import { v4 as uuidv4 } from 'uuid';

export enum AuditEntityType {
  SERVICE = 'service',
  CONFIGURATION = 'configuration',
  SECRET = 'secret',
  FEATURE_FLAG = 'feature_flag',
  CATALOG = 'catalog'
}

export enum AuditActorType {
  USER = 'user',
  SERVICE = 'service'
}

export class AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actor?: string;
  actorType: AuditActorType;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: Date;

  constructor(props: Partial<AuditLog> = {}) {
    this.id = props.id || uuidv4();
    this.entityType = props.entityType || AuditEntityType.SERVICE;
    this.entityId = props.entityId || '';
    this.action = props.action || '';
    this.actor = props.actor;
    this.actorType = props.actorType || AuditActorType.USER;
    this.ipAddress = props.ipAddress;
    this.details = props.details;
    this.createdAt = props.createdAt || new Date();
  }
}
