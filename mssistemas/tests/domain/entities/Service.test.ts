import { Service } from '../../src/domain/entities/Service';

describe('Service Entity', () => {
  it('should create a service with default values', () => {
    const service = new Service('msclientes', 'Client Service');

    expect(service.name).toBe('msclientes');
    expect(service.displayName).toBe('Client Service');
    expect(service.description).toBeNull();
    expect(service.version).toBe('1.0.0');
    expect(service.statusCatalogId).toBeNull();
    expect(service.statusValue).toBeNull();
    expect(service.technologyStack).toEqual([]);
    expect(service.id).toBeDefined();
    expect(service.createdAt).toBeInstanceOf(Date);
  });

  it('should create a service with custom values', () => {
    const service = new Service(
      'msseguridad',
      'Security Service',
      'Authentication service',
      '2.0.0',
      'status-catalog-id',
      'active',
      'security-team',
      'https://github.com/eugarte/msseguridad',
      'https://docs.msseguridad.com',
      ['nodejs', 'typescript'],
      'https://msseguridad.com/health'
    );

    expect(service.name).toBe('msseguridad');
    expect(service.displayName).toBe('Security Service');
    expect(service.description).toBe('Authentication service');
    expect(service.version).toBe('2.0.0');
    expect(service.statusCatalogId).toBe('status-catalog-id');
    expect(service.statusValue).toBe('active');
    expect(service.teamOwner).toBe('security-team');
    expect(service.technologyStack).toEqual(['nodejs', 'typescript']);
  });

  it('should update service fields', () => {
    const service = new Service('test', 'Test');
    
    service.update({
      version: '2.0.0',
      statusValue: 'inactive'
    });

    expect(service.version).toBe('2.0.0');
    expect(service.statusValue).toBe('inactive');
  });
});
