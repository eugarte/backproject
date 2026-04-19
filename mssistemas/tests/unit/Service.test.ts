import { Service } from '../../src/domain/entities/Service';
import { ServiceHeartbeat } from '../../src/domain/entities/ServiceHeartbeat';

describe('Service', () => {
  it('should create a service with default values', () => {
    const service = new Service({
      name: 'test-service',
    });

    expect(service.id).toBeDefined();
    expect(service.name).toBe('test-service');
    expect(service.displayName).toBe('test-service');
    expect(service.version).toBe('1.0.0');
    expect(service.isActive).toBe(true);
    expect(service.technologyStack).toEqual([]);
    expect(service.endpoints).toEqual({});
  });

  it('should update service properties', () => {
    const service = new Service({
      name: 'test-service',
    });

    service.update({
      displayName: 'Test Service',
      version: '2.0.0',
    });

    expect(service.displayName).toBe('Test Service');
    expect(service.version).toBe('2.0.0');
    expect(service.updatedAt).toBeDefined();
  });

  it('should set and get endpoints', () => {
    const service = new Service({
      name: 'test-service',
    });

    service.setEndpoint('dev', 'http://localhost:3000');
    service.setEndpoint('prod', 'https://api.example.com');

    expect(service.getEndpoint('dev')).toBe('http://localhost:3000');
    expect(service.getEndpoint('prod')).toBe('https://api.example.com');
  });
});

describe('ServiceHeartbeat', () => {
  it('should create a heartbeat with default values', () => {
    const heartbeat = new ServiceHeartbeat({
      serviceId: 'service-123',
      environment: 'dev',
    });

    expect(heartbeat.id).toBeDefined();
    expect(heartbeat.serviceId).toBe('service-123');
    expect(heartbeat.environment).toBe('dev');
    expect(heartbeat.status).toBe('up');
    expect(heartbeat.instanceId).toBe('default');
    expect(heartbeat.reportedAt).toBeDefined();
  });

  it('should detect stale heartbeat', () => {
    const heartbeat = new ServiceHeartbeat({
      serviceId: 'service-123',
      reportedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    });

    expect(heartbeat.isStale(2)).toBe(true);
    expect(heartbeat.isStale(10)).toBe(false);
  });
});