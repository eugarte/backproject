import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { PriorityLevelRepository } from '../../infrastructure/persistence/repositories/PriorityLevelRepository';

/**
 * Priority Level - Obtiene valores del catálogo 'priority_levels' de la base de datos local
 * Fallback a valores por defecto si la BD no está disponible
 */
export class PriorityLevelCatalog {
  private static repository: PriorityLevelRepository | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };

  static initializeRepository(dataSource = AppDataSource): void {
    if (dataSource.isInitialized) {
      PriorityLevelCatalog.repository = new PriorityLevelRepository(dataSource);
    }
  }

  static async initialize(): Promise<void> {
    if (PriorityLevelCatalog.initialized) return;

    try {
      if (!PriorityLevelCatalog.repository && AppDataSource.isInitialized) {
        PriorityLevelCatalog.initializeRepository();
      }

      if (PriorityLevelCatalog.repository) {
        const codes = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const values = await PriorityLevelCatalog.repository.findByCodes(codes);
        
        // Verificar que values sea un Map válido
        if (values && values instanceof Map && values.size > 0) {
          PriorityLevelCatalog.cachedValues.clear();
          values.forEach((value, key) => {
            PriorityLevelCatalog.cachedValues.set(key, value);
          });
          console.log('[PriorityLevelCatalog] Loaded from database:', Array.from(PriorityLevelCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[PriorityLevelCatalog] Failed to load from database, using defaults:', error);
    }

    PriorityLevelCatalog.initialized = true;
  }

  static get LOW(): string {
    return PriorityLevelCatalog.cachedValues.get('LOW') || PriorityLevelCatalog.DEFAULT_VALUES.LOW;
  }

  static get MEDIUM(): string {
    return PriorityLevelCatalog.cachedValues.get('MEDIUM') || PriorityLevelCatalog.DEFAULT_VALUES.MEDIUM;
  }

  static get HIGH(): string {
    return PriorityLevelCatalog.cachedValues.get('HIGH') || PriorityLevelCatalog.DEFAULT_VALUES.HIGH;
  }

  static get CRITICAL(): string {
    return PriorityLevelCatalog.cachedValues.get('CRITICAL') || PriorityLevelCatalog.DEFAULT_VALUES.CRITICAL;
  }

  static async validate(code: string): Promise<boolean> {
    if (!PriorityLevelCatalog.initialized) {
      await PriorityLevelCatalog.initialize();
    }

    if (PriorityLevelCatalog.repository) {
      try {
        const isValid = await PriorityLevelCatalog.repository.validateCode(code);
        if (typeof isValid === 'boolean') {
          return isValid;
        }
      } catch (error) {
        console.warn('[PriorityLevelCatalog] Repository validation failed, using defaults');
      }
    }

    return Object.values(PriorityLevelCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (PriorityLevelCatalog.cachedValues.size > 0) {
      return Array.from(PriorityLevelCatalog.cachedValues.values());
    }
    return Object.values(PriorityLevelCatalog.DEFAULT_VALUES);
  }

  static reset(): void {
    PriorityLevelCatalog.cachedValues.clear();
    PriorityLevelCatalog.initialized = false;
    PriorityLevelCatalog.repository = null;
  }
}