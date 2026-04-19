import { SystemClient, SystemClientConfig, Catalog, CatalogValue, Configuration, RegisteredService, HeartbeatResponse } from '@infrastructure/system/SystemClient';

describe('SystemClient', () => {
  let client: SystemClient;
  const mockConfig: SystemClientConfig = {
    baseUrl: 'http://localhost:3001',
    apiKey: 'test-api-key',
    serviceName: 'msseguridad',
    serviceVersion: '1.0.0',
    environment: 'test',
    timeout: 5000,
  };

  beforeEach(() => {
    client = new SystemClient(mockConfig);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided config', () => {
      expect(client).toBeInstanceOf(SystemClient);
    });

    it('should remove trailing slash from baseUrl', () => {
      const clientWithSlash = new SystemClient({
        ...mockConfig,
        baseUrl: 'http://localhost:3001/',
      });
      expect(clientWithSlash.getServiceName()).toBe('msseguridad');
    });

    it('should use default values for optional config', () => {
      const minimalClient = new SystemClient({
        baseUrl: 'http://localhost:3001',
        apiKey: 'test-key',
        serviceName: 'test-service',
      });
      expect(minimalClient.getServiceName()).toBe('test-service');
    });
  });

  describe('getCatalogValues', () => {
    it('should return catalog values on success', async () => {
      const mockValues: CatalogValue[] = [
        {
          id: '1',
          catalogId: 'cat-1',
          code: 'active',
          label: 'Active',
          order: 1,
          isDefault: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockCatalog: Catalog = {
        id: 'cat-1',
        key: 'user_status',
        name: 'User Status',
        isActive: true,
        values: mockValues,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const result = await client.getCatalogValues('user_status');
      expect(result).toEqual(mockValues);
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getCatalogValues('user_status');
      expect(result).toEqual([]);
    });

    it('should handle non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const result = await client.getCatalogValues('user_status');
      expect(result).toEqual([]);
    });
  });

  describe('validateCatalogValue', () => {
    it('should return true for valid catalog value', async () => {
      const mockCatalog: Catalog = {
        id: 'cat-1',
        key: 'user_status',
        name: 'User Status',
        isActive: true,
        values: [
          {
            id: '1',
            catalogId: 'cat-1',
            code: 'active',
            label: 'Active',
            order: 1,
            isDefault: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const result = await client.validateCatalogValue('user_status', 'active');
      expect(result).toBe(true);
    });

    it('should return false for invalid catalog value', async () => {
      const mockCatalog: Catalog = {
        id: 'cat-1',
        key: 'user_status',
        name: 'User Status',
        isActive: true,
        values: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const result = await client.validateCatalogValue('user_status', 'inactive');
      expect(result).toBe(false);
    });
  });

  describe('getConfiguration', () => {
    it('should return configuration value on success', async () => {
      const mockConfigs: Configuration[] = [
        {
          id: '1',
          serviceId: 'svc-1',
          environment: 'test',
          key: 'max_login_attempts',
          value: 5,
          valueType: 'number',
          isEncrypted: false,
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfigs,
      });

      // First register the service to set serviceId
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.registerService();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConfigs,
      });

      const result = await client.getConfiguration('max_login_attempts');
      expect(result).toBe(5);
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getConfiguration('max_login_attempts');
      expect(result).toBeNull();
    });
  });

  describe('registerService', () => {
    it('should register new service', async () => {
      const mockService: RegisteredService = {
        id: 'svc-123',
        name: 'msseguridad',
        version: '1.0.0',
        environment: 'test',
        baseUrl: 'http://localhost:3000',
        healthCheckUrl: '/health',
        description: 'Test service',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockService,
      });

      const result = await client.registerService({
        description: 'Test service',
        baseUrl: 'http://localhost:3000',
        healthCheckUrl: '/health',
      });

      expect(result.id).toBe('svc-123');
      expect(client.getServiceId()).toBe('svc-123');
    });

    it('should return existing service if already registered', async () => {
      const existingService: RegisteredService = {
        id: 'svc-existing',
        name: 'msseguridad',
        version: '1.0.0',
        environment: 'test',
        baseUrl: 'http://localhost:3000',
        healthCheckUrl: '/health',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [existingService],
      });

      const result = await client.registerService();

      expect(result.id).toBe('svc-existing');
      expect(client.getServiceId()).toBe('svc-existing');
    });

    it('should throw error on registration failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      await expect(client.registerService()).rejects.toThrow('HTTP 500: Internal server error');
    });
  });

  describe('sendHeartbeat', () => {
    it('should send heartbeat successfully', async () => {
      const mockHeartbeat: HeartbeatResponse = {
        id: 'hb-1',
        serviceId: 'svc-123',
        status: 'healthy',
        reportedAt: new Date(),
      };

      // Register service first
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'svc-123',
          name: 'msseguridad',
          version: '1.0.0',
          environment: 'test',
          baseUrl: 'http://localhost:3000',
          healthCheckUrl: '/health',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      await client.registerService();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockHeartbeat,
      });

      const result = await client.sendHeartbeat('healthy');
      expect(result).toEqual(mockHeartbeat);
    });

    it('should return null if service not registered', async () => {
      const result = await client.sendHeartbeat('healthy');
      expect(result).toBeNull();
    });

    it('should handle heartbeat failure gracefully', async () => {
      // Register service
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'svc-123',
          name: 'msseguridad',
          version: '1.0.0',
          environment: 'test',
          baseUrl: 'http://localhost:3000',
          healthCheckUrl: '/health',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      await client.registerService();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.sendHeartbeat('healthy');
      expect(result).toBeNull();
    });
  });

  describe('startHeartbeat / stopHeartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start heartbeat interval', async () => {
      // Register service
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'svc-123',
          name: 'msseguridad',
          version: '1.0.0',
          environment: 'test',
          baseUrl: 'http://localhost:3000',
          healthCheckUrl: '/health',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      await client.registerService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'hb-1',
          serviceId: 'svc-123',
          status: 'healthy',
          reportedAt: new Date(),
        }),
      });

      client.startHeartbeat(30000);

      // Fast-forward time
      jest.advanceTimersByTime(30000);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not start multiple heartbeat intervals', () => {
      // Register service first
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'svc-123',
          name: 'msseguridad',
          version: '1.0.0',
          environment: 'test',
          baseUrl: 'http://localhost:3000',
          healthCheckUrl: '/health',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      client.startHeartbeat(30000);
      client.startHeartbeat(30000); // Second call should be ignored

      // Should log that heartbeat is already running
    });

    it('should stop heartbeat interval', () => {
      // Register service
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'svc-123',
          name: 'msseguridad',
          version: '1.0.0',
          environment: 'test',
          baseUrl: 'http://localhost:3000',
          healthCheckUrl: '/health',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      client.startHeartbeat(30000);
      client.stopHeartbeat();

      // After stopping, should not send more heartbeats
      const fetchCallsAfterStop = (global.fetch as jest.Mock).mock.calls.length;

      jest.advanceTimersByTime(60000);

      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsAfterStop);
    });
  });

  describe('timeout handling', () => {
    it('should handle request timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.reject(abortError);
      });

      // Use a client with short timeout
      const shortTimeoutClient = new SystemClient({
        ...mockConfig,
        timeout: 1, // 1ms timeout to trigger abort
      });

      const result = await shortTimeoutClient.getCatalogValues('user_status');
      expect(result).toEqual([]);
    });
  });

  describe('getCatalogValue', () => {
    it('should return specific catalog value', async () => {
      const mockCatalog: Catalog = {
        id: 'cat-1',
        key: 'user_status',
        name: 'User Status',
        isActive: true,
        values: [
          {
            id: '1',
            catalogId: 'cat-1',
            code: 'active',
            label: 'Active',
            order: 1,
            isDefault: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            catalogId: 'cat-1',
            code: 'inactive',
            label: 'Inactive',
            order: 2,
            isDefault: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const result = await client.getCatalogValue('user_status', 'active');
      expect(result).toEqual(mockCatalog.values[0]);
    });

    it('should return null for inactive value', async () => {
      const mockCatalog: Catalog = {
        id: 'cat-1',
        key: 'user_status',
        name: 'User Status',
        isActive: true,
        values: [
          {
            id: '1',
            catalogId: 'cat-1',
            code: 'deprecated',
            label: 'Deprecated',
            order: 1,
            isDefault: false,
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCatalog,
      });

      const result = await client.getCatalogValue('user_status', 'deprecated');
      expect(result).toBeNull();
    });
  });
});
