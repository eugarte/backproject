import { Catalog, CatalogValue } from '../../src/domain/entities/Catalog';

describe('Catalog', () => {
  it('should create a catalog with default values', () => {
    const catalog = new Catalog({
      key: 'test_status',
      name: 'Test Status',
    });

    expect(catalog.id).toBeDefined();
    expect(catalog.key).toBe('test_status');
    expect(catalog.name).toBe('Test Status');
    expect(catalog.isActive).toBe(true);
    expect(catalog.allowMultiple).toBe(false);
  });

  it('should validate catalog value code', () => {
    const catalog = new Catalog({
      key: 'status',
      name: 'Status',
      values: [
        new CatalogValue({ code: 'active', label: 'Active' }),
        new CatalogValue({ code: 'inactive', label: 'Inactive' }),
      ],
    });

    expect(catalog.validateCode('active')).toBe(true);
    expect(catalog.validateCode('inactive')).toBe(true);
    expect(catalog.validateCode('unknown')).toBe(false);
  });

  it('should get default value', () => {
    const catalog = new Catalog({
      key: 'status',
      name: 'Status',
      values: [
        new CatalogValue({ code: 'active', label: 'Active', isDefault: true }),
        new CatalogValue({ code: 'inactive', label: 'Inactive' }),
      ],
    });

    const defaultValue = catalog.getDefaultValue();
    expect(defaultValue?.code).toBe('active');
  });
});

describe('CatalogValue', () => {
  it('should create a catalog value with default values', () => {
    const value = new CatalogValue({
      catalogId: 'catalog-123',
      code: 'active',
      label: 'Active',
    });

    expect(value.id).toBeDefined();
    expect(value.code).toBe('active');
    expect(value.label).toBe('Active');
    expect(value.isActive).toBe(true);
    expect(value.isDefault).toBe(false);
    expect(value.sortOrder).toBe(0);
  });

  it('should soft delete', () => {
    const value = new CatalogValue({
      code: 'test',
      label: 'Test',
    });

    value.softDelete();
    expect(value.isActive).toBe(false);
    expect(value.deletedAt).toBeDefined();
  });
});