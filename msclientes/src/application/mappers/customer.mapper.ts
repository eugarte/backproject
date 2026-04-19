import { Customer } from '../../domain/entities/customer';
import { CustomerResponseDto, CustomerListResponseDto } from '../dtos/customer.dto';
import { AddressMapper } from './address.mapper';
import { ContactMapper } from './contact.mapper';
import { DocumentMapper } from './document.mapper';

export class CustomerMapper {
  static toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      taxId: customer.taxId,
      taxIdType: customer.taxIdType,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      nationality: customer.nationality,
      preferredLanguage: customer.preferredLanguage,
      status: customer.status,
      customerType: customer.customerType,
      companyName: customer.companyName,
      industry: customer.industry,
      annualRevenue: customer.annualRevenue,
      employeeCount: customer.employeeCount,
      creditScore: customer.creditScore,
      creditLimit: customer.creditLimit,
      gdprConsent: customer.gdprConsent,
      gdprConsentDate: customer.gdprConsentDate,
      marketingConsent: customer.marketingConsent,
      dataProcessingConsent: customer.dataProcessingConsent,
      isAnonymized: customer.isAnonymized,
      anonymizedAt: customer.anonymizedAt,
      // 8 Custom Fields
      customVarchar: customer.customVarchar,
      customInt: customer.customInt,
      customDecimal: customer.customDecimal,
      customDatetime: customer.customDatetime,
      customBool: customer.customBool,
      customText: customer.customText,
      customJson: customer.customJson,
      customDate: customer.customDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  static toDetailedResponseDto(customer: Customer): CustomerResponseDto & {
    addresses: ReturnType<typeof AddressMapper.toResponseDto>[];
    contacts: ReturnType<typeof ContactMapper.toResponseDto>[];
    documents: ReturnType<typeof DocumentMapper.toResponseDto>[];
    tags: { id: string; tagName: string; tagValue?: string }[];
    preferences: { category: string; key: string; value?: string }[];
  } {
    return {
      ...this.toResponseDto(customer),
      addresses: customer.addresses.map(a => AddressMapper.toResponseDto(a)),
      contacts: customer.contacts.map(c => ContactMapper.toResponseDto(c)),
      documents: customer.documents.map(d => DocumentMapper.toResponseDto(d)),
      tags: customer.tags.map(t => ({ id: t.id, tagName: t.tagName, tagValue: t.tagValue })),
      preferences: customer.preferences.map(p => ({ category: p.category, key: p.key, value: p.value })),
    };
  }

  static toListResponseDto(
    customers: Customer[],
    total: number,
    page: number,
    limit: number
  ): CustomerListResponseDto {
    return {
      customers: customers.map(c => this.toResponseDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}