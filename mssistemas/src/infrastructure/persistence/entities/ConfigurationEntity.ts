import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('configurations')
export class ConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  service_id!: string | null;

  @Column({ nullable: true })
  environment!: string | null;

  @Column()
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ default: 'string' })
  type!: string;

  @Column({ default: false })
  is_secret!: boolean;

  @Column({ default: false })
  is_encrypted!: boolean;

  @Column({ default: 1 })
  version!: number;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ type: 'simple-array', default: '' })
  tags!: string;

  @DeleteDateColumn()
  deleted_at!: Date | null;

  @Column()
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
