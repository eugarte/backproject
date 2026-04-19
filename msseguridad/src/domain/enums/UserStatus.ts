import { SystemClient, CatalogValue } from '../../infrastructure/system/SystemClient';

/**
 * User Status - Obtiene valores del catálogo 'user_status' de mssistemas
 * Fallback a valores por defecto si mssistemas no está disponible
 */
export class UserStatus {
  private static client: SystemClient | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  };

  static setClient(client: SystemClient): void {
    UserStatus.client = client;
  }

  static async initialize(): Promise<void> {
    if (UserStatus.initialized) return;

    try {
      if (UserStatus.client) {
        const values = await UserStatus.client.getCatalogValues('user_status');
        if (values.length > 0) {
          UserStatus.cachedValues.clear();
          values.forEach((v: CatalogValue) => {
            UserStatus.cachedValues.set(v.code.toUpperCase(), v.code);
          });
          console.log('[UserStatus] Loaded from mssistemas:', Array.from(UserStatus.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[UserStatus] Failed to load from mssistemas, using defaults:', error);
    }

    UserStatus.initialized = true;
  }

  static get ACTIVE(): string {
    return UserStatus.cachedValues.get('ACTIVE') || UserStatus.DEFAULT_VALUES.ACTIVE;
  }

  static get INACTIVE(): string {
    return UserStatus.cachedValues.get('INACTIVE') || UserStatus.DEFAULT_VALUES.INACTIVE;
  }

  static get PENDING(): string {
    return UserStatus.cachedValues.get('PENDING') || UserStatus.DEFAULT_VALUES.PENDING;
  }

  static get SUSPENDED(): string {
    return UserStatus.cachedValues.get('SUSPENDED') || UserStatus.DEFAULT_VALUES.SUSPENDED;
  }

  static get DELETED(): string {
    return UserStatus.cachedValues.get('DELETED') || UserStatus.DEFAULT_VALUES.DELETED;
  }

  static async validate(code: string): Promise<boolean> {
    if (!UserStatus.initialized) {
      await UserStatus.initialize();
    }

    if (UserStatus.client) {
      return await UserStatus.client.validateCatalogValue('user_status', code);
    }

    return Object.values(UserStatus.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (UserStatus.cachedValues.size > 0) {
      return Array.from(UserStatus.cachedValues.values());
    }
    return Object.values(UserStatus.DEFAULT_VALUES);
  }
}
