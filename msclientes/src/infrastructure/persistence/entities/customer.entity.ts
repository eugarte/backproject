import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { AddressEntity } from './address.entity';
import { ContactEntity } from './contact.entity';
import { DocumentEntity } from './document.entity';
import { CustomerTagEntity } from './customer-tag.entity';
import { CustomerPreferenceEntity } from './customer-preference.entity';
import { CreditHistoryEntity } from './credit-history.entity';

@Entity('customers')
@Index(['email'])
@Index(['taxId'])
@Index(['status'])
@Index(['customerCode'])
@Index(['createdAt'])
@Index(['customVarchar'])
@Index(['customInt'])
@Index(['customDatetime'])
export class CustomerEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ unique: true, length: 50 })
  customerCode!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 255, nullable: true })
  email!: string | null;

  @Column({ length: 50, nullable: true })
  phone!: string | null;

  @Column({ length: 50, nullable: true })
  taxId!: string | null;

  @Column({ length: 20, nullable: true })
  taxIdType!: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date | null;

  @Column({ length: 20, nullable: true })
  gender!: string | null;

  @Column({ length: 50, nullable: true })
  nationality!: string | null;

  @Column({ length: 10, default: 'es' })
  preferredLanguage!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'anonymized'],
    default: 'active',
  })
  status!: string;

  @Column({
    type: 'enum',
    enum: ['individual', 'business'],
    default: 'individual',
  })
  customerType!: string;

  @Column({ length: 200, nullable: true })
  companyName!: string | null;

  @Column({ length: 100, nullable: true })
  industry!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue!: number | null;

  @Column({ type: 'int', nullable: true })
  employeeCount!: number | null;

  @Column({ type: 'int', nullable: true })
  creditScore!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditLimit!: number | null;

  @Column({ default: false })
  gdprConsent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  gdprConsentDate!: Date | null;

  @Column({ length: 20, nullable: true })
  gdprConsentVersion!: string | null;

  @Column({ default: false })
  marketingConsent!: boolean;

  @Column({ default: false })
  dataProcessingConsent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  anonymizedAt!: Date | null;

  @Column({ length: 255, nullable: true })
  anonymizedReason!: string | null;

  // ===== 8 CAMPOS PERSONALIZADOS FLEXIBLES =====
  @Column({ name: 'custom_varchar', length: 255, nullable: true })
  customVarchar!: string | null;

  @Column({ name: 'custom_int', type: 'int', nullable: true })
  customInt!: number | null;

  @Column({ name: 'custom_decimal', type: 'decimal', precision: 15, scale: 4, nullable: true })
  customDecimal!: number | null;

  @Column({ name: 'custom_datetime', type: 'datetime', nullable: true })
  customDatetime!: Date | null;

  @Column({ name: 'custom_bool', type: 'boolean', nullable: true })
  customBool!: boolean | null;

  @Column({ name: 'custom_text', type: 'text', nullable: true })
  customText!: string | null;

  @Column({ name: 'custom_json', type: 'json', nullable: true })
  customJson!: Record<string, unknown> | null;

  @Column({ name: 'custom_date', type: 'date', nullable: true })
  customDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ length: 36, nullable: true })
  createdBy!: string | null;

  @Column({ length: 36, nullable: true })
  updatedBy!: string | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @Column({ length: 36, nullable: true })
  deletedBy!: string | null;

  @OneToMany(() => AddressEntity, (address) => address.customer, { cascade: true })
  addresses!: AddressEntity[];

  @OneToMany(() => ContactEntity, (contact) => contact.customer, { cascade: true })
  contacts!: ContactEntity[];

  @OneToMany(() => DocumentEntity, (document) => document.customer, { cascade: true })
  documents!: DocumentEntity[];

  @OneToMany(() => CustomerTagEntity, (tag) => tag.customer, { cascade: true })
  tags!: CustomerTagEntity[];

  @OneToMany(() => CustomerPreferenceEntity, (pref) => pref.customer, { cascade: true })
  preferences!: CustomerPreferenceEntity[];

  @OneToMany(() => CreditHistoryEntity, (credit) => credit.customer, { cascade: true })
  creditHistory!: CreditHistoryEntity[];
}
