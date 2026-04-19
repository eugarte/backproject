import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role } from './role';

@Entity('permissions')
@Index(['slug'], { unique: true })
@Index(['resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  resource!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ type: 'json', nullable: true })
  conditions!: Record<string, any> | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  // Helper method to check if conditions match
  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.conditions) return true;
    
    // Simple condition evaluation (can be expanded)
    for (const [key, value] of Object.entries(this.conditions)) {
      if (context[key] !== value) return false;
    }
    return true;
  }
}
