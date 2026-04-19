export class CreateCatalogDto {
  key!: string;
  name!: string;
  description?: string;
  allowMultiple?: boolean;
}

export class UpdateCatalogDto {
  name?: string;
  description?: string;
  allowMultiple?: boolean;
  isActive?: boolean;
}

export class CreateCatalogValueDto {
  code!: string;
  label!: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isDefault?: boolean;
}

export class UpdateCatalogValueDto {
  label?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export class CatalogResponseDto {
  id!: string;
  key!: string;
  name!: string;
  description?: string;
  allowMultiple!: boolean;
  isActive!: boolean;
  values?: CatalogValueResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class CatalogValueResponseDto {
  id!: string;
  code!: string;
  label!: string;
  description?: string;
  color?: string;
  sortOrder!: number;
  isDefault!: boolean;
  isActive!: boolean;
}
