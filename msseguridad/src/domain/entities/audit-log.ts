import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFIED = 'mfa_verified',
  MFA_FAILED = 'mfa_failed',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REVOKED = 'token_revoked',
  SESSION_TERMINATED = 'session_terminated',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PERMISSION_CHECK = 'permission_check',
  SECURITY_ALERT = 'security_alert',
  RATE_LIMIT_HIT = 'rate_limit_hit',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['resource', 'createdAt'])
@Index(['status'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'user_id' })
  userId!: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  resource!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'resource_id' })
  resourceId!: string | null;

  @Column({ type: 'json', nullable: true })
  details!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'country' })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'city' })
  city!: string | null;

  @Column({ type: 'enum', enum: AuditStatus, default: AuditStatus.SUCCESS })
  status!: AuditStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
