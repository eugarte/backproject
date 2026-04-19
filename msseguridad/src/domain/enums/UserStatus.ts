import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { UserStatusRepository } from '../../infrastructure/persistence/repositories/UserStatusRepository';

/**
 * User Status - Obtiene valores del catálogo 'user_status' de la base de datos local
 * Fallback a valores por defecto si la BD no está disponible
 */
export class UserStatus {
  private static repository: UserStatusRepository | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
    BANNED: 'banned',
  };

  static initializeRepository(dataSource = AppDataSource): void {
    if (dataSource.isInitialized) {
      UserStatus.repository = new UserStatusRepository(dataSource);
    }
  }

  static async initialize(): Promise<void> {
    if (UserStatus.initialized) return;

    try {
      if (!UserStatus.repository && AppDataSource.isInitialized) {
        UserStatus.initializeRepository();
      }

      if (UserStatus.repository) {
        const codes = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BANNED'];
        const values = await UserStatus.repository.findByCodes(codes);
        
        // Verificar que values sea un Map válido
        if (values && values instanceof Map && values.size > 0) {
          UserStatus.cachedValues.clear();
          values.forEach((value, key) => {
            UserStatus.cachedValues.set(key, value);
          });
          console.log('[UserStatus] Loaded from database:', Array.from(UserStatus.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[UserStatus] Failed to load from database, using defaults:', error);
    }

    UserStatus.initialized = true;
  }

  static get ACTIVE(): string {
    return UserStatus.cachedValues.get('ACTIVE') || UserStatus.DEFAULT_VALUES.ACTIVE;
  }

  static get INACTIVE(): string {
    return UserStatus.cachedValues.get('INACTIVE') || UserStatus.DEFAULT_VALUES.INACTIVE;
  }

  static get SUSPENDED(): string {
    return UserStatus.cachedValues.get('SUSPENDED') || UserStatus.DEFAULT_VALUES.SUSPENDED;
  }

  static get PENDING(): string {
    return UserStatus.cachedValues.get('PENDING') || UserStatus.DEFAULT_VALUES.PENDING;
  }

  static get BANNED(): string {
    return UserStatus.cachedValues.get('BANNED') || UserStatus.DEFAULT_VALUES.BANNED;
  }

  static async validate(code: string): Promise<boolean> {
    if (!UserStatus.initialized) {
      await UserStatus.initialize();
    }

    if (UserStatus.repository) {
      try {
        const isValid = await UserStatus.repository.validateCode(code);
        if (typeof isValid === 'boolean') {
          return isValid;
        }
      } catch (error) {
        console.warn('[UserStatus] Repository validation failed, using defaults');
      }
    }

    return Object.values(UserStatus.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (UserStatus.cachedValues.size > 0) {
      return Array.from(UserStatus.cachedValues.values());
    }
    return Object.values(UserStatus.DEFAULT_VALUES);
  }

  static reset(): void {
    UserStatus.cachedValues.clear();
    UserStatus.initialized = false;
    UserStatus.repository = null;
  }
}
