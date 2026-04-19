import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SecretEntity } from './SecretEntity';

@Entity('secret_access_logs')
export class SecretAccessLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'secret_id', type: 'uuid' })
  secretId!: string;

  @Column({ name: 'accessed_by', type: 'uuid', nullable: true })
  accessedBy!: string | null;

  @CreateDateColumn({ name: 'accessed_at' })
  accessedAt!: Date;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @ManyToOne(() => SecretEntity, secret => secret.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'secret_id' })
  secret?: SecretEntity;
}