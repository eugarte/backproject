import { User } from '../entities/user';
import type { Permission } from '../entities/permission';

export class PermissionEvaluator {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: User, permissionSlug: string): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    for (const role of user.roles) {
      if (!role.isActive) continue;
      
      if (role.permissions) {
        for (const permission of role.permissions) {
          if (permission.slug === permissionSlug && permission.isActive) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: User, permissionSlugs: string[]): boolean {
    return permissionSlugs.some(slug => this.hasPermission(user, slug));
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(user: User, permissionSlugs: string[]): boolean {
    return permissionSlugs.every(slug => this.hasPermission(user, slug));
  }

  /**
   * Get all permissions for a user
   */
  static getUserPermissions(user: User): Permission[] {
    const permissions: Map<string, Permission> = new Map();

    if (!user.roles) return [];

    for (const role of user.roles) {
      if (!role.isActive) continue;
      
      if (role.permissions) {
        for (const permission of role.permissions) {
          if (permission.isActive && !permissions.has(permission.slug)) {
            permissions.set(permission.slug, permission);
          }
        }
      }
    }

    return Array.from(permissions.values());
  }

  /**
   * Check if user has permission on a resource with optional conditions
   */
  static canAccessResource(
    user: User, 
    resource: string, 
    action: string,
    context?: Record<string, any>
  ): boolean {
    if (!user.roles) return false;

    for (const role of user.roles) {
      if (!role.isActive) continue;
      
      if (role.permissions) {
        for (const permission of role.permissions) {
          if (permission.resource === resource && 
              permission.action === action && 
              permission.isActive) {
            // Check conditions if provided
            if (context && permission.conditions) {
              if (permission.evaluateConditions(context)) {
                return true;
              }
            } else {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}