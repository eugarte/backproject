# 🏗️ PROPUESTA DE IMPLEMENTACIÓN - Hostinger Managed Node.js
## Microservicio de Gestión de Clientes - msclientes

---

**Versión:** 2.1 - Managed Node.js Edition  
**Fecha:** Abril 2026  
**Autor:** Equipo de Arquitectura  
**Estado:** Propuesta Técnica - Hostinger Managed Node.js Optimized  
**Stack:** Node.js, TypeScript, MariaDB, Clean Architecture (Managed Node.js Compatible)

---

## 📋 CAMBIOS PRINCIPALES PARA MANAGED NODE.JS

### Resumen de Adaptaciones

| Componente | Original | Hostinger Managed | Riesgo |
|------------|----------|------------------|--------|
| **Database** | PostgreSQL 15 | **MariaDB 10.6** | Bajo - TypeORM compatible |
| **Cache** | Redis Cluster | **lru-cache local** | Medio - pérdida al reinicio |
| **Search** | Elasticsearch | **MySQL FULLTEXT** | Medio - menos features |
| **Queue** | RabbitMQ | **EventEmitter2** | Medio - no distribuido |
| **Jobs** | BullMQ | **node-cron** | Bajo - funcionalidad similar |
| **Process Mgr** | PM2 | **Hostinger Managed** | Bajo - ellos lo manejan |
| **Deploy** | SSH + Git | **Panel/Git/ZIP** | Bajo - más simple |

---

## 1. VISIÓN GENERAL

### 1.1 Objetivos Managed Node.js
- ✅ Implementar msclientes en Hostinger Business Plan
- ✅ Stack 100% Node.js sin dependencias externas
- ✅ **Zero server management** (Hostinger gestiona todo)
- ✅ Deploy simplificado vía Git o panel
- ✅ Fácil migración futura si crece

### 1.2 Arquitectura Simplificada (Managed)

```
┌─────────────────────────────────────────────────────────────────┐
│              HOSTINGER MANAGED NODE.JS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Node.js    │───▶│   lru-cache │    │   MariaDB 10.6      │  │
│  │  Express    │    │   (memory)  │    │   (Hostinger DB)    │  │
│  │  (Managed)  │    └─────────────┘    └─────────────────────┘  │
│  └─────────────┘         │                                       │
│       │                  │                                       │
│       ▼                  ▼                                       │
│  ┌─────────────┐    ┌─────────────┐                              │
│  │EventEmitter2│    │ node-cron   │                              │
│  │ (local)     │    │ (jobs)      │                              │
│  └─────────────┘    └─────────────┘                              │
│                                                                  │
│  [Hostinger gestiona: SSL, dominio, restart, logs, backups]     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  msseguridad     │
                    │  (otro app en    │
                    │   Hostinger)     │
                    └──────────────────┘
```

---

## 2. STACK TECNOLÓGICO MANAGED NODE.JS

### 2.1 Comparativa Original vs Managed

| Capa | Original | Managed | Justificación |
|------|----------|---------|---------------|
| **Runtime** | Node.js 20 | Node.js 20 | Hostinger lo configura |
| **Framework** | Express.js 4.x | Express.js 4.x | Mantener |
| **Database** | PostgreSQL 15 | **MariaDB 10.6** | Desde panel Hostinger |
| **ORM** | TypeORM 0.3.x | TypeORM 0.3.x | Soporta ambos |
| **Cache** | Redis 7 | **lru-cache 11.x** | Sin deps externas |
| **Search** | Elasticsearch 8 | **MySQL FULLTEXT** | Nativo en MariaDB |
| **Messaging** | RabbitMQ 3.x | **EventEmitter2 6.x** | Proceso local |
| **Jobs** | BullMQ 4.x | **node-cron 3.x** | Funciona en managed |
| **Validation** | class-validator 0.14 | class-validator 0.14 | Mantener |
| **Testing** | Jest 29.x | Jest 29.x | Mantener |
| **Logs** | Winston | **Winston (console)** | Hostinger captura stdout |
| **Process Mgr** | Kubernetes/PM2 | **Hostinger Managed** | Zero-config |
| **Deploy** | Docker/K8s | **Git/ZIP** | Simplificado |

### 2.2 Justificación de Cambios

#### PostgreSQL → MariaDB
- ✅ TypeORM soporta ambos con mismas entidades
- ✅ Crear DB desde panel Hostinger (hPanel)
- ✅ JSON support nativo (MariaDB 10.6+)

#### Redis → lru-cache
- ✅ Sin servicio externo que configurar
- ✅ 100% JavaScript
- ⚠️ Se pierde caché en reinicio (Hostinger reinicia automáticamente por updates)

#### PM2 → Hostinger Managed
- ✅ No configurar nada
- ✅ Auto-restart incluido
- ✅ Logs en panel
- ⚠️ Menos control granular

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLEAN ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│  INTERFACES LAYER                                                │
│  ├─ Controllers (Customer, Address, Document)                  │
│  ├─ Middlewares (Auth, Validation, RateLimit)                    │
│  └─ Routes (Express Router)                                    │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                             │
│  ├─ Services (CustomerService, ValidationService)              │
│  ├─ Use Cases (CreateCustomer, UpdateProfile)                  │
│  └─ DTOs                                                         │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                                    │
│  ├─ Entities (Customer, Address, Contact, Document)            │
│  ├─ Value Objects (Email, Phone, TaxId)                          │
│  └─ Domain Events (emit via EventEmitter2)                     │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                          │
│  ├─ Repositories (TypeORM + MariaDB)                           │
│  ├─ Cache (lru-cache adapter)                                  │
│  ├─ Search (MySQL FULLTEXT adapter)                            │
│  ├─ Messaging (EventEmitter2)                                  │
│  ├─ Jobs (node-cron scheduler)                                 │
│  └─ Storage (Local filesystem / temp)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Datos (Managed)

```
Cliente
   │ HTTPS Request + JWT
   ▼
┌─────────────────────┐
│ Hostinger Edge      │ (SSL, dominio)
│ (Auto-configured)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Node.js Managed     │
│ Express App         │
│ (Auto-restart)      │
└──────────┬──────────┘
           │
           ├──────────▶ MariaDB (panel config)
           │
           ├──────────▶ lru-cache (memory)
           │
           ├──────────▶ EventEmitter2 (local)
           │
           └──────────▶ Console logs (panel view)
```

---

## 4. MODELO DE DATOS - MariaDB

### 4.1 Configuración desde Panel Hostinger

**Pasos:**
1. hPanel → Databases → MySQL Databases
2. Create Database: `u123456789_msclientes`
3. Create User: `u123456789_msclientes` + password seguro
4. Grant All Privileges
5. Anotar: Host (generalmente `localhost`)

### 4.2 Adaptaciones PostgreSQL → MariaDB

| Tipo PostgreSQL | Tipo MariaDB | Entity TypeORM |
|-----------------|--------------|----------------|
| `uuid` | `char(36)` | `@PrimaryGeneratedColumn('uuid')` |
| `jsonb` | `json` | `@Column({ type: 'json' })` |
| `timestamptz` | `timestamp` | `@CreateDateColumn()` |
| `text[]` | `json` | `@Column({ type: 'json' })` |
| `decimal` | `decimal(15,2)` | `@Column({ type: 'decimal' })` |
| `boolean` | `tinyint(1)` | `@Column({ type: 'boolean' })` |

### 4.3 FULLTEXT para Búsqueda

```typescript
@Entity('customers')
@Index(['email'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  companyName: string;
}
```

**Migration:**
```typescript
export class AddFulltextIndex implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers 
      ADD FULLTEXT INDEX idx_customers_fulltext (first_name, last_name, company_name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP INDEX idx_customers_fulltext`);
  }
}
```

### 4.4 Repositorio de Búsqueda

```typescript
@Injectable()
export class CustomerSearchService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async search(query: string): Promise<Customer[]> {
    return this.customerRepo
      .createQueryBuilder('c')
      .where(`MATCH(c.firstName, c.lastName, c.companyName) AGAINST (:query IN BOOLEAN MODE)`, 
        { query: `${query}*` })
      .orWhere('c.email LIKE :email', { email: `%${query}%` })
      .getMany();
  }
}
```

---

## 5. IMPLEMENTACIÓN DE CACHÉ

### 5.1 lru-cache Adapter

```typescript
import { LRUCache } from 'lru-cache';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache: LRUCache<string, any>;

  constructor() {
    this.cache = new LRUCache({
      max: parseInt(process.env.CACHE_MAX_ITEMS || '5000'),
      ttl: parseInt(process.env.CACHE_TTL_SECONDS || '900') * 1000,
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
```

### 5.2 Uso en Repositorios

```typescript
@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
    private cache: CacheService,
  ) {}

  async findById(id: string): Promise<Customer | null> {
    const cacheKey = `customer:${id}`;
    
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) return cached;

    const customer = await this.repo.findOne({ where: { id } });
    
    if (customer) {
      await this.cache.set(cacheKey, customer, 300);
    }
    
    return customer;
  }
}
```

---

## 6. MENSAJERÍA CON EVENTEMITTER2

### 6.1 Event Bus Local

```typescript
import { EventEmitter2 } from 'eventemitter2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventBus {
  private emitter: EventEmitter2;

  constructor() {
    this.emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    });
  }

  emit(event: string, payload: any): void {
    this.emitter.emit(event, payload);
  }

  on(event: string, handler: (payload: any) => void): void {
    this.emitter.on(event, handler);
  }
}
```

### 6.2 Publicación de Eventos

```typescript
export class CreateCustomerUseCase {
  constructor(
    private customerRepo: CustomerRepository,
    private eventBus: EventBus,
  ) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    const customer = new Customer();
    const saved = await this.customerRepo.save(customer);

    this.eventBus.emit('customer.created', {
      customerId: saved.id,
      email: saved.email,
    });

    return saved;
  }
}
```

---

## 7. JOBS CON NODE-CRON

### 7.1 Scheduler Service

```typescript
import { CronJob } from 'cron';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class JobScheduler implements OnModuleInit {
  private jobs: Map<string, CronJob> = new Map();

  onModuleInit() {
    this.registerJobs();
  }

  private registerJobs(): void {
    this.addJob('session-cleanup', '0 2 * * *', async () => {
      await this.cleanupExpiredSessions();
    });

    this.addJob('segment-recalc', '0 * * * *', async () => {
      await this.recalculateSegments();
    });
  }

  addJob(name: string, cronTime: string, onTick: () => Promise<void>): void {
    const job = new CronJob(cronTime, async () => {
      try {
        console.log(`[${name}] Starting...`);
        await onTick();
        console.log(`[${name}] Completed`);
      } catch (error) {
        console.error(`[${name}] Failed:`, error);
      }
    });

    this.jobs.set(name, job);
    job.start();
  }
}
```

---

## 8. API REST

### 8.1 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/customers` | Crear cliente |
| GET | `/api/v1/customers` | Listar clientes |
| GET | `/api/v1/customers/:id` | Obtener cliente |
| PATCH | `/api/v1/customers/:id` | Actualizar cliente |
| DELETE | `/api/v1/customers/:id` | Eliminar cliente |
| GET | `/api/v1/customers/search?q=term` | Búsqueda FULLTEXT |
| POST | `/api/v1/customers/:id/addresses` | Agregar dirección |
| POST | `/api/v1/customers/:id/documents` | Subir documento |

---

## 9. PLAN DE IMPLEMENTACIÓN MANAGED NODE.JS

### 9.1 Roadmap (Simplificado)

| Fase | Duración | Entregable |
|------|----------|------------|
| **Fase 1** | 2 semanas | Setup, CRUD, MariaDB config |
| **Fase 2** | 1 semana | Direcciones, documentos |
| **Fase 3** | 1 semana | Búsqueda FULLTEXT |
| **Fase 4** | 1 semana | Jobs, eventos, deploy en Hostinger |

**Total:** 5 semanas (vs 7 en VPS, vs 12 original)

### 9.2 Configuración de Deploy

No PM2 necesario. Hostinger maneja el proceso.

```javascript
// package.json scripts
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "tsx watch src/main.ts",
    "db:migrate": "typeorm-ts-node-commonjs migration:run -d src/infrastructure/config/database.ts",
    "test": "jest"
  }
}
```

**Start command en panel Hostinger:**
```
node dist/main.js
```

---

## 10. MONITOREO EN HOSTINGER MANAGED

### 10.1 Herramientas Disponibles

| Métrica | Herramienta | Dónde |
|---------|-------------|-------|
| **Logs** | Console stdout | Panel Hostinger |
| **Uptime** | Hostinger dashboard | Panel |
| **Errores** | Hostinger logs | Panel → Node.js |
| **Externo** | UptimeRobot | SaaS gratuito |

### 10.2 Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const checks = {
      database: await this.checkDatabase(),
      memory: process.memoryUsage(),
    };

    return {
      status: checks.database ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
```

---

## ANEXOS

### A. package.json (Managed Node.js)

```json
{
  "name": "msclientes",
  "version": "2.1.0",
  "description": "Microservicio de clientes - Hostinger Managed Node.js",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "tsx watch src/main.ts",
    "db:migrate": "typeorm-ts-node-commonjs migration:run -d src/infrastructure/config/database.ts",
    "db:generate": "typeorm-ts-node-commonjs migration:generate -d src/infrastructure/config/database.ts",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cors": "^2.8.5",
    "cron": "^3.1.6",
    "dotenv": "^16.4.5",
    "eventemitter2": "^6.4.9",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "helmet": "^7.1.0",
    "lru-cache": "^11.0.0",
    "mysql2": "^3.9.3",
    "reflect-metadata": "^0.2.1",
    "typeorm": "^0.3.20",
    "uuid": "^9.0.1",
    "winston": "^3.12.0"
  },
  "devDependencies": {
    "@types/cron": "^2.0.1",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.30",
    "@types/uuid": "^9.0.8",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "tsx": "^4.7.1",
    "typescript": "^5.4.3"
  }
}
```

### B. Checklist Deploy Final (Managed)

- [ ] Crear Node.js app en hPanel
- [ ] Crear database MariaDB en hPanel
- [ ] Configurar variables de entorno en panel
- [ ] Conectar GitHub repo (o subir ZIP)
- [ ] Configurar start command: `node dist/main.js`
- [ ] Ejecutar migraciones
- [ ] Verificar logs en panel
- [ ] Probar endpoints críticos
- [ ] Configurar dominio personalizado (opcional)

### C. Variables de Entorno (Panel Hostinger)

```
NODE_ENV=production
PORT=3001 (o el asignado)

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=u123456789_msclientes
DB_PASSWORD=********
DB_DATABASE=u123456789_msclientes
DB_SYNC=false

CACHE_MAX_ITEMS=5000
CACHE_TTL_SECONDS=900

MSSEGURIDAD_URL=https://tu-msseguridad.hostinger.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx

LOG_LEVEL=info
```

---

**Documento preparado para Hostinger Managed Node.js**  
**Versión:** 2.1  
**Fecha:** Abril 2026  
**Estado:** Listo para implementación
