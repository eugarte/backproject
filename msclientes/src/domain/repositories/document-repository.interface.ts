import { Document } from '../entities/document';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByCustomerId(customerId: string): Promise<Document[]>;
  findByType(customerId: string, type: string): Promise<Document[]>;
  findExpired(): Promise<Document[]>;
  create(document: Document): Promise<Document>;
  update(document: Document): Promise<Document>;
  delete(id: string): Promise<void>;
  verify(id: string, method: string): Promise<void>;
  updateRetentionDate(id: string, date: Date): Promise<void>;
}
