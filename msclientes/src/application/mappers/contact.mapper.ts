import { Contact } from '../../domain/entities/contact';
import { ContactType } from '../../domain/value-objects/customer-enums';
import { ContactResponseDto, CreateContactDto } from '../dtos/contact.dto';

export class ContactMapper {
  static toEntity(dto: CreateContactDto & { id: string; customerId: string }): Contact {
    return new Contact({
      id: dto.id,
      customerId: dto.customerId,
      contactType: dto.contactType,
      value: dto.value,
      label: dto.label,
      isPrimary: dto.isPrimary || false,
      isVerified: dto.isVerified || false,
      verificationDate: dto.verificationDate,
      canContact: dto.canContact !== false,
      contactSchedule: dto.contactSchedule,
      timezone: dto.timezone,
      createdAt: dto.createdAt || new Date(),
      updatedAt: new Date(),
    });
  }

  static toResponseDto(contact: Contact): ContactResponseDto {
    return {
      id: contact.id,
      contactType: contact.contactType,
      value: contact.value,
      label: contact.label,
      isPrimary: contact.isPrimary,
      isVerified: contact.isVerified,
      verificationDate: contact.verificationDate,
      canContact: contact.canContact,
      contactSchedule: contact.contactSchedule,
      timezone: contact.timezone,
    };
  }
}