import { DocumentType, GdprCategory } from '../../domain/value-objects/customer-enums';

export interface CreateDocumentDto {
  documentType: DocumentType;
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: Date;
  expiryDate?: Date;
  gdprCategory?: GdprCategory;
  checksum?: string;
  encryptionKeyId?: string;
  isVerified?: boolean;
  verificationMethod?: string;
  verificationDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface DocumentResponseDto {
  id: string;
  documentType: string;
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: Date;
  expiryDate?: Date;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  gdprCategory: string;
  retentionUntil?: Date;
  isExpired: boolean;
  createdAt: Date;
}
