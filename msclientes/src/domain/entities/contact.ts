import { ContactType } from '../value-objects/customer-enums';

export interface ContactProps {
  id: string;
  customerId: string;
  contactType: ContactType;
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  canContact: boolean;
  contactSchedule?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Contact {
  private props: ContactProps;

  constructor(props: ContactProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Contact ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('Contact value is required');
    }
    if (this.props.contactType === ContactType.EMAIL && !this.isValidEmail(this.props.value)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get contactType(): ContactType { return this.props.contactType; }
  get value(): string { return this.props.value; }
  get label(): string | undefined { return this.props.label; }
  get isPrimary(): boolean { return this.props.isPrimary; }
  get isVerified(): boolean { return this.props.isVerified; }
  get verificationDate(): Date | undefined { return this.props.verificationDate; }
  get canContact(): boolean { return this.props.canContact; }
  get contactSchedule(): string | undefined { return this.props.contactSchedule; }
  get timezone(): string | undefined { return this.props.timezone; }

  setAsPrimary(): void {
    this.props.isPrimary = true;
  }

  verify(): void {
    this.props.isVerified = true;
    this.props.verificationDate = new Date();
  }

  updateValue(value: string): void {
    if (this.props.contactType === ContactType.EMAIL && !this.isValidEmail(value)) {
      throw new Error('Invalid email format');
    }
    this.props.value = value;
    this.props.isVerified = false;
    this.props.verificationDate = undefined;
  }

  anonymize(): void {
    if (this.props.contactType === ContactType.EMAIL) {
      this.props.value = 'anonymized@deleted.local';
    } else {
      this.props.value = '0000000000';
    }
    this.props.canContact = false;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      contactType: this.contactType,
      value: this.value,
      label: this.label,
      isPrimary: this.isPrimary,
      isVerified: this.isVerified,
      verificationDate: this.verificationDate,
      canContact: this.canContact,
      contactSchedule: this.contactSchedule,
      timezone: this.timezone,
    };
  }
}
