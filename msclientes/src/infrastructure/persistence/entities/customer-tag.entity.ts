import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('customer_tags')
@Index(['customerId'])
@Index(['tagName'])
export class CustomerTagEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({ length: 50 })
  tagName!: string;

  @Column({ length: 100, nullable: true })
  tagValue!: string | null;

  @Column({ length: 50, nullable: true })
  tagCategory!: string | null;

  @Column({ length: 7, nullable: true })
  color!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.tags)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
