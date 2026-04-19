import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ default: '1.0.0' })
  version!: string;

  @Column({ name: 'status_catalog_id', nullable: true })
  statusCatalogId!: string | null;

  @Column({ name: 'status_value', nullable: true })
  statusValue!: string | null;

  @Column({ name: 'team_owner', nullable: true })
  teamOwner!: string | null;

  @Column({ name: 'repository_url', nullable: true })
  repositoryUrl!: string | null;

  @Column({ name: 'documentation_url', nullable: true })
  documentationUrl!: string | null;

  @Column({ name: 'technology_stack', type: 'simple-array', default: '' })
  technologyStack!: string;

  @Column({ name: 'health_check_url', nullable: true })
  healthCheckUrl!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
