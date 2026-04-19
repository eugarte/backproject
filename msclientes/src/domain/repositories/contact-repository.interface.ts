import { Contact } from '../entities/contact';

export interface IContactRepository {
  findById(id: string): Promise<Contact | null>;
  findByCustomerId(customerId: string): Promise<Contact[]>;
  findPrimaryByCustomerId(customerId: string, type?: string): Promise<Contact | null>;
  create(contact: Contact): Promise<Contact>;
  update(contact: Contact): Promise<Contact>;
  delete(id: string): Promise<void>;
  verify(id: string): Promise<void>;
}
