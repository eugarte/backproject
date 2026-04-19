import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ['service', 'configuration', 'secret', 'feature_flag', 'catalog'] })
  entity_type!: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entity_id!: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100, name: 'actor', nullable: true })
  actor?: string;

  @Column({ type: 'enum', enum: ['user', 'service'], name: 'actor_type', default: 'user' })
  actor_type!: string;

  @Column({ type: 'varchar', length: 50, name: 'ip_address', nullable: true })
  ip_address?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
