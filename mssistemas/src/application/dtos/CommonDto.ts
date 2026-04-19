export class AuditLogResponseDto {
  id!: string;
  entityType!: string;
  entityId!: string;
  action!: string;
  actor?: string;
  actorType!: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt!: Date;
}

export class DashboardStatusResponseDto {
  totalServices!: number;
  healthyServices!: number;
  degradedServices!: number;
  downServices!: number;
  unknownServices!: number;
  services!: ServiceStatusDto[];
}

export class ServiceStatusDto {
  id!: string;
  name!: string;
  displayName!: string;
  status!: string;
  version!: string;
  lastHeartbeat?: Date;
  environment?: string;
}

export class HealthCheckResponseDto {
  status!: 'healthy' | 'unhealthy' | 'degraded';
  timestamp!: Date;
  version!: string;
  uptime!: number;
  checks!: {
    database?: string;
    cache?: string;
  };
}
