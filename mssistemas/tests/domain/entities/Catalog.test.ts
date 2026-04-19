import { Catalog } from '../../src/domain/entities/Catalog';

describe('Catalog Entity', () => {
  it('should create a catalog with default values', () => {
    const catalog = new Catalog('service_status', 'Service Status');

    expect(catalog.key).toBe('service_status');
    expect(catalog.name).toBe('Service Status');
    expect(catalog.description).toBeNull();
    expect(catalog.allowMultiple).toBe(false);
    expect(catalog.isActive).toBe(true);
    expect(catalog.createdBy).toBe('system');
    expect(catalog.id).toBeDefined();
    expect(catalog.createdAt).toBeInstanceOf(Date);
    expect(catalog.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a catalog with custom values', () => {
    const catalog = new Catalog(
      'customer_type',
      'Customer Type',
      'Types of customers',
      false,
      true,
      'admin'
    );

    expect(catalog.key).toBe('customer_type');
    expect(catalog.name).toBe('Customer Type');
    expect(catalog.description).toBe('Types of customers');
    expect(catalog.allowMultiple).toBe(false);
    expect(catalog.isActive).toBe(true);
    expect(catalog.createdBy).toBe('admin');
  });

  it('should update catalog fields', () => {
    const catalog = new Catalog('test', 'Test');
    
    catalog.update({
      name: 'Updated Name',
      description: 'Updated Description',
      isActive: false
    });

    expect(catalog.name).toBe('Updated Name');
    expect(catalog.description).toBe('Updated Description');
    expect(catalog.isActive).toBe(false);
    expect(catalog.updatedAt).not.toEqual(catalog.createdAt);
  });

  it('should not update fields when undefined is passed', () => {
    const catalog = new Catalog('test', 'Test');
    const originalName = catalog.name;
    
    catalog.update({});

    expect(catalog.name).toBe(originalName);
  });
});
