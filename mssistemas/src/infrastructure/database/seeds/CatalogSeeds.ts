import { DataSource } from 'typeorm';
import { CatalogEntity } from '../persistence/entities/CatalogEntity';
import { CatalogValueEntity } from '../persistence/entities/CatalogValueEntity';

export const seedCatalogs = async (dataSource: DataSource): Promise<void> => {
  const catalogRepo = dataSource.getRepository(CatalogEntity);
  const catalogValueRepo = dataSource.getRepository(CatalogValueEntity);

  // Check if catalogs already exist
  const existingCount = await catalogRepo.count();
  if (existingCount > 0) {
    console.log('✓ Catalogs already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding catalogs...');

  // Service Status Catalog
  const serviceStatusCatalog = catalogRepo.create({
    key: 'service_status',
    name: 'Estado de Servicio',
    description: 'Estados disponibles para los servicios del sistema',
    allowMultiple: false,
    isActive: true,
    createdBy: 'system',
  });
  await catalogRepo.save(serviceStatusCatalog);

  const serviceStatuses = [
    { code: 'activo', label: 'Activo', description: 'Servicio funcionando normalmente', color: '#10B981', sortOrder: 1, isDefault: true },
    { code: 'inactivo', label: 'Inactivo', description: 'Servicio temporalmente inactivo', color: '#6B7280', sortOrder: 2 },
    { code: 'suspendido', label: 'Suspendido', description: 'Servicio suspendido', color: '#F59E0B', sortOrder: 3 },
    { code: 'mantenimiento', label: 'En Mantenimiento', description: 'Servicio en mantenimiento programado', color: '#3B82F6', sortOrder: 4 },
    { code: 'deprecado', label: 'Deprecado', description: 'Servicio deprecado, no recomendado para uso', color: '#EF4444', sortOrder: 5 },
  ];

  for (const status of serviceStatuses) {
    const value = catalogValueRepo.create({
      catalogId: serviceStatusCatalog.id,
      ...status,
      isActive: true,
    });
    await catalogValueRepo.save(value);
  }

  // User Type Catalog
  const userTypeCatalog = catalogRepo.create({
    key: 'user_type',
    name: 'Tipo de Usuario',
    description: 'Tipos de usuarios del sistema',
    allowMultiple: false,
    isActive: true,
    createdBy: 'system',
  });
  await catalogRepo.save(userTypeCatalog);

  const userTypes = [
    { code: 'admin', label: 'Administrador', description: 'Usuario con acceso completo al sistema', color: '#7C3AED', sortOrder: 1 },
    { code: 'developer', label: 'Desarrollador', description: 'Usuario desarrollador con acceso a APIs', color: '#0EA5E9', sortOrder: 2, isDefault: true },
    { code: 'cliente', label: 'Cliente', description: 'Usuario cliente final', color: '#10B981', sortOrder: 3 },
    { code: 'auditor', label: 'Auditor', description: 'Usuario con permisos de solo lectura', color: '#F59E0B', sortOrder: 4 },
  ];

  for (const type of userTypes) {
    const value = catalogValueRepo.create({
      catalogId: userTypeCatalog.id,
      ...type,
      isActive: true,
    });
    await catalogValueRepo.save(value);
  }

  // Notification Priority Catalog
  const priorityCatalog = catalogRepo.create({
    key: 'notification_priority',
    name: 'Prioridad de Notificación',
    description: 'Niveles de prioridad para notificaciones del sistema',
    allowMultiple: false,
    isActive: true,
    createdBy: 'system',
  });
  await catalogRepo.save(priorityCatalog);

  const priorities = [
    { code: 'baja', label: 'Baja', description: 'Prioridad baja - no requiere atención inmediata', color: '#6B7280', sortOrder: 1, isDefault: true },
    { code: 'media', label: 'Media', description: 'Prioridad media - atención en horario laboral', color: '#3B82F6', sortOrder: 2 },
    { code: 'alta', label: 'Alta', description: 'Prioridad alta - requiere atención pronta', color: '#F59E0B', sortOrder: 3 },
    { code: 'critica', label: 'Crítica', description: 'Prioridad crítica - requiere atención inmediata', color: '#EF4444', sortOrder: 4 },
  ];

  for (const priority of priorities) {
    const value = catalogValueRepo.create({
      catalogId: priorityCatalog.id,
      ...priority,
      isActive: true,
    });
    await catalogValueRepo.save(value);
  }

  console.log('✓ Catalogs seeded successfully');
};