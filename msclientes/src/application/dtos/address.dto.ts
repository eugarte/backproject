import { AddressType } from '../../domain/value-objects/customer-enums';

export interface CreateAddressDto {
  addressType: AddressType;
  street: string;
  streetNumber?: string;
  apartment?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
  countryCode: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface AddressResponseDto {
  id: string;
  addressType: string;
  street: string;
  streetNumber?: string;
  apartment?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
  countryCode: string;
  isPrimary: boolean;
  isVerified: boolean;
  fullAddress: string;
}
