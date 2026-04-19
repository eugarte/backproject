import { v4 as uuidv4 } from 'uuid';

export type ConfigurationType = 'string' | 'number' | 'boolean' | 'json' | 'yaml';

export interface ConfigurationProps {
  id?: string;
  key: string;
  value: string;
  type?: ConfigurationType;
  serviceId?: string | null;
  environment?: string | null;
  isSecret?: boolean;
  isEncrypted?: boolean;
  description?: string | null;
  tags?: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Configuration {
  public readonly id: string;
  public serviceId: string | null;
  public environment: string | null;
  public key: string;
  public value: string;
  public type: ConfigurationType;
  public isSecret: boolean;
  public isEncrypted: boolean;
  public version: number;
  public description: string | null;
  public tags: string[];
  public deletedAt: Date | null;
  public createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ConfigurationProps) {
    this.id = props.id || uuidv4();
    this.key = props.key;
    this.value = props.value;
    this.type = props.type ?? 'string';
    this.serviceId = props.serviceId ?? null;
    this.environment = props.environment ?? null;
    this.isSecret = props.isSecret ?? false;
    this.isEncrypted = props.isEncrypted ?? false;
    this.description = props.description ?? null;
    this.tags = props.tags ?? [];
    this.createdBy = props.createdBy ?? 'system';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
    this.version = 1;
  }

  public update(data: Partial<Omit<ConfigurationProps, 'id' | 'createdAt'>>): void {
    if (data.value !== undefined) {
      this.value = data.value;
      this.version++;
    }
    if (data.type !== undefined) this.type = data.type;
    if (data.isSecret !== undefined) this.isSecret = data.isSecret;
    if (data.isEncrypted !== undefined) this.isEncrypted = data.isEncrypted;
    if (data.description !== undefined) this.description = data.description;
    if (data.tags !== undefined) this.tags = data.tags;
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getParsedValue(): any {
    switch (this.type) {
      case 'number':
        return Number(this.value);
      case 'boolean':
        return this.value.toLowerCase() === 'true' || this.value === '1';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return this.value;
        }
      case 'yaml':
        return this.value;
      default:
        return this.value;
    }
  }
}
