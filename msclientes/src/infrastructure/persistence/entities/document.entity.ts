import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('documents')
@Index(['customerId'])
@Index(['documentType'])
@Index(['expiryDate'])
@Index(['gdprCategory'])
export class DocumentEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({
    type: 'enum',
    enum: ['id_card', 'passport', 'tax_id', 'business_license', 'proof_of_address', 'contract', 'consent_form', 'other'],
  })
  documentType!: string;

  @Column({ length: 100, nullable: true })
  documentNumber!: string | null;

  @Column({ length: 100, nullable: true })
  issuingCountry!: string | null;

  @Column({ length: 200, nullable: true })
  issuingAuthority!: string | null;

  @Column({ type: 'date', nullable: true })
  issueDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  expiryDate!: Date | null;

  @Column({ length: 255 })
  fileName!: string;

  @Column({ length: 500 })
  filePath!: string;

  @Column({ type: 'bigint' })
  fileSize!: number;

  @Column({ length: 100 })
  mimeType!: string;

  @Column({ length: 64, nullable: true })
  checksum!: string | null;

  @Column({ length: 100, nullable: true })
  encryptionKeyId!: string | null;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ length: 100, nullable: true })
  verificationMethod!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationDate!: Date | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: ['identity', 'financial', 'sensitive', 'contractual', 'consent'],
    default: 'identity',
  })
  gdprCategory!: string;

  @Column({ type: 'date', nullable: true })
  retentionUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.documents)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
