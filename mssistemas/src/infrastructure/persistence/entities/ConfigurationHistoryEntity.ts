import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConfigurationEntity } from './ConfigurationEntity';

@Entity('configuration_history')
export class ConfigurationHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'configuration_id', type: 'uuid' })
  configurationId!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;

  @ManyToOne(() => ConfigurationEntity, config => config.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'configuration_id' })
  configuration?: ConfigurationEntity;
}