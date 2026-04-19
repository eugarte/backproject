import { Configuration, ConfigurationType, ConfigurationHistory } from '../../src/domain/entities/Configuration';

describe('Configuration', () => {
  it('should create a configuration with default values', () => {
    const config = new Configuration({
      key: 'database.host',
      value: 'localhost',
    });

    expect(config.id).toBeDefined();
    expect(config.key).toBe('database.host');
    expect(config.value).toBe('localhost');
    expect(config.type).toBe(ConfigurationType.STRING);
    expect(config.isSecret).toBe(false);
    expect(config.isEncrypted).toBe(false);
    expect(config.version).toBe(1);
  });

  it('should update and increment version', () => {
    const config = new Configuration({
      key: 'database.host',
      value: 'localhost',
    });

    config.update({ value: 'new-host' });

    expect(config.value).toBe('new-host');
    expect(config.version).toBe(2);
  });

  it('should parse string value', () => {
    const config = new Configuration({
      key: 'app.name',
      value: 'MyApp',
      type: ConfigurationType.STRING,
    });

    expect(config.getParsedValue()).toBe('MyApp');
  });

  it('should parse number value', () => {
    const config = new Configuration({
      key: 'database.port',
      value: '5432',
      type: ConfigurationType.NUMBER,
    });

    expect(config.getParsedValue()).toBe(5432);
  });

  it('should parse boolean value', () => {
    const config = new Configuration({
      key: 'feature.enabled',
      value: 'true',
      type: ConfigurationType.BOOLEAN,
    });

    expect(config.getParsedValue()).toBe(true);
  });

  it('should parse JSON value', () => {
    const config = new Configuration({
      key: 'settings',
      value: '{"timeout": 30, "retries": 3}',
      type: ConfigurationType.JSON,
    });

    expect(config.getParsedValue()).toEqual({ timeout: 30, retries: 3 });
  });

  it('should match hierarchy', () => {
    // Global default
    const global = new Configuration({
      key: 'timeout',
      value: '30',
    });
    expect(global.matchesHierarchy('service1', 'dev')).toBe(true);

    // Service-specific
    const serviceSpecific = new Configuration({
      serviceId: 'service1',
      key: 'timeout',
      value: '60',
    });
    expect(serviceSpecific.matchesHierarchy('service1', 'dev')).toBe(true);
    expect(serviceSpecific.matchesHierarchy('service2', 'dev')).toBe(false);

    // Environment-specific
    const envSpecific = new Configuration({
      environment: 'prod',
      key: 'timeout',
      value: '90',
    });
    expect(envSpecific.matchesHierarchy('service1', 'prod')).toBe(true);
    expect(envSpecific.matchesHierarchy('service1', 'dev')).toBe(false);

    // Service + Environment
    const specific = new Configuration({
      serviceId: 'service1',
      environment: 'prod',
      key: 'timeout',
      value: '120',
    });
    expect(specific.matchesHierarchy('service1', 'prod')).toBe(true);
    expect(specific.matchesHierarchy('service1', 'dev')).toBe(false);
    expect(specific.matchesHierarchy('service2', 'prod')).toBe(false);
  });
});