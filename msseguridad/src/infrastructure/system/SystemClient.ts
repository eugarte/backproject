/**
 * SystemClient SDK - Cliente para consumir mssistemas
 */

export interface CatalogValue {
  id: string;
  catalogId: string;
  code: string;
  label: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Catalog {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  values: CatalogValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Configuration {
  id: string;
  serviceId?: string;
  environment: string;
  key: string;
  value: any;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isEncrypted: boolean;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Secret {
  id: string;
  key: string;
  description?: string;
  serviceIds: string[];
  expiresAt?: Date;
  rotationDueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy: 'simple' | 'percentage' | 'user_segment' | 'time_based' | 'custom';
  strategyConfig?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  reason: string;
}

export interface ServiceMetadata {
  name: string;
  description?: string;
  version: string;
  baseUrl: string;
  healthCheckUrl: string;
  environment: string;
  metadata?: Record<string, any>;
}

export interface RegisteredService extends ServiceMetadata {
  id: string;
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface HeartbeatResponse {
  id: string;
  serviceId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  reportedAt: Date;
}

export interface SystemClientConfig {
  baseUrl: string;
  apiKey: string;
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  timeout?: number;
}

export class SystemClient {
  private baseUrl: string;
  private apiKey: string;
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;
  private timeout: number;
  private serviceId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: SystemClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.serviceName = config.serviceName;
    this.serviceVersion = config.serviceVersion || '1.0.0';
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.timeout = config.timeout || 5000;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Service-Name': this.serviceName,
    };
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
        signal: controller.signal,
      };

      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async getCatalogValues(catalogKey: string): Promise<CatalogValue[]> {
    try {
      const catalog = await this.request<Catalog>('GET', `/api/v1/catalogs/${catalogKey}/values`);
      return catalog?.values || [];
    } catch (error) {
      console.warn(`[SystemClient] Failed to get catalog values for ${catalogKey}:`, error);
      return [];
    }
  }

  async validateCatalogValue(catalogKey: string, code: string): Promise<boolean> {
    try {
      const values = await this.getCatalogValues(catalogKey);
      return values.some(v => v.code === code && v.isActive);
    } catch (error) {
      console.warn(`[SystemClient] Failed to validate catalog value ${code} in ${catalogKey}:`, error);
      return false;
    }
  }

  async getCatalogValue(catalogKey: string, code: string): Promise<CatalogValue | null> {
    try {
      const values = await this.getCatalogValues(catalogKey);
      return values.find(v => v.code === code && v.isActive) || null;
    } catch (error) {
      console.warn(`[SystemClient] Failed to get catalog value ${code} from ${catalogKey}:`, error);
      return null;
    }
  }

  async getConfiguration(key: string, environment?: string): Promise<any> {
    try {
      const env = environment || this.environment;
      const configs = await this.request<Configuration[]>('GET', `/api/v1/configurations?serviceId=${this.serviceId}&environment=${env}&key=${key}`);
      
      if (configs && configs.length > 0) {
        return configs[0].value;
      }
      return null;
    } catch (error) {
      console.warn(`[SystemClient] Failed to get configuration ${key}:`, error);
      return null;
    }
  }

  async getMostSpecificConfiguration(key: string, environment?: string): Promise<Configuration | null> {
    try {
      const env = environment || this.environment;
      const config = await this.request<Configuration>('GET', `/api/v1/configurations/resolve?serviceId=${this.serviceId}&environment=${env}&key=${key}`);
      return config || null;
    } catch (error) {
      console.warn(`[SystemClient] Failed to get most specific configuration ${key}:`, error);
      return null;
    }
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const secrets = await this.request<Secret[]>('GET', `/api/v1/secrets`);
      const secret = secrets.find(s => s.key === key);
      
      if (!secret) {
        return null;
      }

      const value = await this.request<{ value: string }>('GET', `/api/v1/secrets/${secret.id}/value`);
      return value?.value || null;
    } catch (error) {
      console.warn(`[SystemClient] Failed to get secret ${key}:`, error);
      return null;
    }
  }

  async evaluateFlag(flagKey: string, context: Record<string, any> = {}): Promise<boolean> {
    try {
      const result = await this.request<FeatureFlagEvaluation>('POST', `/api/v1/public/${flagKey}/evaluate`, {
        serviceId: this.serviceId,
        environment: this.environment,
        context,
      });
      return result?.enabled || false;
    } catch (error) {
      console.warn(`[SystemClient] Failed to evaluate feature flag ${flagKey}:`, error);
      return false;
    }
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      return await this.request<FeatureFlag[]>('GET', '/api/v1/feature-flags');
    } catch (error) {
      console.warn('[SystemClient] Failed to get feature flags:', error);
      return [];
    }
  }

  async registerService(metadata?: Partial<ServiceMetadata>): Promise<RegisteredService> {
    const serviceData: ServiceMetadata = {
      name: this.serviceName,
      version: this.serviceVersion,
      environment: this.environment,
      baseUrl: metadata?.baseUrl || process.env.SERVICE_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
      healthCheckUrl: metadata?.healthCheckUrl || '/health',
      description: metadata?.description,
      metadata: metadata?.metadata,
    };

    try {
      const existingServices = await this.request<RegisteredService[]>('GET', '/api/v1/services');
      const existingService = existingServices.find(s => s.name === this.serviceName);

      if (existingService) {
        this.serviceId = existingService.id;
        console.log(`[SystemClient] Service ${this.serviceName} already registered with ID: ${this.serviceId}`);
        return existingService;
      }

      const registered = await this.request<RegisteredService>('POST', '/api/v1/services', serviceData);
      this.serviceId = registered.id;
      console.log(`[SystemClient] Service ${this.serviceName} registered with ID: ${this.serviceId}`);
      return registered;
    } catch (error) {
      console.error(`[SystemClient] Failed to register service:`, error);
      throw error;
    }
  }

  async sendHeartbeat(status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'): Promise<HeartbeatResponse | null> {
    if (!this.serviceId) {
      console.warn('[SystemClient] Cannot send heartbeat: service not registered');
      return null;
    }

    try {
      const heartbeat = await this.request<HeartbeatResponse>('POST', `/api/v1/services/${this.serviceId}/heartbeat`, {
        status,
        version: this.serviceVersion,
        environment: this.environment,
      });
      console.debug(`[SystemClient] Heartbeat sent: ${status}`);
      return heartbeat;
    } catch (error) {
      console.warn('[SystemClient] Failed to send heartbeat:', error);
      return null;
    }
  }

  startHeartbeat(intervalMs: number = 30000): void {
    if (this.heartbeatInterval) {
      console.log('[SystemClient] Heartbeat already running');
      return;
    }

    console.log(`[SystemClient] Starting heartbeat every ${intervalMs}ms`);
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat('healthy');
    }, intervalMs);

    this.sendHeartbeat('healthy');
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[SystemClient] Heartbeat stopped');
    }
  }

  getServiceId(): string | null {
    return this.serviceId;
  }

  getServiceName(): string {
    return this.serviceName;
  }
}

export default SystemClient;
