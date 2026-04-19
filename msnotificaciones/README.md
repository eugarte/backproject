# msnotificaciones - Microservicio de Notificaciones

Microservicio de notificaciones con soporte para Email (SendGrid), SMS (Twilio), Push (Firebase), In-App + WebSocket. Implementado con Clean Architecture, BullMQ para colas, y Socket.io para real-time.

## Características

- **Canales de Notificación**: Email, SMS, Push, In-App
- **Queue System**: BullMQ con Redis para procesamiento asíncrono
- **Real-time**: WebSocket con Socket.io
- **Clean Architecture**: Domain, Application, Infrastructure, Interfaces
- **Integración mssistemas**: Catálogos centralizados, auto-registro y heartbeat

## Estructura

```
src/
├── domain/           # Entidades, enums, repositorios
├── application/      # Casos de uso, DTOs
├── infrastructure/ # DB, Queue, Providers, WebSocket, SystemClient
└── interfaces/       # HTTP routes y controllers
```

## Setup

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (copiar .env.example a .env):
```bash
cp .env.example .env
```

3. Configurar la base de datos MySQL y Redis

4. Iniciar el servidor:
```bash
npm run dev
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3003 |
| DB_HOST | Host de MySQL | localhost |
| DB_PORT | Puerto de MySQL | 3306 |
| DB_DATABASE | Nombre de la base de datos | msnotificaciones |
| REDIS_HOST | Host de Redis | localhost |
| REDIS_PORT | Puerto de Redis | 6379 |
| SENDGRID_API_KEY | API key de SendGrid | - |
| TWILIO_ACCOUNT_SID | Account SID de Twilio | - |
| TWILIO_AUTH_TOKEN | Auth Token de Twilio | - |
| FIREBASE_PROJECT_ID | Project ID de Firebase | - |
| MSSISTEMAS_URL | URL de mssistemas | http://localhost:3001 |
| MSSISTEMAS_API_KEY | API key de mssistemas | - |
| SERVICE_NAME | Nombre del servicio | msnotificaciones |
| SERVICE_VERSION | Versión del servicio | 1.0.0 |
| HEARTBEAT_INTERVAL_MS | Intervalo de heartbeat | 30000 |

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/v1/notifications | Crear notificación |
| GET | /api/v1/notifications | Listar notificaciones |
| GET | /api/v1/notifications/:id | Obtener notificación |
| PATCH | /api/v1/notifications/:id/read | Marcar como leída |
| PATCH | /api/v1/notifications/read-all | Marcar todas como leídas |
| GET | /api/v1/health | Health check |

## WebSocket Events

| Evento | Descripción |
|--------|-------------|
| notification:new | Nueva notificación recibida |
| notification:delivered | Notificación entregada |
| register | Registrar cliente con userId |

## Scripts

- `npm run build` - Compilar TypeScript
- `npm run dev` - Iniciar en modo desarrollo
- `npm start` - Iniciar en modo producción
- `npm test` - Ejecutar tests

## Integración mssistemas

Este microservicio se integra con mssistemas para:
- Catálogos centralizados (notification_types, priority_levels, delivery_status)
- Configuraciones centralizadas
- Feature flags
- Auto-registro y heartbeat
