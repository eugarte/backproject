import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user';

export enum TokenStatus {
  ACTIVE = 'active',
  USED = 'used',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('refresh_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['userId', 'isRevoked'])
@Index(['familyId'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'token_hash' })
  tokenHash!: string;

  @Column({ type: 'uuid', name: 'family_id' })
  familyId!: string;

  @Column({ type: 'enum', enum: TokenStatus, default: TokenStatus.ACTIVE })
  status!: TokenStatus;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'revoked_reason' })
  revokedReason!: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'revoked_at' })
  revokedAt!: Date | null;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'used_at' })
  usedAt!: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired() && this.status === TokenStatus.ACTIVE;
  }

  revoke(reason: string): void {
    this.isRevoked = true;
    this.revokedReason = reason;
    this.revokedAt = new Date();
    this.status = TokenStatus.REVOKED;
  }
}
