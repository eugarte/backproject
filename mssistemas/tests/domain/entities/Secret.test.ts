import { Secret } from '../../src/domain/entities/Secret';

describe('Secret Entity', () => {
  it('should create a secret with default values', () => {
    const secret = new Secret('api_key', 'encrypted-value-123');

    expect(secret.key).toBe('api_key');
    expect(secret.encryptedValue).toBe('encrypted-value-123');
    expect(secret.encryptionVersion).toBe('v1');
    expect(secret.serviceId).toBeNull();
    expect(secret.environment).toBeNull();
    expect(secret.isRotating).toBe(false);
    expect(secret.lastRotatedAt).toBeNull();
    expect(secret.expiresAt).toBeNull();
    expect(secret.id).toBeDefined();
    expect(secret.createdAt).toBeInstanceOf(Date);
  });

  it('should create a secret with custom values', () => {
    const expiresAt = new Date('2025-12-31');
    const secret = new Secret(
      'db_password',
      'encrypted-value',
      'v2',
      'service-id',
      'production',
      expiresAt,
      'admin'
    );

    expect(secret.key).toBe('db_password');
    expect(secret.encryptionVersion).toBe('v2');
    expect(secret.serviceId).toBe('service-id');
    expect(secret.environment).toBe('production');
    expect(secret.expiresAt).toEqual(expiresAt);
    expect(secret.createdBy).toBe('admin');
  });

  it('should rotate secret', () => {
    const secret = new Secret('test', 'old-value');
    const originalRotatedAt = secret.lastRotatedAt;
    
    secret.rotate('new-encrypted-value');

    expect(secret.encryptedValue).toBe('new-encrypted-value');
    expect(secret.lastRotatedAt).not.toBeNull();
    expect(secret.isRotating).toBe(false);
    expect(secret.lastRotatedAt).not.toEqual(originalRotatedAt);
  });

  it('should start rotation', () => {
    const secret = new Secret('test', 'value');
    
    secret.startRotation();

    expect(secret.isRotating).toBe(true);
  });

  it('should check if secret is expired', () => {
    const expiredSecret = new Secret('test', 'value', 'v1', null, null, new Date('2020-01-01'));
    expect(expiredSecret.isExpired()).toBe(true);

    const validSecret = new Secret('test', 'value', 'v1', null, null, new Date('2025-12-31'));
    expect(validSecret.isExpired()).toBe(false);

    const noExpirySecret = new Secret('test', 'value');
    expect(noExpirySecret.isExpired()).toBe(false);
  });
});
