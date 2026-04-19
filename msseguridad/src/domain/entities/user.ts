import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Role } from './role';
import { RefreshToken } from './refresh-token';
import { UserSession } from './user-session';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  LOCKED = 'locked',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['lockedUntil'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'mfa_enabled' })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'mfa_secret' })
  mfaSecret!: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'mfa_enabled_at' })
  mfaEnabledAt!: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'locked_until' })
  lockedUntil!: Date | null;

  @Column({ type: 'int', default: 0, name: 'failed_attempts' })
  failedAttempts!: number;

  @Column({ type: 'int', default: 0, name: 'failed_mfa_attempts' })
  failedMfaAttempts!: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_login_at' })
  lastLoginAt!: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'password_changed_at' })
  passwordChangedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_verification_token' })
  emailVerificationToken!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_reset_token' })
  passwordResetToken!: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'password_reset_expires' })
  passwordResetExpires!: Date | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  // Helper methods
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked();
  }
}
