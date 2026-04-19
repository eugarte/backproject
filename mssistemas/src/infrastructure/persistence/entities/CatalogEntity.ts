import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CatalogValueEntity } from './CatalogValueEntity';

@Entity('catalogs')
export class CatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ default: false })
  allow_multiple!: boolean;

  @Column({ default: true })
  is_active!: boolean;

  @Column()
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => CatalogValueEntity, value => value.catalog, { cascade: true })
  values!: CatalogValueEntity[];
}
