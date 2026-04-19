import { Repository, DataSource } from 'typeorm';
import { DeliveryStatusEntity } from '../entities/DeliveryStatusEntity';

export interface DeliveryStatus {
  id: string;
  code: string;
  label: string;
  description: string | null;
  isActive: boolean;
  order: number;
}

export class DeliveryStatusRepository {
  private repository: Repository<DeliveryStatusEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(DeliveryStatusEntity);
  }

  async findAll(): Promise<DeliveryStatus[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
    return entities.map(this.toDomain);
  }

  async findByCode(code: string): Promise<DeliveryStatus | null> {
    const entity = await this.repository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCodes(codes: string[]): Promise<Map<string, string>> {
    const entities = await this.repository.find({
      where: { isActive: true },
    });
    
    const result = new Map<string, string>();
    for (const entity of entities) {
      if (codes.includes(entity.code.toUpperCase())) {
        result.set(entity.code.toUpperCase(), entity.code.toLowerCase());
      }
    }
    return result;
  }

  async validateCode(code: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { code: code.toUpperCase(), isActive: true },
    });
    return count > 0;
  }

  private toDomain(entity: DeliveryStatusEntity): DeliveryStatus {
    return {
      id: entity.id,
      code: entity.code,
      label: entity.label,
      description: entity.description,
      isActive: entity.isActive,
      order: entity.order,
    };
  }
}
