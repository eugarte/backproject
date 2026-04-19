import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('customer_preferences')
@Index(['customerId'])
@Index(['preferenceCategory', 'preferenceKey'])
@Unique(['customerId', 'preferenceCategory', 'preferenceKey'])
export class CustomerPreferenceEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({ length: 50, name: 'preferenceCategory' })
  preferenceCategory!: string;

  @Column({ length: 100, name: 'preferenceKey' })
  preferenceKey!: string;

  @Column({ type: 'text', nullable: true, name: 'preferenceValue' })
  preferenceValue!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.preferences)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
