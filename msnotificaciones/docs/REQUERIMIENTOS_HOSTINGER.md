# Microservicio de Notificaciones - Requerimientos para Hostinger Managed Node.js

## Adaptación para Hostinger Business Managed

Este documento detalla los requerimientos específicos y adaptaciones necesarias para desplegar el microservicio de notificaciones en el plan **Hostinger Business Managed**.

## Diferencias Clave vs VPS

| Aspecto | VPS (VPS Control Panel) | Business Managed |
|---------|-------------------------|------------------|
| Acceso SSH | ✅ Sí | ❌ No |
| Node.js | Instalación manual | Pre-instalado v18+ |
| Bases de Datos | Instalación manual | Base de datos separada (SaaS recomendado) |
| Message Broker (RabbitMQ) | Instalación manual | CloudAMQP (SaaS) |
| Redis | Instalación manual | Upstash/Redis Cloud (SaaS) |
| Deploy | SSH + PM2 | Panel de control + Git |
| Cron Jobs | crontab | Hostinger Cron Jobs (UI) |
| SSL | Manual (Let's Encrypt) | Automático |

## Stack Adaptado para Hostinger

### Core (Hostinger)
- **Node.js:** v18+ (gestionado por Hostinger)
- **Framework:** Express.js o Fastify
- **Lenguaje:** TypeScript (compilado a dist/)

### Bases de Datos (Externas/SaaS)

#### Opción A: PostgreSQL (Recomendada)
- **Proveedor:** Supabase (gratis hasta 500MB) o Railway ($5/mes)
- **Ventajas:** Postgres nativo, backups automáticos
- **Conexión:** URL de conexión en environment variables

#### Opción B: MySQL (si ya tienes en Hostinger)
- **Proveedor:** Hostinger MySQL Database (si está disponible en tu plan)
- **Nota:** Verificar si tu plan Business Managed incluye base de datos

### Message Queue & Cache (SaaS Obligatorio)

#### RabbitMQ → CloudAMQP
- **Plan recomendado:** Little Lemur (gratis, 1M messages/mes)
- **URL formato:** `amqps://user:pass@host/vhost`
- **Ventaja:** No requiere gestión de servidor

#### Redis → Upstash Redis
- **Plan recomendado:** Free (10,000 requests/día)
- **URL formato:** `rediss://default:pass@host:port`
- **Usos:** Rate limiting, session store, WebSocket pub/sub

### Proveedores de Notificaciones (APIs Externas)

| Canal | Proveedor | Costo Aprox |
|-------|-----------|-------------|
| Email | SendGrid | Gratis hasta 100/día, luego ~$15/mes |
| SMS | Twilio | Pay-per-use (~$0.0075/SMS US) |
| Push | Firebase (FCM) | Gratis |
| WebSocket | Infra propia | Solo costo de hosting |

## Estructura de Proyecto

```
msnotificaciones/
├── dist/                      # Código compilado (subir a Hostinger)
├── src/
│   ├── domain/
│   │   ├── entities/          # Notification, Template, Subscription
│   │   ├── repositories/      # Interfaces
│   │   └── events/            # Eventos de dominio
│   ├── application/
│   │   ├── use-cases/         # SendNotification, ScheduleNotification
│   │   ├── dtos/              # Data Transfer Objects
│   │   └── services/          # NotificationService
│   ├── infrastructure/
│   │   ├── persistence/       # TypeORM repositories
│   │   ├── queue/             # RabbitMQ/CloudAMQP adapter
│   │   ├── cache/             # Redis/Upstash adapter
│   │   ├── providers/         # SendGrid, Twilio, FCM
│   │   ├── websocket/         # Socket.io handlers
│   │   └── auth/              # JWT validation (msseguridad)
│   └── interfaces/
│       ├── http/              # Express controllers, routes
│       └── websocket/         # Socket.io connection handlers
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Variables de Entorno (Hostinger)

Configurar en el panel de Hostinger (Websites → [tu sitio] → Environment Variables):

```env
# Base de Datos
DATABASE_URL=postgresql://user:pass@host.supabase.co:5432/notificaciones

# Redis (Upstash)
REDIS_URL=rediss://default:password@host.upstash.io:6379

# RabbitMQ (CloudAMQP)
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost

# Proveedores de Notificaciones
SENDGRID_API_KEY=SG.xxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# JWT (msseguridad)
JWT_SECRET=your-jwt-secret-from-msseguridad
JWT_ISSUER=msseguridad
JWT_AUDIENCE=msnotificaciones

# WebSocket
WS_PORT=3000
WS_CORS_ORIGIN=https://tu-frontend.com

# App
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Configuración de Deploy en Hostinger

### Paso 1: Preparar el Proyecto

```bash
# Local
npm install
npm run build          # Genera dist/
npm test               # Verificar tests
```

### Paso 2: Subir a GitHub

```bash
git init
git add .
git commit -m "Initial: msnotificaciones microservice"
git push origin main
```

### Paso 3: Configurar en Hostinger Panel

1. **Websites → Create New Website** (si aún no existe)
2. **Git:** Configurar repositorio GitHub
   - Repository: `https://github.com/tuusuario/msnotificaciones`
   - Branch: `main`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `node dist/index.js`
5. **Environment Variables:** Pegar las variables del .env
6. **Deploy**

### Paso 4: Configurar Servicios Externos

1. **Supabase (PostgreSQL):**
   - Crear proyecto en supabase.com
   - Copiar Connection String (Settings → Database)
   - Ejecutar migraciones iniciales

2. **Upstash (Redis):**
   - Crear database en upstash.com
   - Copiar REDIS_URL (TLS recomendado)

3. **CloudAMQP (RabbitMQ):**
   - Crear instance en cloudamqp.com
   - Copiar AMQP URL

4. **SendGrid:**
   - Crear API Key en sendgrid.com
   - Verificar dominio (sender authentication)

5. **Twilio:**
   - Crear cuenta en twilio.com
   - Obtener Account SID, Auth Token, y comprar número

6. **Firebase:**
   - Crear proyecto en console.firebase.google.com
   - Descargar service account key (JSON)
   - Pegar como string en FIREBASE_SERVICE_ACCOUNT_KEY

## Arquitectura de Conexiones

```
┌─────────────────────────────────────────────────────────────┐
│                  Hostinger Managed Node.js                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           msnotificaciones (Node.js)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐    │   │
│  │  │ REST API   │  │ WebSocket  │  │ Queue Worker│    │   │
│  │  │  (Express) │  │ (Socket.io)│  │  (BullMQ)   │    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘    │   │
│  └────────┼───────────────┼─────────────────┼──────────┘   │
└───────────┼───────────────┼─────────────────┼──────────────┘
            │               │                 │
            ▼               ▼                 ▼
    ┌──────────────┐  ┌──────────┐     ┌───────────────┐
    │ Supabase     │  │ Upstash  │     │ CloudAMQP     │
    │ PostgreSQL   │  │ Redis    │     │ RabbitMQ      │
    └──────────────┘  └──────────┘     └───────────────┘
            │
            ▼
    ┌──────────────┐
    │ SendGrid     │
    │ Twilio       │
    │ FCM          │
    └──────────────┘
```

## Adaptaciones de Código para Hostinger

### 1. Database Connection (TypeORM)

```typescript
// src/infrastructure/persistence/config/data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // Requerido para Supabase
  synchronize: false,  // Usar migraciones en producción
  logging: process.env.NODE_ENV === 'development',
  entities: ['dist/infrastructure/persistence/entities/*.js'],
  migrations: ['dist/infrastructure/persistence/migrations/*.js'],
});
```

### 2. Redis Connection (Upstash)

```typescript
// src/infrastructure/cache/redis-client.ts
import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },  // Para rediss://
  retryStrategy: (times) => Math.min(times * 50, 2000),
});
```

### 3. RabbitMQ Connection (CloudAMQP)

```typescript
// src/infrastructure/queue/rabbitmq-client.ts
import amqp from 'amqplib';

export async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();
  
  // Declarar exchanges y queues
  await channel.assertExchange('notifications.direct', 'direct', { durable: true });
  await channel.assertQueue('email.queue', { durable: true });
  await channel.assertQueue('push.queue', { durable: true });
  await channel.assertQueue('sms.queue', { durable: true });
  
  return { connection, channel };
}
```

### 4. Entry Point (index.ts)

```typescript
// src/index.ts
import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AppDataSource } from './infrastructure/persistence/config/data-source';
import { redisClient } from './infrastructure/cache/redis-client';
import { connectRabbitMQ } from './infrastructure/queue/rabbitmq-client';
import { setupRoutes } from './interfaces/http/routes';
import { setupWebSocketHandlers } from './interfaces/websocket/handlers';

async function bootstrap() {
  // 1. Database
  await AppDataSource.initialize();
  console.log('Database connected');
  
  // 2. Redis
  await redisClient.ping();
  console.log('Redis connected');
  
  // 3. RabbitMQ
  const { channel } = await connectRabbitMQ();
  console.log('RabbitMQ connected');
  
  // 4. Express
  const app = express();
  app.use(express.json());
  setupRoutes(app);
  
  // 5. WebSocket
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.WS_CORS_ORIGIN || '*' },
    adapter: require('socket.io-redis')({  // Para múltiples workers
      pubClient: redisClient,
      subClient: redisClient.duplicate(),
    }),
  });
  setupWebSocketHandlers(io, channel);
  
  // 6. Start
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch(console.error);
```

## Cron Jobs (Hostinger)

Configurar en Hostinger Panel → Advanced → Cron Jobs:

| Tarea | Comando | Frecuencia |
|-------|---------|------------|
| Retry failed notifications | `curl -X POST https://tu-api.com/api/v1/notifications/retry-failed` | Cada 5 minutos |
| Cleanup old notifications | `curl -X DELETE https://tu-api.com/api/v1/admin/cleanup-old` | Diario a las 3 AM |
| Generate daily analytics | `curl -X POST https://tu-api.com/api/v1/analytics/generate-daily` | Diario a las 1 AM |
| Sync device tokens | `curl -X POST https://tu-api.com/api/v1/subscriptions/refresh-expired` | Semanal |

## Costos Estimados Mensuales (Hostinger + Externos)

| Servicio | Plan | Costo |
|----------|------|-------|
| Hostinger Business | Plan actual | Ya incluido |
| Supabase PostgreSQL | Free Tier | $0 |
| Upstash Redis | Free Tier | $0 |
| CloudAMQP RabbitMQ | Little Lemur | $0 |
| SendGrid | Essentials 100/día | $0-$15 |
| Twilio SMS | Pay-per-use | Variable |
| Firebase FCM | Spark (gratis) | $0 |
| **Total (estimado)** | | **$0-$15/mes** |

## Próximos Pasos para Implementación

1. **Crear repositorio GitHub:** `msnotificaciones`
2. **Configurar servicios SaaS:** Supabase, Upstash, CloudAMQP
3. **Implementar Fase 1:** Core infrastructure
4. **Deploy inicial:** En Hostinger
5. **Integrar con msseguridad:** JWT validation
6. **Test end-to-end:** Email + WebSocket

## Referencias

- [Hostinger Node.js Hosting Guide](https://www.hostinger.com/tutorials/how-to-host-a-node-js-app)
- [Supabase Docs](https://supabase.com/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [CloudAMQP Docs](https://www.cloudamqp.com/docs/)
- [SendGrid Node.js](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [Twilio Node.js](https://www.twilio.com/docs/libraries/node)
- [Firebase Admin Node.js](https://firebase.google.com/docs/admin/setup)
