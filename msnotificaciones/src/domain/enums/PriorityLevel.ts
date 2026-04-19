import { SystemClient, CatalogValue } from '../../infrastructure/system/SystemClient';

/**
 * Priority Level - Obtiene valores del catálogo 'priority_levels' de mssistemas
 * Fallback a valores por defecto si mssistemas no está disponible
 */
export class PriorityLevelCatalog {
  private static client: SystemClient | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };

  static setClient(client: SystemClient): void {
    PriorityLevelCatalog.client = client;
  }

  static async initialize(): Promise<void> {
    if (PriorityLevelCatalog.initialized) return;

    try {
      if (PriorityLevelCatalog.client) {
        const values = await PriorityLevelCatalog.client.getCatalogValues('priority_levels');
        if (values.length > 0) {
          PriorityLevelCatalog.cachedValues.clear();
          values.forEach((v: CatalogValue) => {
            PriorityLevelCatalog.cachedValues.set(v.code.toUpperCase(), v.code);
          });
          console.log('[PriorityLevelCatalog] Loaded from mssistemas:', Array.from(PriorityLevelCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[PriorityLevelCatalog] Failed to load from mssistemas, using defaults:', error);
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

    if (PriorityLevelCatalog.client) {
      return await PriorityLevelCatalog.client.validateCatalogValue('priority_levels', code);
    }

    return Object.values(PriorityLevelCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (PriorityLevelCatalog.cachedValues.size > 0) {
      return Array.from(PriorityLevelCatalog.cachedValues.values());
    }
    return Object.values(PriorityLevelCatalog.DEFAULT_VALUES);
  }
}
