import { AppDataSource } from '../config/database';
import { seedDatabase } from './seeds/main.seed';
import { logger } from '../services/logger';

async function main() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established for seeding');

    // Run seeds
    await seedDatabase(AppDataSource);

    logger.info('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', { error });
    process.exit(1);
  }
}

main();
