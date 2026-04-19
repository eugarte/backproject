import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('credit_history')
@Index(['customerId'])
@Index(['scoreDate'])
export class CreditHistoryEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 36 })
  customerId!: string;

  @Column({ length: 100 })
  creditBureau!: string;

  @Column({ type: 'int', nullable: true })
  score!: number | null;

  @Column({ type: 'date' })
  scoreDate!: Date;

  @Column({ length: 255, nullable: true })
  reportReference!: string | null;

  @Column({ type: 'json', nullable: true })
  reportData!: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'very_high'],
    nullable: true,
  })
  riskLevel!: string | null;

  @Column({ type: 'text', nullable: true })
  recommendations!: string | null;

  @Column({ length: 36, nullable: true })
  checkedBy!: string | null;

  @CreateDateColumn()
  checkedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.creditHistory)
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerEntity;
}
