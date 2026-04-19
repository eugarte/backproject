import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryColumn('varchar', { length: 100 })
  id!: string;

  @Column('varchar', { length: 100 })
  @Index()
  recipientId!: string;

  @Column('varchar', { length: 20 })
  type!: string;

  @Column('varchar', { length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column('varchar', { length: 20 })
  priority!: string;

  @Column('varchar', { length: 20 })
  status!: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @Column('datetime', { nullable: true })
  scheduledAt?: Date;

  @Column('datetime', { nullable: true })
  deliveredAt?: Date;

  @Column('datetime', { nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
