import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['timestamp'])
@Index(['performedBy'])
@Index(['gdprRelated'])
@Index(['dataSubjectId'])
export class AuditLogEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 50 })
  entityType!: string;

  @Column({ length: 36 })
  entityId!: string;

  @Column({ length: 50 })
  action!: string;

  @Column({ type: 'json', nullable: true })
  actionDetails!: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ length: 36, nullable: true })
  performedBy!: string | null;

  @Column({
    type: 'enum',
    enum: ['user', 'system', 'api', 'batch'],
    default: 'system',
  })
  performedByType!: string;

  @Column({ length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ length: 100, nullable: true })
  requestId!: string | null;

  @Column({ length: 100, nullable: true })
  correlationId!: string | null;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ default: false })
  gdprRelated!: boolean;

  @Column({ length: 36, nullable: true })
  dataSubjectId!: string | null;
}
