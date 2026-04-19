export interface AuditLogProps {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actionDetails?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  performedBy?: string;
  performedByType: 'user' | 'system' | 'api' | 'batch';
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  timestamp: Date;
  gdprRelated: boolean;
  dataSubjectId?: string;
}

export class AuditLog {
  private props: AuditLogProps;

  constructor(props: AuditLogProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get entityType(): string { return this.props.entityType; }
  get entityId(): string { return this.props.entityId; }
  get action(): string { return this.props.action; }
  get timestamp(): Date { return this.props.timestamp; }
  get gdprRelated(): boolean { return this.props.gdprRelated; }
  get dataSubjectId(): string | undefined { return this.props.dataSubjectId; }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      entityType: this.entityType,
      entityId: this.entityId,
      action: this.action,
      actionDetails: this.props.actionDetails,
      oldValues: this.props.oldValues,
      newValues: this.props.newValues,
      performedBy: this.props.performedBy,
      performedByType: this.props.performedByType,
      timestamp: this.timestamp,
      gdprRelated: this.gdprRelated,
      dataSubjectId: this.dataSubjectId,
    };
  }

  static createGdprLog(
    entityType: string,
    entityId: string,
    action: string,
    dataSubjectId: string,
    performedBy?: string,
    details?: Record<string, unknown>
  ): AuditLog {
    return new AuditLog({
      id: crypto.randomUUID(),
      entityType,
      entityId,
      action,
      actionDetails: details,
      performedBy,
      performedByType: performedBy ? 'user' : 'system',
      timestamp: new Date(),
      gdprRelated: true,
      dataSubjectId,
    });
  }
}
