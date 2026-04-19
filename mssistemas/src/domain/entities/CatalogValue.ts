import { v4 as uuidv4 } from 'uuid';

export class CatalogValue {
  public readonly id: string;
  public catalogId: string;
  public code: string;
  public label: string;
  public description: string | null;
  public color: string | null;
  public sortOrder: number;
  public isDefault: boolean;
  public isActive: boolean;
  public deletedAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    catalogId: string,
    code: string,
    label: string,
    description: string | null = null,
    color: string | null = null,
    sortOrder: number = 0,
    isDefault: boolean = false,
    isActive: boolean = true,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null
  ) {
    this.id = id || uuidv4();
    this.catalogId = catalogId;
    this.code = code;
    this.label = label;
    this.description = description;
    this.color = color;
    this.sortOrder = sortOrder;
    this.isDefault = isDefault;
    this.isActive = isActive;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.deletedAt = deletedAt || null;
  }

  public update(data: Partial<Pick<CatalogValue, 'code' | 'label' | 'description' | 'color' | 'sortOrder' | 'isDefault' | 'isActive'>>): void {
    if (data.code !== undefined) this.code = data.code;
    if (data.label !== undefined) this.label = data.label;
    if (data.description !== undefined) this.description = data.description;
    if (data.color !== undefined) this.color = data.color;
    if (data.sortOrder !== undefined) this.sortOrder = data.sortOrder;
    if (data.isDefault !== undefined) this.isDefault = data.isDefault;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
