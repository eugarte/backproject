export class CreateConfigurationDto {
  key!: string;
  value!: string;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'yaml';
  serviceId?: string;
  environment?: string;
  description?: string;
  tags?: string[];
  isSecret?: boolean;
}

export class UpdateConfigurationDto {
  value?: string;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'yaml';
  description?: string;
  tags?: string[];
  changeReason?: string;
}

export class ConfigurationResponseDto {
  id!: string;
  key!: string;
  value!: string;
  type!: string;
  serviceId?: string;
  environment?: string;
  description?: string;
  tags!: string[];
  isSecret!: boolean;
  isEncrypted!: boolean;
  version!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ConfigurationHistoryResponseDto {
  id!: string;
  action!: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  changeReason?: string;
  createdAt!: Date;
}
