import { v4 as uuidv4 } from 'uuid';

export interface SecretProps {
  id?: string;
  key: string;
  encryptedValue: string;
  encryptionVersion?: string;
  serviceId?: string | null;
  environment?: string | null;
  expiresAt?: Date | null;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastRotatedAt?: Date | null;
  isRotating?: boolean;
}

export class Secret {
  public readonly id: string;
  public serviceId: string | null;
  public environment: string | null;
  public key: string;
  public encryptedValue: string;
  public encryptionVersion: string;
  public isRotating: boolean;
  public lastRotatedAt: Date | null;
  public expiresAt: Date | null;
  public createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: SecretProps) {
    this.id = props.id || uuidv4();
    this.key = props.key;
    this.encryptedValue = props.encryptedValue;
    this.encryptionVersion = props.encryptionVersion ?? 'v1';
    this.serviceId = props.serviceId ?? null;
    this.environment = props.environment ?? null;
    this.expiresAt = props.expiresAt ?? null;
    this.createdBy = props.createdBy ?? 'system';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.lastRotatedAt = props.lastRotatedAt ?? null;
    this.isRotating = props.isRotating ?? false;
  }

  public rotate(newEncryptedValue: string): void {
    this.encryptedValue = newEncryptedValue;
    this.lastRotatedAt = new Date();
    this.isRotating = false;
    this.updatedAt = new Date();
  }

  public startRotation(): void {
    this.isRotating = true;
    this.updatedAt = new Date();
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}
