import { Repository, DataSource } from 'typeorm';
import { UserRoleEntity } from '../entities/UserRoleEntity';

/**
 * Repositorio para catálogo de roles de usuario
 * Reemplaza la dependencia de mssistemas
 */
export class UserRoleRepository {
  private repository: Repository<UserRoleEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserRoleEntity);
  }

  /**
   * Buscar todos los roles activos
   */
  async findAllActive(): Promise<UserRoleEntity[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { order: 'ASC' }
    });
  }

  /**
   * Buscar role por código
   */
  async findByCode(code: string): Promise<UserRoleEntity | null> {
    return this.repository.findOne({
      where: { code: code.toUpperCase(), isActive: true }
    });
  }

  /**
   * Buscar múltiples roles por códigos
   */
  async findByCodes(codes: string[]): Promise<Map<string, string>> {
    const upperCodes = codes.map(c => c.toUpperCase());
    const roles = await this.repository.find({
      where: { isActive: true }
    });
    
    const result = new Map<string, string>();
    roles.forEach(role => {
      if (upperCodes.includes(role.code.toUpperCase())) {
        result.set(role.code.toUpperCase(), role.code.toLowerCase());
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

  /**
   * Obtener permisos de un rol
   */
  async getPermissions(code: string): Promise<string[]> {
    const role = await this.findByCode(code);
    return role?.permissions || [];
  }
}