import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feature_flag_services')
export class FeatureFlagServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'feature_flag_id' })
  feature_flag_id!: string;

  @Column({ type: 'uuid', name: 'service_id' })
  service_id!: string;

  @Column({ type: 'boolean', default: true })
  is_enabled!: boolean;

  @Column({ type: 'jsonb', name: 'override_strategy', nullable: true })
  override_strategy?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
