export interface GdprExportDto {
  customerId: string;
  format: 'json' | 'csv' | 'pdf';
  requestedBy: string;
}

export interface GdprAnonymizeDto {
  reason: string;
  requestedBy: string;
}

export interface GdprExportResponseDto {
  customerId: string;
  exportDate: string;
  data: Record<string, unknown>;
  fileUrl?: string;
}

export interface ConsentRecordDto {
  customerId: string;
  consentType: string;
  granted: boolean;
  version: string;
  consentText: string;
  grantedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  legalBasis: string;
}
