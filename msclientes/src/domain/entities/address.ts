import { AddressType } from '../value-objects/customer-enums';

export interface AddressProps {
  id: string;
  customerId: string;
  addressType: AddressType;
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
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Address {
  private props: AddressProps;

  constructor(props: AddressProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Address ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.street || this.props.street.trim().length === 0) {
      throw new Error('Street is required');
    }
    if (!this.props.city || this.props.city.trim().length === 0) {
      throw new Error('City is required');
    }
    if (!this.props.postalCode) throw new Error('Postal code is required');
    if (!this.props.countryCode || this.props.countryCode.length !== 2) {
      throw new Error('Valid country code (2 chars) is required');
    }
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get addressType(): AddressType { return this.props.addressType; }
  get street(): string { return this.props.street; }
  get streetNumber(): string | undefined { return this.props.streetNumber; }
  get apartment(): string | undefined { return this.props.apartment; }
  get city(): string { return this.props.city; }
  get stateProvince(): string | undefined { return this.props.stateProvince; }
  get postalCode(): string { return this.props.postalCode; }
  get country(): string { return this.props.country; }
  get countryCode(): string { return this.props.countryCode; }
  get isPrimary(): boolean { return this.props.isPrimary; }
  get isVerified(): boolean { return this.props.isVerified; }
  get latitude(): number | undefined { return this.props.latitude; }
  get longitude(): number | undefined { return this.props.longitude; }
  get fullAddress(): string {
    const parts = [
      this.props.street,
      this.props.streetNumber,
      this.props.apartment,
      this.props.city,
      this.props.stateProvince,
      this.props.postalCode,
      this.props.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  setAsPrimary(): void {
    this.props.isPrimary = true;
  }

  verify(): void {
    this.props.isVerified = true;
  }

  updateCoordinates(lat: number, lng: number): void {
    this.props.latitude = lat;
    this.props.longitude = lng;
  }

  anonymize(): void {
    this.props.street = 'ANONYMIZED';
    this.props.streetNumber = undefined;
    this.props.apartment = undefined;
    this.props.city = 'ANONYMIZED';
    this.props.stateProvince = undefined;
    this.props.postalCode = '00000';
    this.props.latitude = undefined;
    this.props.longitude = undefined;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      addressType: this.addressType,
      street: this.street,
      streetNumber: this.streetNumber,
      apartment: this.apartment,
      city: this.city,
      stateProvince: this.stateProvince,
      postalCode: this.postalCode,
      country: this.country,
      countryCode: this.countryCode,
      isPrimary: this.isPrimary,
      isVerified: this.isVerified,
      latitude: this.latitude,
      longitude: this.longitude,
      fullAddress: this.fullAddress,
    };
  }
}
