import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('service_heartbeats')
export class ServiceHeartbeatEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'service_id' })
  serviceId!: string;

  @Column()
  environment!: string;

  @Column({ name: 'instance_id' })
  instanceId!: string;

  @Column()
  status!: string;

  @Column({ name: 'response_time_ms', default: 0 })
  responseTimeMs!: number;

  @Column()
  version!: string;

  @Column({ type: 'json', default: {} })
  metadata!: Record<string, any>;

  @Column({ name: 'reported_at' })
  reportedAt!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
