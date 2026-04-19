import { Document } from '../../domain/entities/document';
import { DocumentType, GdprCategory } from '../../domain/value-objects/customer-enums';
import { DocumentResponseDto, CreateDocumentDto } from '../dtos/document.dto';

export class DocumentMapper {
  static toEntity(
    dto: CreateDocumentDto & { id: string; customerId: string; fileName: string; filePath: string; fileSize: number; mimeType: string }
  ): Document {
    return new Document({
      id: dto.id,
      customerId: dto.customerId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      issuingCountry: dto.issuingCountry,
      issueDate: dto.issueDate,
      expiryDate: dto.expiryDate,
      fileName: dto.fileName,
      filePath: dto.filePath,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      checksum: dto.checksum,
      encryptionKeyId: dto.encryptionKeyId,
      isVerified: dto.isVerified || false,
      verificationMethod: dto.verificationMethod,
      verificationDate: dto.verificationDate,
      metadata: dto.metadata,
      gdprCategory: dto.gdprCategory || GdprCategory.IDENTITY,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static toResponseDto(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      issuingCountry: document.issuingCountry,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      isVerified: document.isVerified,
      gdprCategory: document.gdprCategory,
      retentionUntil: document.retentionUntil,
      isExpired: document.isExpired,
      createdAt: document.createdAt,
    };
  }
}