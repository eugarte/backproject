export class CreateSecretDto {
  key!: string;
  value!: string;
  serviceId?: string;
  environment?: string;
  expiresAt?: Date;
}

export class UpdateSecretDto {
  value?: string;
  expiresAt?: Date;
}

export class RotateSecretDto {
  newValue!: string;
}

export class SecretResponseDto {
  id!: string;
  key!: string;
  serviceId?: string;
  environment?: string;
  encryptionVersion!: string;
  isRotating!: boolean;
  lastRotatedAt?: Date;
  expiresAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class SecretWithValueResponseDto extends SecretResponseDto {
  value!: string;
}

export class SecretAccessLogResponseDto {
  id!: string;
  action!: string;
  accessedBy?: string;
  ipAddress?: string;
  createdAt!: Date;
}
