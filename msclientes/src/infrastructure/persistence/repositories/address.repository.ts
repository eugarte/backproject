import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { AddressEntity } from '../entities/address.entity';
import { Address } from '../../../domain/entities/address';
import { IAddressRepository } from '../../../domain/repositories/address-repository.interface';
import { AddressMapper } from '../../../application/mappers/address.mapper';

export class TypeOrmAddressRepository implements IAddressRepository {
  private repository: Repository<AddressEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(AddressEntity);
  }

  async findById(id: string): Promise<Address | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: string): Promise<Address[]> {
    const entities = await this.repository.find({
      where: { customerId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findPrimaryByCustomerId(customerId: string): Promise<Address | null> {
    const entity = await this.repository.findOne({
      where: { customerId, isPrimary: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(address: Address): Promise<Address> {
    const entity = this.toEntity(address);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(address: Address): Promise<Address> {
    const entity = this.toEntity(address);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async setAsPrimary(id: string, customerId: string): Promise<void> {
    // First, unset all other primary addresses
    await this.repository.update(
      { customerId, isPrimary: true },
      { isPrimary: false }
    );
    // Then set the new primary
    await this.repository.update(id, { isPrimary: true });
  }

  private toDomain(entity: AddressEntity): Address {
    return AddressMapper.toEntity({
      id: entity.id,
      customerId: entity.customerId,
      addressType: entity.addressType as any,
      street: entity.street,
      streetNumber: entity.streetNumber || undefined,
      apartment: entity.apartment || undefined,
      city: entity.city,
      stateProvince: entity.stateProvince || undefined,
      postalCode: entity.postalCode,
      country: entity.country,
      countryCode: entity.countryCode,
      isPrimary: entity.isPrimary,
      isVerified: entity.isVerified,
      latitude: entity.latitude || undefined,
      longitude: entity.longitude || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(address: Address): AddressEntity {
    const entity = new AddressEntity();
    entity.id = address.id;
    entity.customerId = address.customerId;
    entity.addressType = address.addressType;
    entity.street = address.street;
    entity.streetNumber = address.streetNumber || null;
    entity.apartment = address.apartment || null;
    entity.city = address.city;
    entity.stateProvince = address.stateProvince || null;
    entity.postalCode = address.postalCode;
    entity.country = address.country;
    entity.countryCode = address.countryCode;
    entity.isPrimary = address.isPrimary;
    entity.isVerified = address.isVerified;
    entity.latitude = address.latitude || null;
    entity.longitude = address.longitude || null;
    return entity;
  }
}
