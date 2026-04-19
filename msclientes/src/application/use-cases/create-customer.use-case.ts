import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { IEventPublisher } from '../../domain/events/event-publisher';
import { Customer } from '../../domain/entities/customer';
import { AuditLog } from '../../domain/entities/audit-log';
import { CustomerCreatedEvent } from '../../domain/events/customer-events';
import { CreateCustomerDto, CustomerResponseDto } from '../dtos/customer.dto';
import { CustomerMapper } from '../mappers/customer.mapper';
import { CustomerStatus, CustomerType } from '../../domain/value-objects/customer-enums';
import { TaxIdValidatorService } from '../../domain/services/tax-id-validator.service';

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly taxIdValidator: TaxIdValidatorService
  ) {}

  async execute(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    // Check for duplicates
    if (dto.email && await this.customerRepository.existsByEmail(dto.email)) {
      throw new Error('Customer with this email already exists');
    }
    if (dto.taxId && await this.customerRepository.existsByTaxId(dto.taxId)) {
      throw new Error('Customer with this tax ID already exists');
    }

    // Validate tax ID if provided
    if (dto.taxId && dto.taxIdType) {
      const validation = await this.taxIdValidator.validate(dto.taxId, dto.taxIdType, dto.nationality || 'ES');
      if (!validation.valid) {
        throw new Error(`Invalid tax ID: ${validation.message}`);
      }
    }

    const customerCode = await this.customerRepository.generateCustomerCode();
    
    const customer = new Customer({
      id: crypto.randomUUID(),
      customerCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      taxId: dto.taxId,
      taxIdType: dto.taxIdType,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender as any,
      nationality: dto.nationality,
      preferredLanguage: dto.preferredLanguage || 'es',
      status: CustomerStatus.ACTIVE,
      customerType: (dto.customerType as CustomerType) || CustomerType.INDIVIDUAL,
      companyName: dto.companyName,
      industry: dto.industry,
      annualRevenue: dto.annualRevenue,
      employeeCount: dto.employeeCount,
      creditScore: undefined,
      creditLimit: undefined,
      gdprConsent: false,
      marketingConsent: dto.marketingConsent || false,
      dataProcessingConsent: dto.dataProcessingConsent || false,
      addresses: [],
      contacts: [],
      documents: [],
      tags: [],
      preferences: [],
      creditHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: dto.createdBy,
    });

    const savedCustomer = await this.customerRepository.create(customer);

    // Create audit log
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('customer', savedCustomer.id, 'create', savedCustomer.id, dto.createdBy, {
        customerCode: savedCustomer.customerCode,
      })
    );

    // Publish event
    this.eventPublisher.publish(
      new CustomerCreatedEvent(
        savedCustomer.id,
        'customer',
        {
          customerId: savedCustomer.id,
          customerCode: savedCustomer.customerCode,
          firstName: savedCustomer.firstName,
          lastName: savedCustomer.lastName,
          email: savedCustomer.email,
          createdBy: dto.createdBy,
        }
      )
    );

    return CustomerMapper.toResponseDto(savedCustomer);
  }
}