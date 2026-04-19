import { SystemClient, CatalogValue } from '../../infrastructure/system/SystemClient';

/**
 * User Roles - Obtiene valores del catálogo 'user_roles' de mssistemas
 * Fallback a valores por defecto si mssistemas no está disponible
 */
export class UserRole {
  private static client: SystemClient | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
    GUEST: 'guest',
    DEVELOPER: 'developer',
  };

  static setClient(client: SystemClient): void {
    UserRole.client = client;
  }

  static async initialize(): Promise<void> {
    if (UserRole.initialized) return;

    try {
      if (UserRole.client) {
        const values = await UserRole.client.getCatalogValues('user_roles');
        if (values.length > 0) {
          UserRole.cachedValues.clear();
          values.forEach((v: CatalogValue) => {
            UserRole.cachedValues.set(v.code.toUpperCase(), v.code);
          });
          console.log('[UserRole] Loaded from mssistemas:', Array.from(UserRole.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[UserRole] Failed to load from mssistemas, using defaults:', error);
    }

    UserRole.initialized = true;
  }

  static get ADMIN(): string {
    return UserRole.cachedValues.get('ADMIN') || UserRole.DEFAULT_VALUES.ADMIN;
  }

  static get USER(): string {
    return UserRole.cachedValues.get('USER') || UserRole.DEFAULT_VALUES.USER;
  }

  static get MODERATOR(): string {
    return UserRole.cachedValues.get('MODERATOR') || UserRole.DEFAULT_VALUES.MODERATOR;
  }

  static get GUEST(): string {
    return UserRole.cachedValues.get('GUEST') || UserRole.DEFAULT_VALUES.GUEST;
  }

  static get DEVELOPER(): string {
    return UserRole.cachedValues.get('DEVELOPER') || UserRole.DEFAULT_VALUES.DEVELOPER;
  }

  static async validate(code: string): Promise<boolean> {
    if (!UserRole.initialized) {
      await UserRole.initialize();
    }

    if (UserRole.client) {
      return await UserRole.client.validateCatalogValue('user_roles', code);
    }

    return Object.values(UserRole.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (UserRole.cachedValues.size > 0) {
      return Array.from(UserRole.cachedValues.values());
    }
    return Object.values(UserRole.DEFAULT_VALUES);
  }

  static hasPermission(userRole: string, requiredRole: string): boolean {
    const hierarchy = [UserRole.GUEST, UserRole.USER, UserRole.MODERATOR, UserRole.DEVELOPER, UserRole.ADMIN];
    const userIndex = hierarchy.indexOf(userRole);
    const requiredIndex = hierarchy.indexOf(requiredRole);
    
    if (userIndex === -1 || requiredIndex === -1) {
      return false;
    }

    return userIndex >= requiredIndex;
  }
}

