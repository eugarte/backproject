import { IAddressRepository } from '../../domain/repositories/address-repository.interface';
import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { IEventPublisher } from '../../domain/events/event-publisher';
import { AddressAddedEvent } from '../../domain/events/customer-events';
import { AuditLog } from '../../domain/entities/audit-log';
import { CreateAddressDto, AddressResponseDto } from '../dtos/address.dto';
import { AddressMapper } from '../mappers/address.mapper';

export class AddAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(customerId: string, dto: CreateAddressDto, createdBy?: string): Promise<AddressResponseDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.isAnonymized) {
      throw new Error('Cannot add address to anonymized customer');
    }

    const address = AddressMapper.toEntity({
      ...dto,
      id: crypto.randomUUID(),
      customerId,
    });

    const savedAddress = await this.addressRepository.create(address);

    // If this is the primary address, unset others
    if (dto.isPrimary) {
      await this.addressRepository.setAsPrimary(savedAddress.id, customerId);
    }

    // Create audit log
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('address', savedAddress.id, 'create', customerId, createdBy)
    );

    // Publish event
    this.eventPublisher.publish(
      new AddressAddedEvent(customerId, 'customer', {
        customerId,
        addressId: savedAddress.id,
        addressType: savedAddress.addressType,
        countryCode: savedAddress.countryCode,
      })
    );

    return AddressMapper.toResponseDto(savedAddress);
  }
}

export class GetCustomerAddressesUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(customerId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.findByCustomerId(customerId);
    return addresses.map(a => AddressMapper.toResponseDto(a));
  }
}
