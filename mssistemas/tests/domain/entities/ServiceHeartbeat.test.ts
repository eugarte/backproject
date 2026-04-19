import { ServiceHeartbeat } from '../../src/domain/entities/ServiceHeartbeat';

describe('ServiceHeartbeat Entity', () => {
  it('should create a heartbeat with default values', () => {
    const heartbeat = new ServiceHeartbeat('service-id', 'production', 'instance-1');

    expect(heartbeat.serviceId).toBe('service-id');
    expect(heartbeat.environment).toBe('production');
    expect(heartbeat.instanceId).toBe('instance-1');
    expect(heartbeat.status).toBe('up');
    expect(heartbeat.responseTimeMs).toBe(0);
    expect(heartbeat.version).toBe('1.0.0');
    expect(heartbeat.metadata).toEqual({});
    expect(heartbeat.reportedAt).toBeInstanceOf(Date);
    expect(heartbeat.id).toBeDefined();
  });

  it('should create a heartbeat with custom values', () => {
    const metadata = { cpu: '45%', memory: '60%' };
    const heartbeat = new ServiceHeartbeat(
      'service-id',
      'staging',
      'instance-2',
      'degraded',
      150,
      '2.0.0',
      metadata
    );

    expect(heartbeat.environment).toBe('staging');
    expect(heartbeat.status).toBe('degraded');
    expect(heartbeat.responseTimeMs).toBe(150);
    expect(heartbeat.version).toBe('2.0.0');
    expect(heartbeat.metadata).toEqual(metadata);
  });

  it('should detect stale heartbeat', () => {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 5);
    
    const heartbeat = new ServiceHeartbeat(
      'service-id',
      'production',
      'instance-1',
      'up',
      0,
      '1.0.0',
      {},
      oldDate
    );

    expect(heartbeat.isStale()).toBe(true);
  });

  it('should not detect recent heartbeat as stale', () => {
    const recentDate = new Date();
    recentDate.setSeconds(recentDate.getSeconds() - 30);
    
    const heartbeat = new ServiceHeartbeat(
      'service-id',
      'production',
      'instance-1',
      'up',
      0,
      '1.0.0',
      {},
      recentDate
    );

    expect(heartbeat.isStale()).toBe(false);
  });

  it('should respect custom stale threshold', () => {
    const somewhatOldDate = new Date();
    somewhatOldDate.setMinutes(somewhatOldDate.getMinutes() - 1);
    
    const heartbeat = new ServiceHeartbeat(
      'service-id',
      'production',
      'instance-1',
      'up',
      0,
      '1.0.0',
      {},
      somewhatOldDate
    );

    // With default 2 minute threshold, should not be stale
    expect(heartbeat.isStale()).toBe(false);
    
    // With 0.5 minute threshold, should be stale
    expect(heartbeat.isStale(0.5)).toBe(true);
  });
});
