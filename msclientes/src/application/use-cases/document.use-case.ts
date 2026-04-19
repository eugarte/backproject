import { IDocumentRepository } from '../../domain/repositories/document-repository.interface';
import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { IEventPublisher } from '../../domain/events/event-publisher';
import { DocumentUploadedEvent } from '../../domain/events/customer-events';
import { AuditLog } from '../../domain/entities/audit-log';
import { CreateDocumentDto, DocumentResponseDto } from '../dtos/document.dto';
import { DocumentMapper } from '../mappers/document.mapper';

export interface FileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export class UploadDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(
    customerId: string, 
    dto: CreateDocumentDto, 
    fileInfo: FileInfo,
    uploadedBy?: string
  ): Promise<DocumentResponseDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isAnonymized) {
      throw new Error('Cannot upload document for anonymized customer');
    }

    const document = DocumentMapper.toEntity({
      ...dto,
      id: crypto.randomUUID(),
      customerId,
      fileName: fileInfo.fileName,
      filePath: fileInfo.filePath,
      fileSize: fileInfo.fileSize,
      mimeType: fileInfo.mimeType,
    });

    const savedDocument = await this.documentRepository.create(document);

    // Create audit log
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('document', savedDocument.id, 'upload', customerId, uploadedBy, {
        fileName: savedDocument.fileName,
        gdprCategory: savedDocument.gdprCategory,
      })
    );

    // Publish event
    this.eventPublisher.publish(
      new DocumentUploadedEvent(customerId, 'customer', {
        customerId,
        documentId: savedDocument.id,
        documentType: savedDocument.documentType,
        fileName: savedDocument.fileName,
      })
    );

    return DocumentMapper.toResponseDto(savedDocument);
  }
}

export class GetCustomerDocumentsUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(customerId: string): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.findByCustomerId(customerId);
    return documents.map(d => DocumentMapper.toResponseDto(d));
  }
}