import { CatalogValue } from '../../src/domain/entities/CatalogValue';

describe('CatalogValue Entity', () => {
  it('should create a catalog value with default values', () => {
    const value = new CatalogValue('catalog-id', 'active', 'Active');

    expect(value.catalogId).toBe('catalog-id');
    expect(value.code).toBe('active');
    expect(value.label).toBe('Active');
    expect(value.description).toBeNull();
    expect(value.color).toBeNull();
    expect(value.sortOrder).toBe(0);
    expect(value.isDefault).toBe(false);
    expect(value.isActive).toBe(true);
    expect(value.deletedAt).toBeNull();
    expect(value.id).toBeDefined();
  });

  it('should create a catalog value with custom values', () => {
    const value = new CatalogValue(
      'catalog-id',
      'inactive',
      'Inactive',
      'Inactive state',
      '#ff0000',
      2,
      false,
      true
    );

    expect(value.code).toBe('inactive');
    expect(value.label).toBe('Inactive');
    expect(value.description).toBe('Inactive state');
    expect(value.color).toBe('#ff0000');
    expect(value.sortOrder).toBe(2);
    expect(value.isDefault).toBe(false);
  });

  it('should update catalog value fields', () => {
    const value = new CatalogValue('catalog-id', 'test', 'Test');
    
    value.update({
      code: 'updated',
      label: 'Updated',
      isDefault: true
    });

    expect(value.code).toBe('updated');
    expect(value.label).toBe('Updated');
    expect(value.isDefault).toBe(true);
  });

  it('should soft delete a catalog value', () => {
    const value = new CatalogValue('catalog-id', 'test', 'Test');
    
    value.softDelete();

    expect(value.deletedAt).not.toBeNull();
    expect(value.isActive).toBe(false);
    expect(value.isDeleted()).toBe(true);
  });
});
