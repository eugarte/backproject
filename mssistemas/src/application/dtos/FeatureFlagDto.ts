export class CreateFeatureFlagDto {
  key!: string;
  name!: string;
  description?: string;
  enabled?: boolean;
  strategy?: 'simple' | 'percentage' | 'user_target' | 'group_target' | 'schedule';
  percentage?: number;
  targetUsers?: string[];
  targetGroups?: string[];
  scheduleStart?: Date;
  scheduleEnd?: Date;
}

export class UpdateFeatureFlagDto {
  name?: string;
  description?: string;
  enabled?: boolean;
  strategy?: 'simple' | 'percentage' | 'user_target' | 'group_target' | 'schedule';
  percentage?: number;
  targetUsers?: string[];
  targetGroups?: string[];
  scheduleStart?: Date;
  scheduleEnd?: Date;
}

export class EvaluateFeatureFlagDto {
  userId?: string;
  userGroups?: string[];
  serviceId?: string;
}

export class FeatureFlagServiceOverrideDto {
  serviceId!: string;
  isEnabled!: boolean;
  overrideStrategy?: Partial<CreateFeatureFlagDto>;
}

export class FeatureFlagResponseDto {
  id!: string;
  key!: string;
  name!: string;
  description?: string;
  enabled!: boolean;
  strategy!: string;
  percentage!: number;
  targetUsers!: string[];
  targetGroups!: string[];
  scheduleStart?: Date;
  scheduleEnd?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class FeatureFlagEvaluationResponseDto {
  key!: string;
  enabled!: boolean;
  reason?: string;
}
