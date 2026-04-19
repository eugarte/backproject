import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('consent_records')
@Index(['customerId'])
@Index(['consentType'])
@Index(['grantedAt'])
export class ConsentRecordEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({ length: 50 })
  consentType!: string;

  @Column({ length: 20 })
  consentVersion!: string;

  @Column({ type: 'text' })
  consentText!: string;

  @Column()
  granted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  grantedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt!: Date | null;

  @Column({ length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ length: 36, nullable: true })
  proofDocumentId!: string | null;

  @Column({
    type: 'enum',
    enum: ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'],
  })
  legalBasis!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
