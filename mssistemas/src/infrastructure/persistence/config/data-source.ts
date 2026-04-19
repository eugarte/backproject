import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { seedCatalogs } from '../../database/seeds/CatalogSeeds';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mssistemas',
  entities: [
    __dirname + '/../entities/*.ts'
  ],
  migrations: [
    __dirname + '/../migrations/*.ts'
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Run seeds
    await seedCatalogs(AppDataSource);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};