import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { NotificationEntity } from '../entities/NotificationEntity';
import { NotificationTypeEntity } from '../entities/NotificationTypeEntity';
import { DeliveryStatusEntity } from '../entities/DeliveryStatusEntity';
import { PriorityLevelEntity } from '../entities/PriorityLevelEntity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'msnotificaciones',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [NotificationEntity, NotificationTypeEntity, DeliveryStatusEntity, PriorityLevelEntity],
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  subscribers: [],
});

export async function initializeDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
  }
}