# mssistemas

Microservicio de Catálogo y Configuración Centralizada

## Propósito

**mssistemas** es el registro centralizado y sistema de gestión de configuraciones para todo el ecosistema de microservicios. Actúa como fuente única de verdad para:

- 📋 **System Catalogs** - Catálogos de valores configurables (prioridad alta)
- 🗂️ Service Registry - Registro de microservicios
- ⚙️ Configuration Management - Configuraciones por entorno
- 🔐 Secrets Vault - Gestión segura de credenciales
- 🚩 Feature Flags - Control de características
- 💓 Health Monitoring - Monitoreo de servicios

### System Catalogs - El Diferenciador

A diferencia de enums hardcodeados, **mssistemas** permite definir **catálogos dinámicos**:

| Catálogo | Ejemplo de Valores | Usado por |
|----------|-------------------|-----------|
| `service_status` | activo, inactivo, suspendido, mantenimiento | Service Registry |
| `customer_type` | nuevo, regular, vip, moroso | msclientes |
| `notification_priority` | baja, media, alta, critica | msnotificaciones |
| `payment_status` | pendiente, completado, fallido | msbilling |

**Beneficio:** Agregar un nuevo estado no requiere redeploy del código.

## Stack Tecnológico

- **Runtime:** Node.js 18+, TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (TypeORM)
- **Cache:** Redis (Upstash)
- **Auth:** JWT (integración con msseguridad)
- **Encryption:** AES-256-GCM
- **Testing:** Jest

## Arquitectura (Clean Architecture)

```
src/
├── domain/
│   ├── entities/           # Entidades de negocio (Service, Catalog, etc.)
│   └── repositories/       # Interfaces de repositorios
├── application/
│   ├── use-cases/          # Casos de uso
│   │   ├── catalogs/       # CRUD de catálogos
│   │   ├── services/       # Service registry + heartbeats
│   │   ├── configurations/ # Gestión de configuraciones
│   │   ├── secrets/        # Secrets vault
│   │   ├── feature-flags/  # Feature flags
│   │   └── health/         # Health monitoring
│   └── dtos/               # Data Transfer Objects
├── infrastructure/
│   ├── persistence/        # TypeORM entities y repositories
│   ├── auth/               # JWT auth
│   ├── encryption/         # AES-256 encryption
│   ├── cache/              # Redis cache
│   └── logging/            # Winston logger
└── interfaces/http/
    ├── controllers/        # Express controllers
    ├── routes/             # API routes
    └── middleware/         # Auth, audit, error handling
```

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/eugarte/mssistemas.git
cd mssistemas

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar base de datos (PostgreSQL requerido)
# Asegúrate de tener PostgreSQL corriendo

# Ejecutar migraciones (si aplica)
npm run migration:run

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## Variables de Entorno

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/mssistemas

# JWT Configuration (msseguridad)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=msseguridad

# Encryption (32 bytes hex-encoded)
MASTER_KEY=your-32-byte-hex-key-for-aes-256

# Redis/Upstash
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

## API Endpoints

### System Catalogs (Catálogos Configurables)

```
GET    /api/v1/catalogs                    # Listar catálogos
GET    /api/v1/catalogs/:key               # Obtener catálogo por key
POST   /api/v1/catalogs                    # Crear catálogo
PUT    /api/v1/catalogs/:id                # Actualizar catálogo
DELETE /api/v1/catalogs/:id                # Eliminar catálogo

GET    /api/v1/catalogs/:id/values         # Listar valores
GET    /api/v1/catalogs/:key/values        # Listar valores por key (público)
POST   /api/v1/catalogs/:id/values         # Agregar valor
PUT    /api/v1/catalogs/values/:valueId    # Actualizar valor
DELETE /api/v1/catalogs/values/:valueId    # Eliminar valor
```

### Service Registry

```
POST   /api/v1/services                    # Registrar servicio
GET    /api/v1/services                    # Listar servicios
GET    /api/v1/services/:id                # Obtener servicio
GET    /api/v1/services/by-name/:name      # Buscar por nombre
PUT    /api/v1/services/:id                # Actualizar servicio
DELETE /api/v1/services/:id                # Eliminar servicio

POST   /api/v1/services/:id/heartbeat      # Enviar heartbeat
GET    /api/v1/services/:id/health         # Obtener health status
```

### Configuration Management

```
GET    /api/v1/configurations              # Listar configuraciones
GET    /api/v1/configurations/resolve      # Resolver (service + env + key)
GET    /api/v1/configurations/:id          # Obtener configuración
POST   /api/v1/configurations              # Crear configuración
PUT    /api/v1/configurations/:id          # Actualizar configuración
DELETE /api/v1/configurations/:id          # Eliminar configuración
GET    /api/v1/configurations/:id/history   # Ver historial
```

### Secrets Vault

```
GET    /api/v1/secrets                     # Listar secrets (metadata)
GET    /api/v1/secrets/:id                 # Obtener metadata
GET    /api/v1/secrets/:id/value           # Obtener valor desencriptado
POST   /api/v1/secrets                     # Crear secret
PUT    /api/v1/secrets/:id                 # Actualizar secret
POST   /api/v1/secrets/:id/rotate          # Rotar secret
DELETE /api/v1/secrets/:id                 # Eliminar secret
GET    /api/v1/secrets/:id/access-logs     # Ver logs de acceso
```

### Feature Flags

```
GET    /api/v1/feature-flags               # Listar flags
GET    /api/v1/feature-flags/:id           # Obtener flag
GET    /api/v1/feature-flags/by-key/:key   # Buscar por key
POST   /api/v1/feature-flags               # Crear flag
PUT    /api/v1/feature-flags/:id          # Actualizar flag
POST   /api/v1/feature-flags/:id/toggle    # Toggle ON/OFF
DELETE /api/v1/feature-flags/:id          # Eliminar flag

POST   /api/v1/feature-flags/:id/services  # Agregar service override
DELETE /api/v1/feature-flags/:id/services/:serviceId  # Eliminar override

POST   /api/v1/public/:key/evaluate         # Evaluar flag (público)
```

### Health & Dashboard

```
GET    /api/v1/health                       # Health check
GET    /api/v1/health/dashboard            # Dashboard status
POST   /api/v1/health/cleanup              # Limpiar heartbeats antiguos
```

## Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Cobertura
npm run test -- --coverage
```

## Ejemplos de Uso

### Crear un Catálogo (System Catalog)

```bash
curl -X POST http://localhost:3000/api/v1/catalogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "key": "service_status",
    "name": "Estado de Servicio",
    "description": "Estados posibles para microservicios"
  }'
```

### Agregar Valores al Catálogo

```bash
curl -X POST http://localhost:3000/api/v1/catalogs/{id}/values \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "active",
    "label": "Activo",
    "color": "#28a745",
    "sortOrder": 1
  }'
```

### Consumir Catálogo desde Otro Microservicio

```bash
# Obtener valores válidos (público)
curl http://localhost:3000/api/v1/catalogs/service_status/values
```

### Registrar un Servicio

```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "msnotificaciones",
    "displayName": "Microservicio de Notificaciones",
    "version": "1.0.0",
    "statusCatalogId": "catalog-id",
    "statusValue": "active",
    "endpoints": {
      "dev": "http://localhost:3003",
      "prod": "https://msnotificaciones.ejemplo.com"
    }
  }'
```

### Enviar Heartbeat

```bash
curl -X POST http://localhost:3000/api/v1/services/{id}/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "prod",
    "status": "up",
    "version": "1.0.0"
  }'
```

### Crear Configuración

```bash
curl -X POST http://localhost:3000/api/v1/configurations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "key": "database.poolSize",
    "value": "20",
    "type": "number",
    "serviceId": "service-id",
    "environment": "prod"
  }'
```

### Crear Secret

```bash
curl -X POST http://localhost:3000/api/v1/secrets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "key": "database.password",
    "value": "super-secret-password",
    "serviceId": "service-id",
    "environment": "prod"
  }'
```

### Crear Feature Flag

```bash
curl -X POST http://localhost:3000/api/v1/feature-flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "key": "new-checkout",
    "name": "Nuevo Checkout",
    "enabled": true,
    "strategy": "percentage",
    "percentage": 10
  }'
```

### Evaluar Feature Flag

```bash
curl -X POST http://localhost:3000/api/v1/public/new-checkout/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123"
  }'
```

## Modelo de Datos

### Tablas Principales

**catalogs**
- id (UUID PK)
- key (string, unique)
- name (string)
- description (text)
- allow_multiple (boolean)
- is_active (boolean)

**catalog_values**
- id (UUID PK)
- catalog_id (UUID FK)
- code (string)
- label (string)
- description (text)
- color (string)
- sort_order (int)
- is_default (boolean)
- is_active (boolean)

**services**
- id (UUID PK)
- name (string, unique)
- display_name (string)
- version (string)
- status_catalog_id (UUID FK)
- status_value (string)
- endpoints (JSON)
- is_active (boolean)

**configurations**
- id (UUID PK)
- service_id (UUID FK, nullable)
- environment (string, nullable)
- key (string)
- value (text)
- type (enum)
- is_secret (boolean)
- version (int)

**secrets**
- id (UUID PK)
- service_id (UUID FK)
- environment (string)
- key (string)
- encrypted_value (text)
- encryption_version (string)

**feature_flags**
- id (UUID PK)
- key (string, unique)
- name (string)
- enabled (boolean)
- strategy (enum)
- percentage (int)
- target_users (JSON)
- target_groups (JSON)

**service_heartbeats**
- id (UUID PK)
- service_id (UUID FK)
- environment (string)
- status (enum)
- reported_at (timestamp)

## Seguridad

### RBAC (Role-Based Access Control)

| Rol | Permisos |
|-----|----------|
| **Admin** | Todo |
| **Developer** | Ver configs, crear configs, NO secrets |
| **Service Account** | Leer configs/secrets asignados, heartbeats |
| **Auditor** | Solo lectura |

### Encriptación

- **Secrets:** AES-256-GCM
- **Master Key:** Environment variable (nunca en código)
- **Audit Logs:** Todos los accesos a secrets logueados

## Despliegue

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Hostinger

1. Configurar PostgreSQL en Supabase
2. Configurar Redis en Upstash
3. Setear variables de entorno en Hostinger
4. Git push → auto-deploy

## Roadmap

- [x] System Catalogs (Catálogos Configurables)
- [x] Service Registry
- [x] Heartbeat System
- [x] Configuration Management
- [x] Secrets Vault (AES-256)
- [x] Feature Flags
- [x] Health Monitoring
- [ ] Client SDK
- [ ] Dashboard UI
- [ ] WebSocket real-time updates

## Licencia

MIT
