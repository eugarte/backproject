import { v4 as uuidv4 } from 'uuid';

export interface CatalogProps {
  id?: string;
  key: string;
  name: string;
  description?: string | null;
  allowMultiple?: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Catalog {
  public readonly id: string;
  public key: string;
  public name: string;
  public description: string | null;
  public allowMultiple: boolean;
  public isActive: boolean;
  public createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: CatalogProps) {
    this.id = props.id || uuidv4();
    this.key = props.key;
    this.name = props.name;
    this.description = props.description ?? null;
    this.allowMultiple = props.allowMultiple ?? false;
    this.isActive = props.isActive ?? true;
    this.createdBy = props.createdBy ?? 'system';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public update(data: Partial<Omit<CatalogProps, 'id' | 'createdAt'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.allowMultiple !== undefined) this.allowMultiple = data.allowMultiple;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    this.updatedAt = new Date();
  }
}
