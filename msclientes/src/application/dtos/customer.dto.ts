export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  taxId?: string;
  taxIdType?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  preferredLanguage?: string;
  customerType?: string;
  companyName?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  marketingConsent?: boolean;
  dataProcessingConsent?: boolean;
  // 8 Custom Fields
  customVarchar?: string;
  customInt?: number;
  customDecimal?: number;
  customDatetime?: Date;
  customBool?: boolean;
  customText?: string;
  customJson?: Record<string, unknown>;
  customDate?: Date;
  createdBy?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  preferredLanguage?: string;
  companyName?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  marketingConsent?: boolean;
  dataProcessingConsent?: boolean;
  // 8 Custom Fields
  customVarchar?: string;
  customInt?: number;
  customDecimal?: number;
  customDatetime?: Date;
  customBool?: boolean;
  customText?: string;
  customJson?: Record<string, unknown>;
  customDate?: Date;
  updatedBy?: string;
}

export interface CustomerResponseDto {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  taxId?: string;
  taxIdType?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  preferredLanguage: string;
  status: string;
  customerType: string;
  companyName?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  creditScore?: number;
  creditLimit?: number;
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  marketingConsent: boolean;
  dataProcessingConsent: boolean;
  isAnonymized: boolean;
  anonymizedAt?: Date;
  // 8 Custom Fields
  customVarchar?: string;
  customInt?: number;
  customDecimal?: number;
  customDatetime?: Date;
  customBool?: boolean;
  customText?: string;
  customJson?: Record<string, unknown>;
  customDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerListResponseDto {
  customers: CustomerResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
