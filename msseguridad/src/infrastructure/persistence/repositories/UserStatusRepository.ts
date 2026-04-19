import { Repository, DataSource } from 'typeorm';
import { UserStatusEntity } from '../entities/UserStatusEntity';

/**
 * Repositorio para catálogo de estados de usuario
 * Reemplaza la dependencia de mssistemas
 */
export class UserStatusRepository {
  private repository: Repository<UserStatusEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserStatusEntity);
  }

  /**
   * Buscar todos los estados activos
   */
  async findAllActive(): Promise<UserStatusEntity[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { order: 'ASC' }
    });
  }

  /**
   * Buscar estado por código
   */
  async findByCode(code: string): Promise<UserStatusEntity | null> {
    return this.repository.findOne({
      where: { code: code.toUpperCase(), isActive: true }
    });
  }

  /**
   * Buscar múltiples estados por códigos
   */
  async findByCodes(codes: string[]): Promise<Map<string, string>> {
    const upperCodes = codes.map(c => c.toUpperCase());
    const statuses = await this.repository.find({
      where: { isActive: true }
    });
    
    const result = new Map<string, string>();
    statuses.forEach(status => {
      if (upperCodes.includes(status.code.toUpperCase())) {
        result.set(status.code.toUpperCase(), status.code.toLowerCase());
      }
    });
    
    return result;
  }

  /**
   * Validar si un código existe
   */
  async validateCode(code: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { code: code.toUpperCase(), isActive: true }
    });
    return count > 0;
  }
}