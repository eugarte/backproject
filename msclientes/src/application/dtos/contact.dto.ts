import { ContactType } from '../../domain/value-objects/customer-enums';

export interface CreateContactDto {
  contactType: ContactType;
  value: string;
  label?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  verificationDate?: Date;
  canContact?: boolean;
  contactSchedule?: string;
  timezone?: string;
  createdAt?: Date;
}

export interface ContactResponseDto {
  id: string;
  contactType: string;
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  canContact: boolean;
  contactSchedule?: string;
  timezone?: string;
}
