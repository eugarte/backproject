import { Repository, Like, Brackets } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { CustomerEntity } from '../entities/customer.entity';
import { Customer } from '../../../domain/entities/customer';
import { ICustomerRepository, CustomerFilter, PaginationOptions } from '../../../domain/repositories/customer-repository.interface';
import { CustomerStatus, CustomerType } from '../../../domain/value-objects/customer-enums';
import { AddressMapper } from '../../../application/mappers/address.mapper';
import { ContactMapper } from '../../../application/mappers/contact.mapper';
import { DocumentMapper } from '../../../application/mappers/document.mapper';

export class TypeOrmCustomerRepository implements ICustomerRepository {
  private repository: Repository<CustomerEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CustomerEntity);
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['addresses', 'contacts', 'documents', 'tags', 'preferences', 'creditHistory'],
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({
      where: { customerCode: code },
      relations: ['addresses', 'contacts', 'documents', 'tags', 'preferences', 'creditHistory'],
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({
      where: { email },
      relations: ['addresses', 'contacts', 'documents', 'tags', 'preferences', 'creditHistory'],
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTaxId(taxId: string, taxIdType?: string): Promise<Customer | null> {
    const where: any = { taxId };
    if (taxIdType) where.taxIdType = taxIdType;
    
    const entity = await this.repository.findOne({
      where,
      relations: ['addresses', 'contacts', 'documents', 'tags', 'preferences', 'creditHistory'],
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    options: PaginationOptions,
    filters?: CustomerFilter
  ): Promise<{ customers: Customer[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      .leftJoinAndSelect('customer.contacts', 'contacts')
      .leftJoinAndSelect('customer.tags', 'tags')
      .withDeleted();

    if (filters?.status) {
      queryBuilder.andWhere('customer.status = :status', { status: filters.status });
    }

    if (filters?.customerType) {
      queryBuilder.andWhere('customer.customerType = :customerType', { customerType: filters.customerType });
    }

    if (filters?.country) {
      queryBuilder.andWhere('addresses.countryCode = :country', { country: filters.country });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('customer.firstName LIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.lastName LIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.email LIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.taxId LIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.customerCode LIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.customVarchar LIKE :search', { search: `%${filters.search}%` });
        })
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('tags.tagName IN (:...tags)', { tags: filters.tags });
    }

    if (filters?.createdAfter) {
      queryBuilder.andWhere('customer.createdAt >= :createdAfter', { createdAfter: filters.createdAfter });
    }

    if (filters?.createdBefore) {
      queryBuilder.andWhere('customer.createdAt <= :createdBefore', { createdBefore: filters.createdBefore });
    }

    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`customer.${sortField}`, sortOrder);

    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).take(options.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      customers: entities.map(e => this.toDomain(e)),
      total,
    };
  }

  async create(customer: Customer): Promise<Customer> {
    const entity = this.toEntity(customer);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(customer: Customer): Promise<Customer> {
    const entity = this.toEntity(customer);
    await this.repository.save(entity);
    const updated = await this.repository.findOne({
      where: { id: customer.id },
      relations: ['addresses', 'contacts', 'documents', 'tags', 'preferences', 'creditHistory'],
    });
    return this.toDomain(updated!);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repository.softDelete(id);
    await this.repository.update(id, { deletedBy, status: CustomerStatus.INACTIVE });
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
    await this.repository.update(id, { deletedBy: null, status: CustomerStatus.ACTIVE });
  }

  async anonymize(id: string, reason: string): Promise<void> {
    await this.repository.update(id, {
      firstName: 'ANONYMIZED',
      lastName: 'ANONYMIZED',
      email: null,
      phone: null,
      taxId: null,
      dateOfBirth: null,
      nationality: null,
      companyName: null,
      // Clear custom fields
      customVarchar: null,
      customInt: null,
      customDecimal: null,
      customDatetime: null,
      customBool: null,
      customText: null,
      customJson: null,
      customDate: null,
      status: CustomerStatus.ANONYMIZED,
      anonymizedAt: new Date(),
      anonymizedReason: reason,
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id }, withDeleted: true });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  async existsByTaxId(taxId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { taxId } });
    return count > 0;
  }

  async generateCustomerCode(): Promise<string> {
    const prefix = 'CUST';
    const year = new Date().getFullYear();
    
    const lastCustomer = await this.repository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastCustomer) {
      const parts = lastCustomer.customerCode.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
  }

  private toDomain(entity: CustomerEntity): Customer {
    return new Customer({
      id: entity.id,
      customerCode: entity.customerCode,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      taxId: entity.taxId || undefined,
      taxIdType: entity.taxIdType || undefined,
      dateOfBirth: entity.dateOfBirth || undefined,
      gender: entity.gender as any,
      nationality: entity.nationality || undefined,
      preferredLanguage: entity.preferredLanguage,
      status: entity.status as CustomerStatus,
      customerType: entity.customerType as CustomerType,
      companyName: entity.companyName || undefined,
      industry: entity.industry || undefined,
      annualRevenue: entity.annualRevenue || undefined,
      employeeCount: entity.employeeCount || undefined,
      creditScore: entity.creditScore || undefined,
      creditLimit: entity.creditLimit || undefined,
      gdprConsent: entity.gdprConsent,
      gdprConsentDate: entity.gdprConsentDate || undefined,
      gdprConsentVersion: entity.gdprConsentVersion || undefined,
      marketingConsent: entity.marketingConsent,
      dataProcessingConsent: entity.dataProcessingConsent,
      anonymizedAt: entity.anonymizedAt || undefined,
      anonymizedReason: entity.anonymizedReason || undefined,
      // 8 Custom Fields
      customVarchar: entity.customVarchar || undefined,
      customInt: entity.customInt || undefined,
      customDecimal: entity.customDecimal || undefined,
      customDatetime: entity.customDatetime || undefined,
      customBool: entity.customBool || undefined,
      customText: entity.customText || undefined,
      customJson: entity.customJson || undefined,
      customDate: entity.customDate || undefined,
      addresses: (entity.addresses || []).map(a => AddressMapper.toEntity({
        id: a.id,
        customerId: a.customerId,
        addressType: a.addressType as any,
        street: a.street,
        streetNumber: a.streetNumber || undefined,
        apartment: a.apartment || undefined,
        city: a.city,
        stateProvince: a.stateProvince || undefined,
        postalCode: a.postalCode,
        country: a.country,
        countryCode: a.countryCode,
        isPrimary: a.isPrimary,
        isVerified: a.isVerified,
        latitude: a.latitude || undefined,
        longitude: a.longitude || undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      contacts: (entity.contacts || []).map(c => ContactMapper.toEntity({
        id: c.id,
        customerId: c.customerId,
        contactType: c.contactType as any,
        value: c.value,
        label: c.label || undefined,
        isPrimary: c.isPrimary,
        isVerified: c.isVerified,
        verificationDate: c.verificationDate || undefined,
        canContact: c.canContact,
        contactSchedule: c.contactSchedule || undefined,
        timezone: c.timezone || undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      documents: (entity.documents || []).map(d => DocumentMapper.toEntity({
        id: d.id,
        customerId: d.customerId,
        documentType: d.documentType as any,
        documentNumber: d.documentNumber || undefined,
        issuingCountry: d.issuingCountry || undefined,
        issueDate: d.issueDate || undefined,
        expiryDate: d.expiryDate || undefined,
        fileName: d.fileName,
        filePath: d.filePath,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        checksum: d.checksum || undefined,
        encryptionKeyId: d.encryptionKeyId || undefined,
        isVerified: d.isVerified,
        verificationMethod: d.verificationMethod || undefined,
        verificationDate: d.verificationDate || undefined,
        metadata: d.metadata || undefined,
        gdprCategory: d.gdprCategory as any,
        retentionUntil: d.retentionUntil || undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      tags: (entity.tags || []).map(t => ({
        id: t.id,
        customerId: t.customerId,
        tagName: t.tagName,
        tagValue: t.tagValue || undefined,
        tagCategory: t.tagCategory || undefined,
        color: t.color || undefined,
        createdAt: t.createdAt,
      } as any)),
      preferences: (entity.preferences || []).map(p => ({
        id: p.id,
        customerId: p.customerId,
        category: p.preferenceCategory,
        key: p.preferenceKey,
        value: p.preferenceValue || undefined,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      } as any)),
      creditHistory: [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy || undefined,
      updatedBy: entity.updatedBy || undefined,
      deletedAt: entity.deletedAt || undefined,
      deletedBy: entity.deletedBy || undefined,
    });
  }

  private toEntity(customer: Customer): CustomerEntity {
    const entity = new CustomerEntity();
    entity.id = customer.id;
    entity.customerCode = customer.customerCode;
    entity.firstName = customer.firstName;
    entity.lastName = customer.lastName;
    entity.email = customer.email || null;
    entity.phone = customer.phone || null;
    entity.taxId = customer.taxId || null;
    entity.taxIdType = customer.taxIdType || null;
    entity.dateOfBirth = customer.dateOfBirth || null;
    entity.gender = customer.gender || null;
    entity.nationality = customer.nationality || null;
    entity.preferredLanguage = customer.preferredLanguage;
    entity.status = customer.status;
    entity.customerType = customer.customerType;
    entity.companyName = customer.companyName || null;
    entity.industry = customer.industry || null;
    entity.annualRevenue = customer.annualRevenue || null;
    entity.employeeCount = customer.employeeCount || null;
    entity.creditScore = customer.creditScore || null;
    entity.creditLimit = customer.creditLimit || null;
    entity.gdprConsent = customer.gdprConsent;
    entity.gdprConsentDate = customer.gdprConsentDate || null;
    entity.gdprConsentVersion = (customer as any).gdprConsentVersion || null;
    entity.marketingConsent = customer.marketingConsent;
    entity.dataProcessingConsent = customer.dataProcessingConsent;
    entity.anonymizedAt = customer.anonymizedAt || null;
    entity.anonymizedReason = (customer as any).anonymizedReason || null;
    // 8 Custom Fields
    entity.customVarchar = customer.customVarchar || null;
    entity.customInt = customer.customInt || null;
    entity.customDecimal = customer.customDecimal || null;
    entity.customDatetime = customer.customDatetime || null;
    entity.customBool = customer.customBool || null;
    entity.customText = customer.customText || null;
    entity.customJson = customer.customJson || null;
    entity.customDate = customer.customDate || null;
    entity.createdAt = customer.createdAt;
    entity.updatedAt = customer.updatedAt;
    entity.createdBy = (customer as any).createdBy || null;
    entity.updatedBy = (customer as any).updatedBy || null;
    entity.deletedAt = (customer as any).deletedAt || null;
    entity.deletedBy = (customer as any).deletedBy || null;
    return entity;
  }
}
