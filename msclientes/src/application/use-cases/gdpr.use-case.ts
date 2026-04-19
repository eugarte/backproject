import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { IEventPublisher } from '../../domain/events/event-publisher';
import { GdprExportRequestedEvent } from '../../domain/events/customer-events';
import { AuditLog } from '../../domain/entities/audit-log';
import { GdprExportResponseDto, GdprExportDto } from '../dtos/gdpr.dto';

export class GdprExportDataUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(dto: GdprExportDto): Promise<GdprExportResponseDto> {
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Log the export request (GDPR requirement)
    await this.auditLogRepository.create(
      AuditLog.createGdprLog('customer', dto.customerId, 'gdpr_export', dto.customerId, dto.requestedBy, {
        format: dto.format,
      })
    );

    // Publish event
    this.eventPublisher.publish(
      new GdprExportRequestedEvent(dto.customerId, 'customer', {
        customerId: dto.customerId,
        requestedBy: dto.requestedBy,
        format: dto.format,
      })
    );

    // Export data
    const exportData = customer.exportData();

    return {
      customerId: dto.customerId,
      exportDate: new Date().toISOString(),
      data: exportData,
    };
  }
}