import { CustomerStatus, CustomerType, Gender } from '../value-objects/customer-enums';
import { Address } from './address';
import { Contact } from './contact';
import { Document } from './document';
import { CustomerTag } from './customer-tag';
import { CustomerPreference } from './customer-preference';
import { CreditHistory } from './credit-history';

export interface CustomerProps {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  taxId?: string;
  taxIdType?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  nationality?: string;
  preferredLanguage: string;
  status: CustomerStatus;
  customerType: CustomerType;
  companyName?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  creditScore?: number;
  creditLimit?: number;
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  gdprConsentVersion?: string;
  marketingConsent: boolean;
  dataProcessingConsent: boolean;
  anonymizedAt?: Date;
  anonymizedReason?: string;
  // 8 Custom Fields
  customVarchar?: string;
  customInt?: number;
  customDecimal?: number;
  customDatetime?: Date;
  customBool?: boolean;
  customText?: string;
  customJson?: Record<string, unknown>;
  customDate?: Date;
  addresses: Address[];
  contacts: Contact[];
  documents: Document[];
  tags: CustomerTag[];
  preferences: CustomerPreference[];
  creditHistory: CreditHistory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

export class Customer {
  private readonly props: CustomerProps;

  constructor(props: CustomerProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Customer ID is required');
    if (!this.props.customerCode) throw new Error('Customer code is required');
    if (!this.props.firstName || this.props.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!this.props.lastName || this.props.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (this.props.email && !this.isValidEmail(this.props.email)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Getters
  get id(): string { return this.props.id; }
  get customerCode(): string { return this.props.customerCode; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }
  get email(): string | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone; }
  get taxId(): string | undefined { return this.props.taxId; }
  get taxIdType(): string | undefined { return this.props.taxIdType; }
  get dateOfBirth(): Date | undefined { return this.props.dateOfBirth; }
  get gender(): Gender | undefined { return this.props.gender; }
  get nationality(): string | undefined { return this.props.nationality; }
  get preferredLanguage(): string { return this.props.preferredLanguage; }
  get status(): CustomerStatus { return this.props.status; }
  get customerType(): CustomerType { return this.props.customerType; }
  get companyName(): string | undefined { return this.props.companyName; }
  get industry(): string | undefined { return this.props.industry; }
  get annualRevenue(): number | undefined { return this.props.annualRevenue; }
  get employeeCount(): number | undefined { return this.props.employeeCount; }
  get creditScore(): number | undefined { return this.props.creditScore; }
  get creditLimit(): number | undefined { return this.props.creditLimit; }
  get gdprConsent(): boolean { return this.props.gdprConsent; }
  get gdprConsentDate(): Date | undefined { return this.props.gdprConsentDate; }
  get marketingConsent(): boolean { return this.props.marketingConsent; }
  get dataProcessingConsent(): boolean { return this.props.dataProcessingConsent; }
  get isAnonymized(): boolean { return !!this.props.anonymizedAt; }
  get anonymizedAt(): Date | undefined { return this.props.anonymizedAt; }
  
  // 8 Custom Fields Getters
  get customVarchar(): string | undefined { return this.props.customVarchar; }
  get customInt(): number | undefined { return this.props.customInt; }
  get customDecimal(): number | undefined { return this.props.customDecimal; }
  get customDatetime(): Date | undefined { return this.props.customDatetime; }
  get customBool(): boolean | undefined { return this.props.customBool; }
  get customText(): string | undefined { return this.props.customText; }
  get customJson(): Record<string, unknown> | undefined { return this.props.customJson; }
  get customDate(): Date | undefined { return this.props.customDate; }
  
  get addresses(): Address[] { return [...this.props.addresses]; }
  get contacts(): Contact[] { return [...this.props.contacts]; }
  get documents(): Document[] { return [...this.props.documents]; }
  get tags(): CustomerTag[] { return [...this.props.tags]; }
  get preferences(): CustomerPreference[] { return [...this.props.preferences]; }
  get creditHistory(): CreditHistory[] { return [...this.props.creditHistory]; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get isDeleted(): boolean { return !!this.props.deletedAt; }

  // Business methods
  updateBasicInfo(info: Partial<Pick<CustomerProps, 'firstName' | 'lastName' | 'email' | 'phone'>>): void {
    if (this.isAnonymized) throw new Error('Cannot update anonymized customer');
    if (info.firstName) this.props.firstName = info.firstName;
    if (info.lastName) this.props.lastName = info.lastName;
    if (info.email !== undefined) {
      if (info.email && !this.isValidEmail(info.email)) {
        throw new Error('Invalid email format');
      }
      this.props.email = info.email;
    }
    if (info.phone !== undefined) this.props.phone = info.phone;
    this.props.updatedAt = new Date();
    this.validate();
  }

  updateCompanyInfo(info: Partial<Pick<CustomerProps, 'companyName' | 'industry' | 'annualRevenue' | 'employeeCount'>>): void {
    if (this.isAnonymized) throw new Error('Cannot update anonymized customer');
    if (info.companyName !== undefined) this.props.companyName = info.companyName;
    if (info.industry !== undefined) this.props.industry = info.industry;
    if (info.annualRevenue !== undefined) this.props.annualRevenue = info.annualRevenue;
    if (info.employeeCount !== undefined) this.props.employeeCount = info.employeeCount;
    this.props.updatedAt = new Date();
  }

  updateGdprConsent(consent: { gdprConsent: boolean; marketingConsent: boolean; dataProcessingConsent: boolean; version: string }): void {
    if (this.isAnonymized) throw new Error('Cannot update consent for anonymized customer');
    this.props.gdprConsent = consent.gdprConsent;
    this.props.marketingConsent = consent.marketingConsent;
    this.props.dataProcessingConsent = consent.dataProcessingConsent;
    this.props.gdprConsentDate = consent.gdprConsent ? new Date() : undefined;
    this.props.gdprConsentVersion = consent.version;
    this.props.updatedAt = new Date();
  }

  // Update custom fields
  updateCustomFields(fields: Partial<Pick<CustomerProps, 'customVarchar' | 'customInt' | 'customDecimal' | 'customDatetime' | 'customBool' | 'customText' | 'customJson' | 'customDate'>>): void {
    if (this.isAnonymized) throw new Error('Cannot update anonymized customer');
    if (fields.customVarchar !== undefined) this.props.customVarchar = fields.customVarchar;
    if (fields.customInt !== undefined) this.props.customInt = fields.customInt;
    if (fields.customDecimal !== undefined) this.props.customDecimal = fields.customDecimal;
    if (fields.customDatetime !== undefined) this.props.customDatetime = fields.customDatetime;
    if (fields.customBool !== undefined) this.props.customBool = fields.customBool;
    if (fields.customText !== undefined) this.props.customText = fields.customText;
    if (fields.customJson !== undefined) this.props.customJson = fields.customJson;
    if (fields.customDate !== undefined) this.props.customDate = fields.customDate;
    this.props.updatedAt = new Date();
  }

  anonymize(reason: string): void {
    if (this.isAnonymized) return;
    
    this.props.firstName = 'ANONYMIZED';
    this.props.lastName = 'ANONYMIZED';
    this.props.email = undefined;
    this.props.phone = undefined;
    this.props.taxId = undefined;
    this.props.dateOfBirth = undefined;
    this.props.nationality = undefined;
    this.props.companyName = undefined;
    // Clear custom fields
    this.props.customVarchar = undefined;
    this.props.customInt = undefined;
    this.props.customDecimal = undefined;
    this.props.customDatetime = undefined;
    this.props.customBool = undefined;
    this.props.customText = undefined;
    this.props.customJson = undefined;
    this.props.customDate = undefined;
    this.props.status = CustomerStatus.ANONYMIZED;
    this.props.anonymizedAt = new Date();
    this.props.anonymizedReason = reason;
    
    // Anonymize addresses
    this.props.addresses.forEach(addr => addr.anonymize());
    // Anonymize contacts
    this.props.contacts.forEach(contact => contact.anonymize());
    
    this.props.updatedAt = new Date();
  }

  softDelete(deletedBy: string): void {
    if (this.isAnonymized) throw new Error('Cannot delete anonymized customer');
    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
    this.props.status = CustomerStatus.INACTIVE;
  }

  restore(): void {
    if (!this.isDeleted) return;
    this.props.deletedAt = undefined;
    this.props.deletedBy = undefined;
    this.props.status = CustomerStatus.ACTIVE;
  }

  addAddress(address: Address): void {
    if (this.isAnonymized) throw new Error('Cannot add address to anonymized customer');
    this.props.addresses.push(address);
  }

  removeAddress(addressId: string): void {
    this.props.addresses = this.props.addresses.filter(a => a.id !== addressId);
  }

  addContact(contact: Contact): void {
    if (this.isAnonymized) throw new Error('Cannot add contact to anonymized customer');
    this.props.contacts.push(contact);
  }

  addDocument(document: Document): void {
    if (this.isAnonymized) throw new Error('Cannot add document to anonymized customer');
    this.props.documents.push(document);
  }

  addTag(tag: CustomerTag): void {
    this.props.tags.push(tag);
  }

  removeTag(tagId: string): void {
    this.props.tags = this.props.tags.filter(t => t.id !== tagId);
  }

  setPreference(preference: CustomerPreference): void {
    const index = this.props.preferences.findIndex(
      p => p.category === preference.category && p.key === preference.key
    );
    if (index >= 0) {
      this.props.preferences[index] = preference;
    } else {
      this.props.preferences.push(preference);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      customerCode: this.customerCode,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      taxId: this.taxId,
      taxIdType: this.taxIdType,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      nationality: this.nationality,
      preferredLanguage: this.preferredLanguage,
      status: this.status,
      customerType: this.customerType,
      companyName: this.companyName,
      industry: this.industry,
      annualRevenue: this.annualRevenue,
      employeeCount: this.employeeCount,
      creditScore: this.creditScore,
      creditLimit: this.creditLimit,
      gdprConsent: this.gdprConsent,
      gdprConsentDate: this.gdprConsentDate,
      marketingConsent: this.marketingConsent,
      dataProcessingConsent: this.dataProcessingConsent,
      isAnonymized: this.isAnonymized,
      anonymizedAt: this.anonymizedAt,
      // Custom Fields
      customVarchar: this.customVarchar,
      customInt: this.customInt,
      customDecimal: this.customDecimal,
      customDatetime: this.customDatetime,
      customBool: this.customBool,
      customText: this.customText,
      customJson: this.customJson,
      customDate: this.customDate,
      addresses: this.addresses.map(a => a.toJSON()),
      contacts: this.contacts.map(c => c.toJSON()),
      documents: this.documents.map(d => d.toJSON()),
      tags: this.tags.map(t => t.toJSON()),
      preferences: this.preferences.map(p => p.toJSON()),
      creditHistory: this.creditHistory.map(ch => ch.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // GDPR Data Export
  exportData(): Record<string, unknown> {
    return {
      customer: this.toJSON(),
      exportDate: new Date().toISOString(),
      dataVersion: '1.1',
    };
  }
}
