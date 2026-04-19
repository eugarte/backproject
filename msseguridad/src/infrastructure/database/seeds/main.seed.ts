import { DataSource } from 'typeorm';
import { Role } from '../../../domain/entities/role';
import { Permission } from '../../../domain/entities/permission';
import { logger } from '../../services/logger';

// Default roles with fixed UUIDs
const defaultRoles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Superadmin',
    slug: 'superadmin',
    description: 'Full system access with all permissions',
    hierarchyLevel: 100,
    isDefault: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Administrator',
    slug: 'admin',
    description: 'Administrative access to manage users and roles',
    hierarchyLevel: 50,
    isDefault: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'User',
    slug: 'user',
    description: 'Standard user with basic permissions',
    hierarchyLevel: 10,
    isDefault: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Guest',
    slug: 'guest',
    description: 'Limited read-only access',
    hierarchyLevel: 0,
    isDefault: false,
  },
];

// Default permissions
const defaultPermissions = [
  // User management
  { resource: 'user', action: 'create', slug: 'user:create', description: 'Create new users' },
  { resource: 'user', action: 'read', slug: 'user:read', description: 'Read user information' },
  { resource: 'user', action: 'update', slug: 'user:update', description: 'Update user data' },
  { resource: 'user', action: 'delete', slug: 'user:delete', description: 'Delete users' },
  { resource: 'user', action: 'list', slug: 'user:list', description: 'List all users' },
  
  // Role management
  { resource: 'role', action: 'create', slug: 'role:create', description: 'Create new roles' },
  { resource: 'role', action: 'read', slug: 'role:read', description: 'Read role information' },
  { resource: 'role', action: 'update', slug: 'role:update', description: 'Update roles' },
  { resource: 'role', action: 'delete', slug: 'role:delete', description: 'Delete roles' },
  { resource: 'role', action: 'assign', slug: 'role:assign', description: 'Assign roles to users' },
  
  // Permission management
  { resource: 'permission', action: 'read', slug: 'permission:read', description: 'Read permissions' },
  { resource: 'permission', action: 'grant', slug: 'permission:grant', description: 'Grant permissions' },
  { resource: 'permission', action: 'revoke', slug: 'permission:revoke', description: 'Revoke permissions' },
  
  // Audit logs
  { resource: 'audit', action: 'read', slug: 'audit:read', description: 'Read audit logs' },
  { resource: 'audit', action: 'export', slug: 'audit:export', description: 'Export audit logs' },
  
  // OAuth clients
  { resource: 'oauth-client', action: 'create', slug: 'oauth-client:create', description: 'Create OAuth clients' },
  { resource: 'oauth-client', action: 'read', slug: 'oauth-client:read', description: 'Read OAuth clients' },
  { resource: 'oauth-client', action: 'update', slug: 'oauth-client:update', description: 'Update OAuth clients' },
  { resource: 'oauth-client', action: 'delete', slug: 'oauth-client:delete', description: 'Delete OAuth clients' },
  
  // Sessions
  { resource: 'session', action: 'read', slug: 'session:read', description: 'Read sessions' },
  { resource: 'session', action: 'terminate', slug: 'session:terminate', description: 'Terminate sessions' },
  
  // Security
  { resource: 'security', action: 'manage', slug: 'security:manage', description: 'Manage security settings' },
  { resource: 'security', action: 'alert', slug: 'security:alert', description: 'Receive security alerts' },
];

// Role-Permission mappings
const rolePermissions = {
  superadmin: defaultPermissions.map(p => p.slug), // All permissions
  admin: [
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:list',
    'role:read', 'role:assign',
    'permission:read',
    'audit:read', 'audit:export',
    'oauth-client:create', 'oauth-client:read', 'oauth-client:update', 'oauth-client:delete',
    'session:read', 'session:terminate',
    'security:alert',
  ],
  user: [
    'user:read', 'user:update',
    'session:read', 'session:terminate',
  ],
  guest: [
    'user:read',
  ],
};

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  logger.info('Starting database seeding...');

  try {
    // Seed permissions
    logger.info('Seeding permissions...');
    const permissionMap = new Map<string, Permission>();
    
    for (const permData of defaultPermissions) {
      let permission = await permissionRepository.findOne({
        where: { slug: permData.slug },
      });

      if (!permission) {
        permission = permissionRepository.create(permData);
        await permissionRepository.save(permission);
        logger.info(`Created permission: ${permData.slug}`);
      }
      permissionMap.set(permData.slug, permission);
    }

    // Seed roles
    logger.info('Seeding roles...');
    const roleMap = new Map<string, Role>();
    
    for (const roleData of defaultRoles) {
      let role = await roleRepository.findOne({
        where: { slug: roleData.slug },
      });

      if (!role) {
        role = roleRepository.create(roleData);
        await roleRepository.save(role);
        logger.info(`Created role: ${roleData.name}`);
      }
      roleMap.set(roleData.slug, role);
    }

    // Assign permissions to roles
    logger.info('Assigning permissions to roles...');
    
    for (const [roleSlug, permSlugs] of Object.entries(rolePermissions)) {
      const role = roleMap.get(roleSlug);
      if (!role) continue;

      const permissions: Permission[] = [];
      for (const permSlug of permSlugs) {
        const perm = permissionMap.get(permSlug);
        if (perm) permissions.push(perm);
      }

      role.permissions = permissions;
      await roleRepository.save(role);
      logger.info(`Assigned ${permissions.length} permissions to ${roleSlug}`);
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  }
}
