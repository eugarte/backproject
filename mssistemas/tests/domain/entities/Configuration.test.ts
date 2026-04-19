import { Configuration, ConfigurationType } from '../../src/domain/entities/Configuration';

describe('Configuration Entity', () => {
  it('should create a configuration with default values', () => {
    const config = new Configuration('db.host', 'localhost');

    expect(config.key).toBe('db.host');
    expect(config.value).toBe('localhost');
    expect(config.type).toBe('string');
    expect(config.serviceId).toBeNull();
    expect(config.environment).toBeNull();
    expect(config.isSecret).toBe(false);
    expect(config.isEncrypted).toBe(false);
    expect(config.version).toBe(1);
    expect(config.deletedAt).toBeNull();
    expect(config.id).toBeDefined();
  });

  it('should create a configuration with custom values', () => {
    const config = new Configuration(
      'db.port',
      '5432',
      'number' as ConfigurationType,
      'service-id',
      'production',
      true,
      false,
      'Database port',
      ['database']
    );

    expect(config.key).toBe('db.port');
    expect(config.value).toBe('5432');
    expect(config.type).toBe('number');
    expect(config.serviceId).toBe('service-id');
    expect(config.environment).toBe('production');
    expect(config.isSecret).toBe(true);
  });

  it('should update configuration and increment version', () => {
    const config = new Configuration('test', 'value');
    const originalVersion = config.version;
    
    config.update({
      value: 'new value'
    });

    expect(config.value).toBe('new value');
    expect(config.version).toBe(originalVersion + 1);
  });

  it('should parse string value correctly', () => {
    const config = new Configuration('test', 'string value');
    expect(config.getParsedValue()).toBe('string value');
  });

  it('should parse number value correctly', () => {
    const config = new Configuration('test', '42', 'number');
    expect(config.getParsedValue()).toBe(42);
  });

  it('should parse boolean value correctly', () => {
    const config1 = new Configuration('test', 'true', 'boolean');
    expect(config1.getParsedValue()).toBe(true);

    const config2 = new Configuration('test', '1', 'boolean');
    expect(config2.getParsedValue()).toBe(true);

    const config3 = new Configuration('test', 'false', 'boolean');
    expect(config3.getParsedValue()).toBe(false);
  });

  it('should parse JSON value correctly', () => {
    const config = new Configuration('test', '{"key":"value"}', 'json');
    expect(config.getParsedValue()).toEqual({ key: 'value' });
  });

  it('should return original value for invalid JSON', () => {
    const config = new Configuration('test', 'invalid json', 'json');
    expect(config.getParsedValue()).toBe('invalid json');
  });

  it('should soft delete configuration', () => {
    const config = new Configuration('test', 'value');
    
    config.softDelete();

    expect(config.deletedAt).not.toBeNull();
    expect(config.isDeleted()).toBe(true);
  });
});
