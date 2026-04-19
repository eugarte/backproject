import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('contacts')
@Index(['customerId'])
@Index(['contactType'])
@Index(['value'])
export class ContactEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({
    type: 'enum',
    enum: ['email', 'phone', 'mobile', 'fax', 'social_media', 'other'],
  })
  contactType!: string;

  @Column({ length: 255 })
  value!: string;

  @Column({ length: 100, nullable: true })
  label!: string | null;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verificationDate!: Date | null;

  @Column({ default: true })
  canContact!: boolean;

  @Column({ length: 100, nullable: true })
  contactSchedule!: string | null;

  @Column({ length: 50, nullable: true })
  timezone!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.contacts)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
