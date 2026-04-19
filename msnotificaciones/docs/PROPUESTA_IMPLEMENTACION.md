# Propuesta de Implementación - msnotificaciones

## Resumen Ejecutivo

Este documento detalla la propuesta de implementación del microservicio de notificaciones (**msnotificaciones**) siguiendo Clean Architecture, arquitectura event-driven con colas, y soporte multi-canal (email, SMS, push, in-app, WebSocket).

**Alcance:** Implementación completa del microservicio en 7 semanas.  
**Stack:** Node.js, TypeScript, PostgreSQL (Supabase), Redis (Upstash), RabbitMQ (CloudAMQP), Socket.io.  
**Deploy:** Hostinger Business Managed Node.js + servicios SaaS externos.

---

## 1. Arquitectura General

### 1.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTENDS                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │   Web    │  │  Mobile  │  │ Desktop  │  │  Admin   │                      │
│  │ (React)  │  │(iOS/And) │  │ (Elect)  │  │  Panel   │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼─────────────┼─────────────┼─────────────┼────────────────────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         msnotificaciones (Node.js)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      INTERFACES LAYER                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ REST API     │  │ WebSocket    │  │ Webhook      │              │   │
│  │  │ (Express)    │  │ (Socket.io)  │  │ Handlers     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   APPLICATION LAYER                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Send         │  │ Schedule     │  │ Template     │              │   │
│  │  │ Notification │  │ Notification │  │ Management   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Retry        │  │ User         │  │ Analytics    │              │   │
│  │  │ Logic        │  │ Preferences  │  │ Service      │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INFRASTRUCTURE LAYER                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ PostgreSQL   │  │ Redis Cache  │  │ RabbitMQ     │              │   │
│  │  │ (Supabase)   │  │ (Upstash)    │  │ (CloudAMQP)  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ SendGrid     │  │ Twilio       │  │ Firebase     │              │   │
│  │  │ Provider     │  │ Provider     │  │ Provider     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DOMAIN LAYER                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Notification │  │ Template     │  │ Subscription │              │   │
│  │  │ Entity       │  │ Entity       │  │ Entity       │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Domain       │  │ Repository   │  │ Event        │              │   │
│  │  │ Events       │  │ Interfaces   │  │ Publisher    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Envío de Notificación

```
1. Cliente          POST /api/v1/notifications
       │                    │
       ▼                    ▼
2. Controller    ──▶  Validación + Auth (JWT)
       │                    │
       ▼                    ▼
3. Use Case      ──▶  Crear Notification entity
       │                    │
       ▼                    ▼
4. Repository    ──▶  Persistir en PostgreSQL
       │                    │
       ▼                    ▼
5. Event Emitter ──▶  Publish "NotificationRequested"
       │                    │
       ▼                    ▼
6. Queue Worker  ──▶  BullMQ/RabbitMQ Consumer
       │                    │
       ▼                    ▼
7. Provider      ──▶  SendGrid/Twilio/FCM
       │                    │
       ▼                    ▼
8. Update Status ──▶  DB update + WebSocket emit
```

---

## 2. Stack Tecnológico

### 2.1 Core Framework
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime |
| TypeScript | 5.x | Lenguaje |
| Express.js | 4.x | HTTP Server |
| Socket.io | 4.x | WebSocket real-time |

### 2.2 Base de Datos & Cache
| Tecnología | Proveedor | Propósito |
|------------|-----------|-----------|
| PostgreSQL | Supabase | Datos persistentes |
| TypeORM | - | ORM |
| Redis | Upstash | Cache + Session store |
| BullMQ | Redis | Job queues |

### 2.3 Message Broker
| Tecnología | Proveedor | Propósito |
|------------|-----------|-----------|
| RabbitMQ | CloudAMQP | Event-driven async |
| amqplib | - | Cliente Node.js |

### 2.4 Proveedores de Notificaciones
| Canal | Librería | Proveedor |
|-------|----------|-----------|
| Email | @sendgrid/mail | SendGrid |
| SMS | twilio | Twilio |
| Push | firebase-admin | Firebase (FCM/APNs) |

### 2.5 Testing & DevOps
| Tecnología | Propósito |
|------------|-----------|
| Jest | Testing framework |
| Supertest | HTTP testing |
| ESLint + Prettier | Linting |
| Winston | Logging |
| Prometheus + Grafana | Metrics |

---

## 3. Estructura de Carpetas (Clean Architecture)

```
msnotificaciones/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Notification.ts
│   │   │   ├── Template.ts
│   │   │   ├── Subscription.ts
│   │   │   ├── UserPreference.ts
│   │   │   └── DeliveryReceipt.ts
│   │   ├── repositories/
│   │   │   ├── INotificationRepository.ts
│   │   │   ├── ITemplateRepository.ts
│   │   │   └── ISubscriptionRepository.ts
│   │   ├── events/
│   │   │   ├── NotificationRequestedEvent.ts
│   │   │   ├── NotificationSentEvent.ts
│   │   │   └── NotificationFailedEvent.ts
│   │   └── services/
│   │       └── INotificationProvider.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── SendNotificationUseCase.ts
│   │   │   ├── ScheduleNotificationUseCase.ts
│   │   │   ├── CreateTemplateUseCase.ts
│   │   │   ├── UpdateUserPreferencesUseCase.ts
│   │   │   └── GetNotificationAnalyticsUseCase.ts
│   │   ├── dtos/
│   │   │   ├── SendNotificationDto.ts
│   │   │   ├── NotificationResponseDto.ts
│   │   │   └── TemplateDto.ts
│   │   └── services/
│   │       └── NotificationSchedulerService.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── config/
│   │   │   │   └── data-source.ts
│   │   │   ├── entities/
│   │   │   │   ├── NotificationEntity.ts
│   │   │   │   └── TemplateEntity.ts
│   │   │   └── repositories/
│   │   │       ├── NotificationRepository.ts
│   │   │       └── TemplateRepository.ts
│   │   ├── cache/
│   │   │   └── RedisClient.ts
│   │   ├── queue/
│   │   │   ├── RabbitMQClient.ts
│   │   │   ├── BullMQClient.ts
│   │   │   └── workers/
│   │   │       ├── EmailWorker.ts
│   │   │       ├── SMSWorker.ts
│   │   │       └── PushWorker.ts
│   │   ├── providers/
│   │   │   ├── SendGridProvider.ts
│   │   │   ├── TwilioProvider.ts
│   │   │   └── FirebaseProvider.ts
│   │   ├── auth/
│   │   │   └── JwtAuthService.ts
│   │   └── logging/
│   │       └── WinstonLogger.ts
│   │
│   └── interfaces/
│       ├── http/
│       │   ├── controllers/
│       │   │   ├── NotificationController.ts
│       │   │   ├── TemplateController.ts
│       │   │   └── SubscriptionController.ts
│       │   ├── middleware/
│       │   │   ├── AuthMiddleware.ts
│       │   │   ├── RateLimitMiddleware.ts
│       │   │   └── ValidationMiddleware.ts
│       │   └── routes/
│       │       ├── notificationRoutes.ts
│       │       ├── templateRoutes.ts
│       │       └── index.ts
│       └── websocket/
│           ├── WebSocketServer.ts
│           └── handlers/
│               ├── NotificationHandler.ts
│               └── ConnectionHandler.ts
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── integration/
│   └── setup.ts
│
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
├── .eslintrc.js
└── README.md
```

---

## 4. Roadmap de Implementación

### Fase 1: Fundamentos (Semana 1-2)

**Objetivo:** Setup del proyecto, infraestructura base, y core domain.

**Tareas:**
1. Crear estructura de carpetas Clean Architecture
2. Configurar TypeScript, ESLint, Prettier
3. Setup Jest para testing
4. Configurar Docker (local development)
5. Crear entidades de dominio:
   - Notification
   - Template
   - Subscription
6. Definir interfaces de repositorios
7. Implementar eventos de dominio
8. Configurar TypeORM + PostgreSQL local

**Entregables:**
- Proyecto base con estructura Clean Architecture
- Entidades de dominio testeadas
- Configuración de base de datos local

---

### Fase 2: API REST + WebSocket (Semana 3)

**Objetivo:** Endpoints HTTP y conexiones WebSocket funcionales.

**Tareas:**
1. Configurar Express.js
2. Implementar middleware de autenticación JWT (integración con msseguridad)
3. Implementar controllers:
   - NotificationController (CRUD + send)
   - TemplateController
   - SubscriptionController
4. Configurar Socket.io
5. Implementar handlers de WebSocket:
   - Connection management
   - Room/topic subscription
   - Real-time notification delivery
6. Implementar rate limiting con Redis

**Endpoints objetivo:**
- POST /api/v1/notifications
- GET /api/v1/notifications/:id
- GET /api/v1/notifications/user/:userId
- POST /api/v1/subscriptions
- WebSocket: connection, subscribe, unsubscribe

**Entregables:**
- API REST funcionando
- WebSocket server con rooms/topics
- Tests de integración para endpoints

---

### Fase 3: Canales de Notificación (Semana 4-5)

**Objetivo:** Implementar envío real por email, SMS y push.

**Tareas:**
1. **Email (SendGrid):**
   - Configurar SDK de SendGrid
   - Implementar SendGridProvider
   - Soporte para templates HTML
   - Attachments

2. **SMS (Twilio):**
   - Configurar SDK de Twilio
   - Implementar TwilioProvider
   - Soporte para concatenación de mensajes largos

3. **Push Notifications (FCM):**
   - Configurar Firebase Admin SDK
   - Implementar FirebaseProvider
   - Soporte para Android (FCM) e iOS (APNs via FCM)
   - Soporte para data messages y notification messages

4. **Sistema de Workers:**
   - Configurar BullMQ con Redis
   - Implementar EmailWorker
   - Implementar SMSWorker
   - Implementar PushWorker

5. **Circuit Breaker + Retry Logic:**
   - Implementar retry con exponential backoff
   - Circuit breaker para cada provider
   - Dead letter queue para fallos permanentes

**Entregables:**
- Envío de email, SMS y push funcionando
- Queue workers procesando jobs
- Circuit breaker implementado

---

### Fase 4: Features Avanzadas (Semana 6)

**Objetivo:** Templates, scheduling, preferencias, analytics.

**Tareas:**
1. **Template Engine:**
   - CRUD de templates
   - Variables dinámicas (Handlebars/similar)
   - Soporte multi-lenguaje

2. **Scheduled Notifications:**
   - Programar notificaciones para fecha futura
   - Cron jobs para procesar notificaciones pendientes

3. **User Preferences:**
   - Opt-in/opt-out por canal
   - Quiet hours
   - Frequency caps

4. **Bulk/Broadcast:**
   - Envío masivo a múltiples usuarios
   - Broadcast a topics

5. **In-App Notifications:**
   - Persistencia en DB
   - Marcar como leída
   - Badge counters

6. **Analytics:**
   - Contadores de enviadas/entregadas/abiertas
   - Dashboard endpoints

**Entregables:**
- Templates funcionando
- Scheduled notifications
- User preferences system
- Analytics básico

---

### Fase 5: Testing & Deploy (Semana 7)

**Objetivo:** Testing completo y configuración de producción.

**Tareas:**
1. **Unit Tests:**
   - Domain entities (>90% coverage)
   - Use cases (>80% coverage)
   - Infrastructure (>70% coverage)

2. **Integration Tests:**
   - API endpoints
   - WebSocket connections
   - Provider integrations (mocks)

3. **Load Testing:**
   - k6 para test de concurrencia
   - WebSocket connection limits

4. **Configuración de Producción:**
   - Variables de entorno para Hostinger
   - Configuración de SaaS externos:
     - Supabase (PostgreSQL)
     - Upstash (Redis)
     - CloudAMQP (RabbitMQ)
   - Scripts de migración

5. **Documentación:**
   - README con setup instructions
   - API documentation (Swagger/OpenAPI)
   - WebSocket protocol docs

**Entregables:**
- Tests >80% coverage
- Repo listo para deploy en Hostinger
- Documentación completa

---

## 5. Integración con msseguridad

### 5.1 Autenticación JWT

```typescript
// src/infrastructure/auth/JwtAuthService.ts
import { JwtAuthService as MsSeguridadJwt } from '../msseguridad-integration';

export class JwtAuthService {
  private msSeguridadClient: MsSeguridadJwt;
  
  constructor() {
    this.msSeguridadClient = new MsSeguridadJwt({
      secret: process.env.JWT_SECRET!,
      issuer: process.env.JWT_ISSUER!,
    });
  }
  
  async verifyToken(token: string): Promise<JwtPayload> {
    return this.msSeguridadClient.verify(token);
  }
}
```

### 5.2 Permisos Requeridos

| Permiso | Descripción |
|---------|-------------|
| `notifications:send` | Enviar notificaciones |
| `notifications:read` | Ver notificaciones propias |
| `notifications:admin` | Ver todas las notificaciones |
| `templates:manage` | CRUD de templates |
| `subscriptions:manage` | Gestionar suscripciones push |

---

## 6. Escalabilidad & Performance

### 6.1 Estrategias

| Estrategia | Implementación |
|------------|----------------|
| Horizontal Scaling | Stateles API, Redis para sesiones WebSocket |
| Queue Workers | Múltiples workers por tipo de canal |
| Database | Read replicas para analytics queries |
| Caching | Redis para templates y user preferences |
| Rate Limiting | Redis sliding window |

### 6.2 Targets de Performance

| Métrica | Target |
|---------|--------|
| Latency HTTP (P95) | < 100ms |
| Latency WebSocket | < 50ms |
| Throughput | 10,000 notifs/min |
| WebSocket Connections | 50,000 concurrent |
| Uptime | 99.9% |

---

## 7. Monitoreo & Observabilidad

### 7.1 Métricas Clave

```typescript
// Ejemplo de métricas Prometheus
notification_sent_total{channel="email"} 15420
notification_failed_total{channel="sms",reason="invalid_number"} 23
notification_latency_seconds_bucket{channel="push",le="0.1"} 9850
websocket_connections_active 3240
queue_depth{queue="email"} 45
```

### 7.2 Health Checks

```
GET /health       → 200 OK (servidor vivo)
GET /ready        → 200 OK (DB, Redis, RabbitMQ conectados)
GET /metrics      → Prometheus metrics
```

### 7.3 Alerting

| Alerta | Condición | Acción |
|--------|-----------|--------|
| High Failure Rate | > 5% fallos en 5min | Email + Slack |
| Queue Depth High | > 1000 jobs pendientes | Escalar workers |
| Provider Down | Circuit breaker open | Switch a backup |
| Low WS Connections | < 100 conectados (si debería haber más) | Check logs |

---

## 8. Seguridad & Compliance

### 8.1 Medidas de Seguridad

| Aspecto | Medida |
|---------|--------|
| Authentication | JWT validación desde msseguridad |
| Authorization | RBAC con permisos granulares |
| Rate Limiting | 100 req/min por IP, 1000 por usuario |
| Input Validation | Zod schemas para todos los endpoints |
| Encryption | TLS 1.3 para todas las conexiones |
| Secrets | Environment variables (nunca en código) |
| Audit Logs | Todas las operaciones de notificación logueadas |

### 8.2 GDPR Compliance

| Requerimiento | Implementación |
|---------------|----------------|
| Opt-in | Checkbox explícito para marketing |
| Opt-out | Unsubscribe link en emails + API endpoint |
| Data Export | GET /api/v1/user/:id/export (JSON de notificaciones) |
| Right to be Forgotten | DELETE /api/v1/user/:id/notifications (hard delete) |
| Data Retention | Auto-delete notificaciones > 1 año |

---

## 9. Costos Estimados

### 9.1 Infraestructura (Mensual)

| Servicio | Tier | Costo |
|----------|------|-------|
| Hostinger Business | Plan actual | Incluido |
| Supabase PostgreSQL | Free (500MB) | $0 |
| Upstash Redis | Free (10k req/día) | $0 |
| CloudAMQP | Little Lemur | $0 |
| SendGrid | Free (100/día) | $0-$15 |
| Twilio | Pay-per-use | Variable |
| Firebase FCM | Spark | $0 |
| **Total** | | **$0-$15/mes** |

### 9.2 Proyección de Escalamiento

| Volumen | Supabase | Upstash | SendGrid | **Total** |
|---------|----------|---------|----------|-----------|
| < 1k users | Free | Free | Free | $0 |
| < 10k users | Pro ($25) | Pro ($10) | Essentials ($15) | $50/mes |
| < 100k users | Pro ($25) | Pro ($10) | Pro ($90) | $125/mes |

---

## 10. Riesgos & Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Provider caído | Media | Alto | Circuit breaker + backup provider |
| Rate limits | Media | Medio | Exponential backoff + queue depth monitoring |
| DB performance | Baja | Alto | Read replicas, connection pooling |
| Memory leaks | Baja | Medio | Monitoring, restart automático |
| WebSocket scale | Media | Alto | Redis adapter, horizontal scaling |

---

## 11. Próximos Pasos Inmediatos

1. **Setup de Repositorio:**
   - Crear repo `msnotificaciones` en GitHub
   - Configurar branch protection
   - Setup GitHub Actions (CI básico)

2. **Configurar Servicios Externos:**
   - Crear cuenta en Supabase
   - Crear cuenta en Upstash
   - Crear cuenta en CloudAMQP
   - Setup SendGrid (verificar dominio)
   - Setup Twilio (comprar número)
   - Setup Firebase (crear proyecto)

3. **Iniciar Fase 1:**
   - Implementar estructura base
   - Domain entities
   - Local development environment

---

## 12. Conclusión

Esta propuesta establece un microservicio de notificaciones robusto, escalable y mantenible siguiendo las mejores prácticas de arquitectura moderna. El enfoque event-driven con colas asegura alta disponibilidad, mientras que el soporte multi-canal permite llegar a usuarios en cualquier plataforma.

El stack elegido (Node.js, TypeScript, PostgreSQL, Redis, RabbitMQ) es probado en producción y se integra perfectamente con el ecosistema de microservicios existente (msseguridad, msclientes).

**Timeline total:** 7 semanas  
**Costo inicial:** $0 (usando tiers gratuitos)  
**Escalabilidad:** Hasta 100k usuarios con costos controlados

---

**Aprobación:** ___________________  
**Fecha:** ___________________  
**Versión:** 1.0
