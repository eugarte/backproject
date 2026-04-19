import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { DocumentEntity } from '../entities/document.entity';
import { Document } from '../../../domain/entities/document';
import { IDocumentRepository } from '../../../domain/repositories/document-repository.interface';
import { DocumentMapper } from '../../../application/mappers/document.mapper';

export class TypeOrmDocumentRepository implements IDocumentRepository {
  private repository: Repository<DocumentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(DocumentEntity);
  }

  async findById(id: string): Promise<Document | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: string): Promise<Document[]> {
    const entities = await this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByType(customerId: string, type: string): Promise<Document[]> {
    const entities = await this.repository.find({
      where: { customerId, documentType: type },
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findExpired(): Promise<Document[]> {
    const entities = await this.repository.find({
      where: { expiryDate: LessThan(new Date()) },
    });
    return entities.map(e => this.toDomain(e));
  }

  async create(document: Document): Promise<Document> {
    const entity = this.toEntity(document);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(document: Document): Promise<Document> {
    const entity = this.toEntity(document);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async verify(id: string, method: string): Promise<void> {
    await this.repository.update(id, {
      isVerified: true,
      verificationMethod: method,
      verificationDate: new Date(),
    });
  }

  async updateRetentionDate(id: string, date: Date): Promise<void> {
    await this.repository.update(id, { retentionUntil: date });
  }

  private toDomain(entity: DocumentEntity): Document {
    return DocumentMapper.toEntity({
      id: entity.id,
      customerId: entity.customerId,
      documentType: entity.documentType as any,
      documentNumber: entity.documentNumber || undefined,
      issuingCountry: entity.issuingCountry || undefined,
      issueDate: entity.issueDate || undefined,
      expiryDate: entity.expiryDate || undefined,
      fileName: entity.fileName,
      filePath: entity.filePath,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      checksum: entity.checksum || undefined,
      encryptionKeyId: entity.encryptionKeyId || undefined,
      isVerified: entity.isVerified,
      verificationMethod: entity.verificationMethod || undefined,
      verificationDate: entity.verificationDate || undefined,
      metadata: entity.metadata || undefined,
      gdprCategory: entity.gdprCategory as any,
      retentionUntil: entity.retentionUntil || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(document: Document): DocumentEntity {
    const entity = new DocumentEntity();
    entity.id = document.id;
    entity.customerId = document.customerId;
    entity.documentType = document.documentType;
    entity.documentNumber = document.documentNumber || null;
    entity.issuingCountry = document.issuingCountry || null;
    entity.issueDate = document.issueDate || null;
    entity.expiryDate = document.expiryDate || null;
    entity.fileName = document.fileName;
    entity.filePath = document.filePath;
    entity.fileSize = document.fileSize;
    entity.mimeType = document.mimeType;
    entity.checksum = document.checksum || null;
    entity.encryptionKeyId = document.encryptionKeyId || null;
    entity.isVerified = document.isVerified;
    entity.verificationMethod = document.verificationMethod || null;
    entity.verificationDate = document.verificationDate || null;
    entity.metadata = document.metadata || null;
    entity.gdprCategory = document.gdprCategory;
    entity.retentionUntil = document.retentionUntil || null;
    return entity;
  }
}
