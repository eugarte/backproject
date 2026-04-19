import { Secret } from '../../src/domain/entities/Secret';

describe('Secret', () => {
  it('should create a secret with default values', () => {
    const secret = new Secret({
      key: 'database.password',
      encryptedValue: 'encrypted-string',
    });

    expect(secret.id).toBeDefined();
    expect(secret.key).toBe('database.password');
    expect(secret.encryptedValue).toBe('encrypted-string');
    expect(secret.encryptionVersion).toBe('v1');
    expect(secret.isRotating).toBe(false);
  });

  it('should start and complete rotation', () => {
    const secret = new Secret({
      key: 'test',
      encryptedValue: 'old-value',
    });

    secret.startRotation();
    expect(secret.isRotating).toBe(true);

    secret.completeRotation();
    expect(secret.isRotating).toBe(false);
    expect(secret.lastRotatedAt).toBeDefined();
  });

  it('should detect expired secret', () => {
    const expiredSecret = new Secret({
      key: 'expired',
      encryptedValue: 'value',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    });

    const validSecret = new Secret({
      key: 'valid',
      encryptedValue: 'value',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    });

    const noExpirySecret = new Secret({
      key: 'no-expiry',
      encryptedValue: 'value',
    });

    expect(expiredSecret.isExpired()).toBe(true);
    expect(validSecret.isExpired()).toBe(false);
    expect(noExpirySecret.isExpired()).toBe(false);
  });
});