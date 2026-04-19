import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('feature_flags')
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ default: 'simple' })
  strategy!: string;

  @Column({ nullable: true })
  percentage!: number | null;

  @Column({ type: 'simple-array', default: '' })
  target_users!: string;

  @Column({ type: 'simple-array', default: '' })
  target_groups!: string;

  @Column({ nullable: true })
  schedule_start!: Date | null;

  @Column({ nullable: true })
  schedule_end!: Date | null;

  @Column()
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
