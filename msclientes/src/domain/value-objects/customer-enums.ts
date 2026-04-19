export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ANONYMIZED = 'anonymized',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  MOBILE = 'mobile',
  FAX = 'fax',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  TAX_ID = 'tax_id',
  BUSINESS_LICENSE = 'business_license',
  PROOF_OF_ADDRESS = 'proof_of_address',
  CONTRACT = 'contract',
  CONSENT_FORM = 'consent_form',
  OTHER = 'other',
}

export enum GdprCategory {
  IDENTITY = 'identity',
  FINANCIAL = 'financial',
  SENSITIVE = 'sensitive',
  CONTRACTUAL = 'contractual',
  CONSENT = 'consent',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}
