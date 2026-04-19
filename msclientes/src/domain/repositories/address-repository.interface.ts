import { Address } from '../entities/address';

export interface IAddressRepository {
  findById(id: string): Promise<Address | null>;
  findByCustomerId(customerId: string): Promise<Address[]>;
  findPrimaryByCustomerId(customerId: string): Promise<Address | null>;
  create(address: Address): Promise<Address>;
  update(address: Address): Promise<Address>;
  delete(id: string): Promise<void>;
  setAsPrimary(id: string, customerId: string): Promise<void>;
}
