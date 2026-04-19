import { DocumentType, GdprCategory } from '../value-objects/customer-enums';

export interface DocumentProps {
  id: string;
  customerId: string;
  documentType: DocumentType;
  documentNumber?: string;
  issuingCountry?: string;
  issuingAuthority?: string;
  issueDate?: Date;
  expiryDate?: Date;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  encryptionKeyId?: string;
  isVerified: boolean;
  verificationMethod?: string;
  verificationDate?: Date;
  metadata?: Record<string, unknown>;
  gdprCategory: GdprCategory;
  retentionUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Document {
  private props: DocumentProps;

  constructor(props: DocumentProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Document ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.fileName) throw new Error('File name is required');
    if (!this.props.filePath) throw new Error('File path is required');
    if (this.props.fileSize < 0) throw new Error('File size cannot be negative');
    if (!this.props.mimeType) throw new Error('MIME type is required');
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get documentType(): DocumentType { return this.props.documentType; }
  get documentNumber(): string | undefined { return this.props.documentNumber; }
  get issuingCountry(): string | undefined { return this.props.issuingCountry; }
  get issueDate(): Date | undefined { return this.props.issueDate; }
  get expiryDate(): Date | undefined { return this.props.expiryDate; }
  get fileName(): string { return this.props.fileName; }
  get filePath(): string { return this.props.filePath; }
  get fileSize(): number { return this.props.fileSize; }
  get mimeType(): string { return this.props.mimeType; }
  get checksum(): string | undefined { return this.props.checksum; }
  get encryptionKeyId(): string | undefined { return this.props.encryptionKeyId; }
  get isVerified(): boolean { return this.props.isVerified; }
  get verificationMethod(): string | undefined { return this.props.verificationMethod; }
  get verificationDate(): Date | undefined { return this.props.verificationDate; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get gdprCategory(): GdprCategory { return this.props.gdprCategory; }
  get createdAt(): Date { return this.props.createdAt; }
  get retentionUntil(): Date | undefined { return this.props.retentionUntil; }
  get isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return new Date() > this.props.expiryDate;
  }

  verify(method: string): void {
    this.props.isVerified = true;
    this.props.verificationMethod = method;
    this.props.verificationDate = new Date();
  }

  setRetentionDate(date: Date): void {
    this.props.retentionUntil = date;
  }

  shouldBeDeleted(): boolean {
    if (!this.props.retentionUntil) return false;
    return new Date() > this.props.retentionUntil;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      documentType: this.documentType,
      documentNumber: this.documentNumber,
      issuingCountry: this.issuingCountry,
      issueDate: this.issueDate,
      expiryDate: this.expiryDate,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      isVerified: this.isVerified,
      gdprCategory: this.gdprCategory,
      retentionUntil: this.retentionUntil,
      isExpired: this.isExpired,
    };
  }
}
