import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('secrets')
export class SecretEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  service_id!: string | null;

  @Column({ nullable: true })
  environment!: string | null;

  @Column()
  key!: string;

  @Column({ name: 'encrypted_value', type: 'text' })
  encryptedValue!: string;

  @Column({ name: 'encryption_version', default: 'v1' })
  encryptionVersion!: string;

  @Column({ name: 'is_rotating', default: false })
  isRotating!: boolean;

  @Column({ name: 'last_rotated_at', nullable: true })
  lastRotatedAt!: Date | null;

  @Column({ nullable: true })
  expires_at!: Date | null;

  @Column()
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
