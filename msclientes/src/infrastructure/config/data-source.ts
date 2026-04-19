import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CustomerEntity } from '../persistence/entities/customer.entity';
import { AddressEntity } from '../persistence/entities/address.entity';
import { ContactEntity } from '../persistence/entities/contact.entity';
import { DocumentEntity } from '../persistence/entities/document.entity';
import { CustomerTagEntity } from '../persistence/entities/customer-tag.entity';
import { CustomerPreferenceEntity } from '../persistence/entities/customer-preference.entity';
import { CreditHistoryEntity } from '../persistence/entities/credit-history.entity';
import { AuditLogEntity } from '../persistence/entities/audit-log.entity';
import { ConsentRecordEntity } from '../persistence/entities/consent-record.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'msclientes',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    CustomerEntity,
    AddressEntity,
    ContactEntity,
    DocumentEntity,
    CustomerTagEntity,
    CustomerPreferenceEntity,
    CreditHistoryEntity,
    AuditLogEntity,
    ConsentRecordEntity,
  ],
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],
  subscribers: [],
});
