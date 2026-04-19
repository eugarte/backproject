import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogEntity } from './CatalogEntity';

@Entity('catalog_values')
export class CatalogValueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  catalog_id!: string;

  @Column()
  code!: string;

  @Column()
  label!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ nullable: true })
  color!: string | null;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ default: false })
  is_default!: boolean;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date | null;

  @ManyToOne(() => CatalogEntity, catalog => catalog.values)
  @JoinColumn({ name: 'catalog_id' })
  catalog!: CatalogEntity;
}
