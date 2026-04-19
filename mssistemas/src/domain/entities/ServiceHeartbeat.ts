import { v4 as uuidv4 } from 'uuid';

export type ServiceStatus = 'up' | 'down' | 'degraded';

export class ServiceHeartbeat {
  public readonly id: string;
  public serviceId: string;
  public environment: string;
  public instanceId: string;
  public status: ServiceStatus;
  public responseTimeMs: number;
  public version: string;
  public metadata: Record<string, any>;
  public reportedAt: Date;
  public readonly createdAt: Date;

  constructor(
    serviceId: string,
    environment: string,
    instanceId: string,
    status: ServiceStatus = 'up',
    responseTimeMs: number = 0,
    version: string = '1.0.0',
    metadata: Record<string, any> = {},
    reportedAt?: Date,
    id?: string,
    createdAt?: Date
  ) {
    this.id = id || uuidv4();
    this.serviceId = serviceId;
    this.environment = environment;
    this.instanceId = instanceId;
    this.status = status;
    this.responseTimeMs = responseTimeMs;
    this.version = version;
    this.metadata = metadata;
    this.reportedAt = reportedAt || new Date();
    this.createdAt = createdAt || new Date();
  }

  public isStale(thresholdMinutes: number = 2): boolean {
    const thresholdMs = thresholdMinutes * 60 * 1000;
    return (new Date().getTime() - this.reportedAt.getTime()) > thresholdMs;
  }
}
