export class CreateServiceDto {
  name!: string;
  displayName?: string;
  description?: string;
  version?: string;
  statusCatalogId?: string;
  statusValue?: string;
  teamOwner?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  technologyStack?: string[];
  healthCheckUrl?: string;
  healthCheckPath?: string;
  endpoints?: Record<string, string>;
}

export class UpdateServiceDto {
  displayName?: string;
  description?: string;
  version?: string;
  statusCatalogId?: string;
  statusValue?: string;
  teamOwner?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  technologyStack?: string[];
  healthCheckUrl?: string;
  healthCheckPath?: string;
  endpoints?: Record<string, string>;
  isActive?: boolean;
}

export class ServiceHeartbeatDto {
  environment!: string;
  instanceId?: string;
  status!: 'up' | 'down' | 'degraded';
  responseTimeMs?: number;
  version?: string;
  metadata?: Record<string, any>;
}

export class ServiceResponseDto {
  id!: string;
  name!: string;
  displayName!: string;
  description?: string;
  version!: string;
  statusCatalogId?: string;
  statusValue?: string;
  teamOwner?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  technologyStack!: string[];
  healthCheckUrl?: string;
  healthCheckPath?: string;
  endpoints!: Record<string, string>;
  isActive!: boolean;
  lastHeartbeat?: {
    status: string;
    reportedAt: Date;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
