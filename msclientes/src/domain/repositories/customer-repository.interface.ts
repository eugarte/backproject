import { Customer } from '../entities/customer';

export interface CustomerFilter {
  status?: string;
  customerType?: string;
  search?: string;
  country?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByCode(code: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByTaxId(taxId: string, taxIdType?: string): Promise<Customer | null>;
  findAll(options: PaginationOptions, filters?: CustomerFilter): Promise<{ customers: Customer[]; total: number }>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  restore(id: string): Promise<void>;
  anonymize(id: string, reason: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByTaxId(taxId: string): Promise<boolean>;
  generateCustomerCode(): Promise<string>;
}
