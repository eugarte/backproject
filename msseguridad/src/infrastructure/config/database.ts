import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { logger } from '../services/logger';
import {
  User,
  Role,
  Permission,
  RefreshToken,
  UserSession,
  AuditLog,
} from '../../domain/entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'msseg_user',
  password: process.env.DB_PASSWORD || 'msseg_pass_2024',
  database: process.env.DB_DATABASE || 'msseguridad',
  
  // TypeORM configuration
  synchronize: process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  
  // Connection pool
  extra: {
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
  },
  
  // Entity and migration paths
  entities: [User, Role, Permission, RefreshToken, UserSession, AuditLog],
  migrations: [__dirname + '/../database/migrations/*.ts'],
  migrationsRun: false,
  
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
  } : false,
});

// Initialize database with retry logic
export async function initializeDatabase(retries = 5, delay = 5000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await AppDataSource.initialize();
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${i + 1}/${retries} failed`, { error });
      
      if (i < retries - 1) {
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error('Failed to connect to database after multiple retries');
      }
    }
  }
}
