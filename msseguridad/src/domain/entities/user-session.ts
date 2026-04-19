import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user';

@Entity('user_sessions')
@Index(['sessionToken'], { unique: true })
@Index(['userId', 'isActive'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'session_token' })
  sessionToken!: string;

  @Column({ type: 'varchar', length: 45, name: 'ip_address' })
  ipAddress!: string;

  @Column({ type: 'varchar', length: 255, name: 'user_agent' })
  userAgent!: string;

  @Column({ type: 'json', nullable: true, name: 'device_info' })
  deviceInfo!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'last_activity_at' })
  lastActivityAt!: Date | null;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'terminated_at' })
  terminatedAt!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'terminate_reason' })
  terminateReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  touch(): void {
    this.lastActivityAt = new Date();
  }

  terminate(reason: string): void {
    this.isActive = false;
    this.terminatedAt = new Date();
    this.terminateReason = reason;
  }
}
