import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { ContactEntity } from '../entities/contact.entity';
import { Contact } from '../../../domain/entities/contact';
import { IContactRepository } from '../../../domain/repositories/contact-repository.interface';
import { ContactMapper } from '../../../application/mappers/contact.mapper';

export class TypeOrmContactRepository implements IContactRepository {
  private repository: Repository<ContactEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ContactEntity);
  }

  async findById(id: string): Promise<Contact | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: string): Promise<Contact[]> {
    const entities = await this.repository.find({
      where: { customerId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findPrimaryByCustomerId(customerId: string, type?: string): Promise<Contact | null> {
    const where: any = { customerId, isPrimary: true };
    if (type) where.contactType = type;
    
    const entity = await this.repository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async create(contact: Contact): Promise<Contact> {
    const entity = this.toEntity(contact);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(contact: Contact): Promise<Contact> {
    const entity = this.toEntity(contact);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async verify(id: string): Promise<void> {
    await this.repository.update(id, { isVerified: true, verificationDate: new Date() });
  }

  private toDomain(entity: ContactEntity): Contact {
    return ContactMapper.toEntity({
      id: entity.id,
      customerId: entity.customerId,
      contactType: entity.contactType as any,
      value: entity.value,
      label: entity.label || undefined,
      isPrimary: entity.isPrimary,
      isVerified: entity.isVerified,
      verificationDate: entity.verificationDate || undefined,
      canContact: entity.canContact,
      contactSchedule: entity.contactSchedule || undefined,
      timezone: entity.timezone || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(contact: Contact): ContactEntity {
    const entity = new ContactEntity();
    entity.id = contact.id;
    entity.customerId = contact.customerId;
    entity.contactType = contact.contactType;
    entity.value = contact.value;
    entity.label = contact.label || null;
    entity.isPrimary = contact.isPrimary;
    entity.isVerified = contact.isVerified;
    entity.verificationDate = contact.verificationDate || null;
    entity.canContact = contact.canContact;
    entity.contactSchedule = contact.contactSchedule || null;
    entity.timezone = contact.timezone || null;
    return entity;
  }
}
