export interface AddressFilter {
  countryCode?: string;
  city?: string;
  isPrimary?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
