import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { UserRoleRepository } from '../../infrastructure/persistence/repositories/UserRoleRepository';

/**
 * User Roles - Obtiene valores del catálogo 'user_roles' de la base de datos local
 * Fallback a valores por defecto si la BD no está disponible
 */
export class UserRole {
  private static repository: UserRoleRepository | null = null;
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

  static initializeRepository(dataSource = AppDataSource): void {
    if (dataSource.isInitialized) {
      UserRole.repository = new UserRoleRepository(dataSource);
    }
  }

  static async initialize(): Promise<void> {
    if (UserRole.initialized) return;

    try {
      if (!UserRole.repository && AppDataSource.isInitialized) {
        UserRole.initializeRepository();
      }

      if (UserRole.repository) {
        const codes = ['ADMIN', 'USER', 'MODERATOR', 'GUEST', 'DEVELOPER'];
        const values = await UserRole.repository.findByCodes(codes);
        
        // Verificar que values sea un Map válido
        if (values && values instanceof Map && values.size > 0) {
          UserRole.cachedValues.clear();
          values.forEach((value, key) => {
            UserRole.cachedValues.set(key, value);
          });
          console.log('[UserRole] Loaded from database:', Array.from(UserRole.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[UserRole] Failed to load from database, using defaults:', error);
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

    if (UserRole.repository) {
      try {
        const isValid = await UserRole.repository.validateCode(code);
        if (typeof isValid === 'boolean') {
          return isValid;
        }
      } catch (error) {
        console.warn('[UserRole] Repository validation failed, using defaults');
      }
    }

    return Object.values(UserRole.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (UserRole.cachedValues.size > 0) {
      return Array.from(UserRole.cachedValues.values());
    }
    return Object.values(UserRole.DEFAULT_VALUES);
  }

  static async getPermissions(roleCode: string): Promise<string[]> {
    if (!UserRole.initialized) {
      await UserRole.initialize();
    }

    if (UserRole.repository) {
      try {
        return await UserRole.repository.getPermissions(roleCode);
      } catch (error) {
        console.warn('[UserRole] Failed to get permissions from repository');
      }
    }
    return [];
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

  static reset(): void {
    UserRole.cachedValues.clear();
    UserRole.initialized = false;
    UserRole.repository = null;
  }
}
