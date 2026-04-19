import { Address } from '../../domain/entities/address';
import { AddressType } from '../../domain/value-objects/customer-enums';
import { AddressResponseDto, CreateAddressDto } from '../dtos/address.dto';

export class AddressMapper {
  static toEntity(dto: CreateAddressDto & { id: string; customerId: string }): Address {
    return new Address({
      id: dto.id,
      customerId: dto.customerId,
      addressType: dto.addressType || AddressType.HOME,
      street: dto.street,
      streetNumber: dto.streetNumber,
      apartment: dto.apartment,
      city: dto.city,
      stateProvince: dto.stateProvince,
      postalCode: dto.postalCode,
      country: dto.country,
      countryCode: dto.countryCode.toUpperCase(),
      isPrimary: dto.isPrimary || false,
      isVerified: dto.isVerified || false,
      latitude: dto.latitude,
      longitude: dto.longitude,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static toResponseDto(address: Address): AddressResponseDto {
    return {
      id: address.id,
      addressType: address.addressType,
      street: address.street,
      streetNumber: address.streetNumber,
      apartment: address.apartment,
      city: address.city,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      country: address.country,
      countryCode: address.countryCode,
      isPrimary: address.isPrimary,
      isVerified: address.isVerified,
      fullAddress: address.fullAddress,
    };
  }
}