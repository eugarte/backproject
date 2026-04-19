import { v4 as uuidv4 } from 'uuid';

export interface ServiceProps {
  id?: string;
  name: string;
  displayName: string;
  description?: string | null;
  version?: string;
  statusCatalogId?: string | null;
  statusValue?: string | null;
  teamOwner?: string | null;
  repositoryUrl?: string | null;
  documentationUrl?: string | null;
  technologyStack?: string[];
  healthCheckUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Service {
  public readonly id: string;
  public name: string;
  public displayName: string;
  public description: string | null;
  public version: string;
  public statusCatalogId: string | null;
  public statusValue: string | null;
  public teamOwner: string | null;
  public repositoryUrl: string | null;
  public documentationUrl: string | null;
  public technologyStack: string[];
  public healthCheckUrl: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ServiceProps) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.displayName = props.displayName;
    this.description = props.description ?? null;
    this.version = props.version ?? '1.0.0';
    this.statusCatalogId = props.statusCatalogId ?? null;
    this.statusValue = props.statusValue ?? null;
    this.teamOwner = props.teamOwner ?? null;
    this.repositoryUrl = props.repositoryUrl ?? null;
    this.documentationUrl = props.documentationUrl ?? null;
    this.technologyStack = props.technologyStack ?? [];
    this.healthCheckUrl = props.healthCheckUrl ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public update(data: Partial<Omit<ServiceProps, 'id' | 'createdAt'>>): void {
    if (data.displayName !== undefined) this.displayName = data.displayName;
    if (data.description !== undefined) this.description = data.description;
    if (data.version !== undefined) this.version = data.version;
    if (data.statusCatalogId !== undefined) this.statusCatalogId = data.statusCatalogId;
    if (data.statusValue !== undefined) this.statusValue = data.statusValue;
    if (data.teamOwner !== undefined) this.teamOwner = data.teamOwner;
    if (data.repositoryUrl !== undefined) this.repositoryUrl = data.repositoryUrl;
    if (data.documentationUrl !== undefined) this.documentationUrl = data.documentationUrl;
    if (data.technologyStack !== undefined) this.technologyStack = data.technologyStack;
    if (data.healthCheckUrl !== undefined) this.healthCheckUrl = data.healthCheckUrl;
    this.updatedAt = new Date();
  }
}
