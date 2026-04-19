# Microservicio de Notificaciones - Requerimientos

## Visión General

Microservicio centralizado para gestionar y enviar notificaciones multi-canal (email, SMS, push, in-app, WebSocket) a cualquier tipo de frontend (web, mobile, desktop). Soporta envío en tiempo real, programado, con prioridades y alta disponibilidad.

## Canales de Notificación

### 1. Email
- **Proveedores soportados:** SendGrid, AWS SES, SMTP genérico
- **Features:** Templates HTML/text, attachments, CC/BCC, tracking (open/click)
- **Rate limiting:** Configurable por dominio/destinatario

### 2. SMS
- **Proveedores soportados:** Twilio, Vonage (Nexmo), AWS SNS
- **Features:** Unicode support, concatenación de mensajes largos, delivery receipts
- **Compliance:** Opt-out handling automático

### 3. Push Notifications
- **Web Push:** Firebase Cloud Messaging (FCM), OneSignal, Safari Push
- **Mobile Push:** FCM (Android), APNs (iOS)
- **Features:** Rich media, actions buttons, deep linking, badges

### 4. In-App Notifications
- **Delivery:** API REST + WebSocket/SSE
- **Features:** Badge counters, categorización, persistencia, read receipts
- **UI Components:** Toast, banner, modal, inbox

### 5. WebSocket / Real-Time
- **Protocolos:** WebSocket, Server-Sent Events (SSE)
- **Use cases:** Chat, live updates, alerts críticas
- **Rooms/Topics:** Subscripción por usuario, grupo, o broadcast

## Arquitectura Requerida

### 1. Event-Driven Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│  Producers  │───▶│  Message    │───▶│  Consumers      │
│  (Services) │    │  Broker     │    │  (Workers)      │
└─────────────┘    │  (RabbitMQ) │    └─────────────────┘
                   └─────────────┘           │
                         │                  │
                   ┌─────▼──────┐    ┌─────▼──────┐
                   │  Email Q   │    │  Push Q    │
                   └────────────┘    └────────────┘
```

### 2. Clean Architecture Layers
- **Domain:** Entidades Notification, Template, DeliveryReceipt, Subscription
- **Application:** Use Cases (SendNotification, ScheduleNotification, CreateTemplate)
- **Infrastructure:** Providers (SendGrid, Twilio, FCM), Queues, Database
- **Interfaces:** REST API, WebSocket handlers, Admin Dashboard

### 3. Microservices Communication
- **Síncrono:** REST API para queries de estado
- **Asíncrono:** Event bus (RabbitMQ/Redis) para envío de notificaciones
- **Eventos:** NotificationRequested, NotificationSent, NotificationFailed, NotificationRead

## Funcionalidades Core

### 1. Envío de Notificaciones
- **Individual:** Un destinatario, un canal
- **Bulk:** Múltiples destinatarios (batch processing)
- **Broadcast:** Todos los usuarios de un grupo/topic
- **Programado:** Delayed delivery con timestamp

### 2. Templates
- **Variables:** Soporte para {{userName}}, {{orderId}}, etc.
- **Multi-lenguaje:** i18n support
- **Versioning:** Historial de cambios
- **A/B Testing:** Variantes de templates

### 3. Priorización
- **Niveles:** CRITICAL, HIGH, NORMAL, LOW
- **Queue priorities:** Canales separados por prioridad
- **Time-to-live:** Expiración de notificaciones baja prioridad

### 4. Retry Logic & Circuit Breaker
- **Retry:** Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Max retries:** 5 intentos por defecto
- **Dead Letter Queue:** Notificaciones fallidas permanentes
- **Circuit Breaker:** Pausar canal si error rate > 50%

### 5. User Preferences
- **Opt-in/Opt-out:** Por canal globalmente
- **Granular:** Por tipo de notificación (marketing vs transaccional)
- **Quiet hours:** No enviar en horarios configurados
- **Frequency caps:** Máximo X notificaciones por día

### 6. Analytics & Monitoring
- **Metrics:** Enviadas, entregadas, abiertas, clicks, falladas
- **Dashboard:** Visualización en tiempo real
- **Alerting:** Webhook cuando fall rate > threshold

## Modelo de Datos

### Tablas Principales

```sql
-- Notificaciones
notifications
- id (UUID)
- user_id (FK)
- type (email|sms|push|inapp|websocket)
- channel_provider (sendgrid|twilio|fcm)
- status (pending|sent|delivered|failed|read)
- priority (critical|high|normal|low)
- template_id (FK, nullable)
- subject, content, content_html
- metadata (JSON: links, attachments, actions)
- scheduled_at, sent_at, delivered_at, read_at
- retry_count, max_retries
- error_message
- created_at, updated_at

-- Templates
templates
- id (UUID)
- name, description
- type (email|sms|push)
- subject_template
- content_template, content_html_template
- variables (JSON schema)
- version, is_active
- created_at, updated_at

-- Suscripciones Push
push_subscriptions
- id (UUID)
- user_id (FK)
- device_type (web|ios|android)
- device_token / subscription_json (FCM/APNs/WebPush)
- browser, os_version
- is_active, unsubscribed_at
- created_at, updated_at

-- Preferencias de Usuario
user_preferences
- id (UUID)
- user_id (FK)
- channel (email|sms|push|inapp)
- notification_type (marketing|transactional|system)
- is_enabled
- quiet_hours_start, quiet_hours_end
- frequency_cap_per_day
- updated_at

-- Delivery Receipts
delivery_receipts
- id (UUID)
- notification_id (FK)
- provider_message_id
- status (sent|delivered|opened|clicked|bounced|failed)
- provider_response (JSON)
- timestamp
- ip_address, user_agent (para email/web)

-- Topics/Rooms (para WebSocket)
topics
- id (UUID)
- name, description
- type (broadcast|group|user_specific)
- created_at

-- Suscripciones a Topics
topic_subscriptions
- id (UUID)
- user_id (FK)
- topic_id (FK)
- joined_at
```

## API Endpoints

### REST API

```
POST   /api/v1/notifications              # Enviar notificación
POST   /api/v1/notifications/bulk           # Envío masivo
POST   /api/v1/notifications/schedule      # Programar notificación
DELETE /api/v1/notifications/:id/schedule   # Cancelar programada

GET    /api/v1/notifications/:id          # Obtener estado
GET    /api/v1/notifications/user/:userId  # Historial del usuario
PATCH  /api/v1/notifications/:id/read      # Marcar como leída

# Templates
POST   /api/v1/templates                   # Crear template
GET    /api/v1/templates                   # Listar templates
GET    /api/v1/templates/:id               # Obtener template
PUT    /api/v1/templates/:id               # Actualizar template
DELETE /api/v1/templates/:id               # Eliminar template

# User Preferences
GET    /api/v1/preferences/:userId         # Obtener preferencias
PUT    /api/v1/preferences/:userId          # Actualizar preferencias
POST   /api/v1/preferences/:userId/unsubscribe  # Opt-out global

# Subscriptions (Push)
POST   /api/v1/subscriptions               # Registrar dispositivo
DELETE /api/v1/subscriptions/:id            # Eliminar suscripción
PUT    /api/v1/subscriptions/:id/refresh    # Refrescar token

# Analytics
GET    /api/v1/analytics/dashboard          # Dashboard resumen
GET    /api/v1/analytics/delivery-rate      # Tasa de entrega
GET    /api/v1/analytics/channel-stats      # Stats por canal

# WebSocket Topics
POST   /api/v1/topics                      # Crear topic
GET    /api/v1/topics                      # Listar topics
POST   /api/v1/topics/:id/subscribe        # Suscribir usuario
POST   /api/v1/topics/:id/unsubscribe      # Desuscribir usuario
POST   /api/v1/topics/:id/broadcast        # Enviar a topic
```

### WebSocket Events

```
Client -> Server:
- subscribe { topic: "orders.123" }
- unsubscribe { topic: "orders.123" }
- notification_read { notificationId }
- ping

Server -> Client:
- notification { id, type, title, body, data, timestamp }
- notification_updated { id, status, timestamp }
- topic_message { topic, payload }
- pong
```

## Integración con Frontends

### Web Application
- **Service Worker:** Para push notifications en background
- **SSE Connection:** Para in-app notifications en tiempo real
- **Notification API:** Para mostrar notificaciones del sistema
- **Permissions API:** Para gestionar permisos del usuario

### Mobile Apps (iOS/Android)
- **FCM SDK:** Para Android push notifications
- **APNs:** Para iOS push notifications
- **Deep Links:** Para navegación desde notificaciones
- **Badge API:** Para contador de notificaciones no leídas

### Desktop Apps
- **Electron/Native:** WebSocket para real-time + Notification API del OS
- **System Tray:** Indicadores de notificaciones

## Tecnología Stack

### Core
- **Runtime:** Node.js 20+
- **Framework:** Express.js o Fastify
- **Lenguaje:** TypeScript

### Database & Cache
- **Primary:** PostgreSQL 15+ (notificaciones persistentes)
- **Cache:** Redis (subscriptions, rate limiting, session store)
- **Queue:** RabbitMQ o BullMQ con Redis (job processing)

### Real-Time
- **WebSocket:** Socket.io o ws (library)
- **SSE:** EventSource nativo

### Providers (configurables)
- **Email:** SendGrid SDK, Nodemailer (SMTP)
- **SMS:** Twilio SDK
- **Push:** Firebase Admin SDK (FCM), node-apn (APNs)

### DevOps & Observability
- **Logs:** Winston/Pino
- **Metrics:** Prometheus + Grafana
- **Tracing:** OpenTelemetry
- **Health Checks:** /health, /ready, /live

### Seguridad
- **JWT:** Validación de tokens (msseguridad)
- **Rate Limiting:** Redis-based (express-rate-limit)
- **Input Validation:** Zod o class-validator
- **Encryption:** AES para datos sensibles en reposo

## Requerimientos No-Funcionales

### Performance
- Throughput: 10,000+ notificaciones/minuto
- Latencia P95: < 100ms para WebSocket, < 500ms para email
- WebSocket concurrent connections: 50,000+

### Disponibilidad
- SLA: 99.9% uptime
- Retry automático para notificaciones fallidas
- Circuit breaker para providers externos

### Escalabilidad
- Horizontal scaling con load balancer
- Workers separados por canal de notificación
- Database read replicas para queries analíticas

### Compliance
- GDPR: Eliminación de datos de notificación bajo request
- Opt-in explícito para marketing
- Unsubscribe links automáticos en emails
- Data retention policies configurables

## Roadmap de Implementación

### Fase 1: Core Infrastructure (2 semanas)
- Setup proyecto con Clean Architecture
- Configuración de RabbitMQ + Redis
- Modelos de datos + migraciones
- REST API base + health checks

### Fase 2: Canales Básicos (2 semanas)
- Email (SendGrid)
- In-App notifications
- WebSocket real-time
- Templates básicos

### Fase 3: Canales Adicionales (2 semanas)
- SMS (Twilio)
- Push notifications (FCM + APNs)
- Device registration
- User preferences

### Fase 4: Resiliencia & Features Avanzadas (2 semanas)
- Retry logic + Circuit breaker
- Scheduled notifications
- Bulk/Broadcast envío
- Analytics dashboard

### Fase 5: Testing & Optimización (1 semana)
- Tests unitarios (>80% coverage)
- Integration tests
- Load testing (k6/Artillery)
- Documentation

## Consideraciones de Hostinger (Managed Node.js)

Para deploy en Hostinger Business Managed:
- RabbitMQ: Usar CloudAMQP o similar (SaaS)
- Redis: Usar Redis Cloud o similar (SaaS)
- PostgreSQL: Usar Hostinger Database o Railway/Supabase
- WebSocket: Funciona en Node.js de Hostinger (no requiere configuración especial)
- Cron jobs: Usar Hostinger Cron Jobs para tareas programadas

**Costos estimados SaaS externos:**
- RabbitMQ (CloudAMQP): $0-10/mes (tier básico)
- Redis (Upstash): $0-10/mes
- PostgreSQL (Supabase): $0-25/mes
