import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('addresses')
@Index(['customerId'])
@Index(['postalCode'])
@Index(['countryCode'])
export class AddressEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({
    type: 'enum',
    enum: ['billing', 'shipping', 'home', 'work', 'other'],
    default: 'home',
  })
  addressType!: string;

  @Column({ length: 255 })
  street!: string;

  @Column({ length: 20, nullable: true })
  streetNumber!: string | null;

  @Column({ length: 50, nullable: true })
  apartment!: string | null;

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 100, nullable: true })
  stateProvince!: string | null;

  @Column({ length: 20 })
  postalCode!: string;

  @Column({ length: 100 })
  country!: string;

  @Column({ length: 2 })
  countryCode!: string;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.addresses)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
