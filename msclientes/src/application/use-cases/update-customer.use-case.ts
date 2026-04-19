import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { IEventPublisher } from '../../domain/events/event-publisher';
import { AuditLog } from '../../domain/entities/audit-log';
import { CustomerUpdatedEvent, CustomerDeletedEvent, CustomerAnonymizedEvent } from '../../domain/events/customer-events';
import { UpdateCustomerDto, CustomerResponseDto } from '../dtos/customer.dto';
import { CustomerMapper } from '../mappers/customer.mapper';

export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isAnonymized) {
      throw new Error('Cannot update anonymized customer');
    }

    if (customer.isDeleted) {
      throw new Error('Cannot update deleted customer');
    }

    const oldValues = { ...customer.toJSON() };
    const changes: string[] = [];

    // Update basic info
    if (dto.firstName !== undefined || dto.lastName !== undefined || 
        dto.email !== undefined || dto.phone !== undefined) {
      customer.updateBasicInfo({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      });
      if (dto.firstName) changes.push('firstName');
      if (dto.lastName) changes.push('lastName');
      if (dto.email !== undefined) changes.push('email');
      if (dto.phone !== undefined) changes.push('phone');
    }

    // Update company info
    if (dto.companyName !== undefined || dto.industry !== undefined || 
        dto.annualRevenue !== undefined || dto.employeeCount !== undefined) {
      customer.updateCompanyInfo({
        companyName: dto.companyName,
        industry: dto.industry,
        annualRevenue: dto.annualRevenue,
        employeeCount: dto.employeeCount,
      });
      if (dto.companyName !== undefined) changes.push('companyName');
      if (dto.industry !== undefined) changes.push('industry');
      if (dto.annualRevenue !== undefined) changes.push('annualRevenue');
      if (dto.employeeCount !== undefined) changes.push('employeeCount');
    }

    // Update consent
    if (dto.marketingConsent !== undefined || dto.dataProcessingConsent !== undefined) {
      customer.updateGdprConsent({
        gdprConsent: customer.gdprConsent,
        marketingConsent: dto.marketingConsent ?? customer.marketingConsent,
        dataProcessingConsent: dto.dataProcessingConsent ?? customer.dataProcessingConsent,
        version: '1.0',
      });
      if (dto.marketingConsent !== undefined) changes.push('marketingConsent');
      if (dto.dataProcessingConsent !== undefined) changes.push('dataProcessingConsent');
    }

    const updatedCustomer = await this.customerRepository.update(customer);

    // Create audit log
    await this.auditLogRepository.create(
      new AuditLog({
        id: crypto.randomUUID(),
        entityType: 'customer',
        entityId: updatedCustomer.id,
        action: 'update',
        oldValues,
        newValues: updatedCustomer.toJSON(),
        performedBy: dto.updatedBy,
        performedByType: dto.updatedBy ? 'user' : 'system',
        timestamp: new Date(),
        gdprRelated: changes.includes('marketingConsent') || changes.includes('dataProcessingConsent'),
        dataSubjectId: updatedCustomer.id,
      })
    );

    // Publish event
    this.eventPublisher.publish(
      new CustomerUpdatedEvent(updatedCustomer.id, 'customer', {
        customerId: updatedCustomer.id,
        changes,
        updatedBy: dto.updatedBy,
      })
    );

    return CustomerMapper.toResponseDto(updatedCustomer);
  }
}

export class DeleteCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(id: string, deletedBy: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isDeleted) {
      throw new Error('Customer is already deleted');
    }

    await this.customerRepository.softDelete(id, deletedBy);

    // Create audit log
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('customer', id, 'soft_delete', id, deletedBy)
    );

    // Publish event
    this.eventPublisher.publish(
      new CustomerDeletedEvent(id, 'customer', {
        customerId: id,
        deletedBy,
        deletedAt: new Date(),
      })
    );
  }
}

export class AnonymizeCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(id: string, reason: string, requestedBy: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isAnonymized) {
      throw new Error('Customer is already anonymized');
    }

    // Anonymize the customer entity
    customer.anonymize(reason);
    
    // Save to repository
    await this.customerRepository.anonymize(id, reason);

    // Create audit log (GDPR related)
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('customer', id, 'anonymize', id, requestedBy, { reason })
    );

    // Publish event
    this.eventPublisher.publish(
      new CustomerAnonymizedEvent(id, 'customer', {
        customerId: id,
        reason,
        anonymizedAt: new Date(),
      })
    );

    return CustomerMapper.toResponseDto(customer);
  }
}