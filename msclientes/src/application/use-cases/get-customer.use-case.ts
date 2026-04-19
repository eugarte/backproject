import { ICustomerRepository, CustomerFilter, PaginationOptions } from '../../domain/repositories/customer-repository.interface';
import { CustomerResponseDto, CustomerListResponseDto } from '../dtos/customer.dto';
import { CustomerMapper } from '../mappers/customer.mapper';

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(id: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) return null;
    return CustomerMapper.toDetailedResponseDto(customer);
  }
}

export class GetCustomerByCodeUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(code: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findByCode(code);
    if (!customer) return null;
    return CustomerMapper.toDetailedResponseDto(customer);
  }
}

export class ListCustomersUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: CustomerFilter
  ): Promise<CustomerListResponseDto> {
    const options: PaginationOptions = {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    const { customers, total } = await this.customerRepository.findAll(options, filters);
    return CustomerMapper.toListResponseDto(customers, total, page, limit);
  }
}