import { UserRepository } from '@domain/repositories/user-repository.interface';
import { Permission } from '@domain/entities/permission';
import { Role } from '@domain/entities/role';

export interface GetUserProfileRequest {
  userId: string;
}

export interface GetUserProfileResult {
  id: string;
  email: string;
  status: string;
  roles: { id: string; name: string; slug: string }[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResult> {
    const user = await this.userRepository.findById(request.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Aggregate roles and permissions
    const roles = user.roles?.map((role: Role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
    })) || [];

    const permissions: string[] = user.roles?.flatMap((role: Role) => 
      role.permissions?.map((perm: Permission) => perm.slug) || []
    ) || [];

    // Remove duplicates
    const uniquePermissions: string[] = [...new Set(permissions)];

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      roles,
      permissions: uniquePermissions,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
    };
  }
}
