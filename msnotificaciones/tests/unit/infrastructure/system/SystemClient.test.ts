import { SystemClient } from '../../../../src/infrastructure/system/SystemClient';

// Mock fetch
global.fetch = jest.fn();

describe('SystemClient', () => {
  let client: SystemClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SystemClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-api-key',
      serviceName: 'msnotificaciones',
      serviceVersion: '1.0.0',
      environment: 'test',
    });
  });

  describe('Configuration', () => {
    it('should initialize with correct config', () => {
      expect(client).toBeDefined();
    });

    it('should throw if baseUrl is missing', () => {
      expect(() => {
        new SystemClient({
          baseUrl: '',
          apiKey: 'test',
          serviceName: 'test',
        } as any);
      }).toThrow('Base URL is required');
    });
  });

  describe('Catalog Operations', () => {
    it('should handle catalog API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const values = await client.getCatalogValues('test');

      expect(values).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const values = await client.getCatalogValues('test');

      expect(values).toEqual([]);
    });
  });

  describe('Configuration Operations', () => {
    it('should return null for missing configuration', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const config = await client.getConfiguration('missing_key');

      expect(config).toBeNull();
    });
  });

  describe('Service Registration', () => {
    it('should handle registration failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Invalid data' }),
        json: async () => ({ error: 'Invalid data' }),
      });

      await expect(
        client.registerService({
          description: 'Test',
          baseUrl: 'http://test',
        })
      ).rejects.toThrow();
    });
  });

  describe('Heartbeat', () => {
    it('should throw if sending heartbeat before registration', async () => {
      await expect(client.sendHeartbeat()).rejects.toThrow('Service not registered');
    });
  });

  describe('Feature Flags', () => {
    it('should return false on API error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const enabled = await client.evaluateFlag('test');

      expect(enabled).toBe(false);
    });
  });
});
