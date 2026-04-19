# Microservicio de Sistemas - Requerimientos

## Visión General

**mssistemas** es el microservicio de catálogo y configuración centralizada para todo el ecosistema de microservicios. Actúa como fuente única de verdad para metadatos, configuraciones, variables de entorno, feature flags y secrets compartidos.

**Propósito:** Centralizar el control, monitoreo y gestión de configuraciones de todos los microservicios (msseguridad, msclientes, msnotificaciones, etc.).

---

## Funcionalidades Core

### 1. Service Registry (Catálogo de Microservicios)

Registro centralizado de todos los microservicios del ecosistema con metadatos completos.

**Datos de cada servicio:**
- ID único y nombre del servicio
- Versión actual y changelog
- URLs (desarrollo, staging, producción)
- **Estado del servicio** - Referencia a catálogo configurable (ej: "active", "inactive", "suspended", "maintenance")
- Responsable/equipo dueño
- Tecnología stack (Node.js, Python, etc.)
- Repositorio GitHub
- Documentación links (Swagger, README)

**Nota sobre el Estado:** El campo estado no es un enum fijo en código, sino una referencia al **System Catalog** `service_status` (ver funcionalidad 8). Los valores posibles (activo, inactivo, suspendido, etc.) se configuran dinámicamente desde el administrador sin necesidad de redeploy.

**Endpoints de registro:**
- Self-registration: Cada microservicio se registra al iniciar
- Heartbeat: Actualización periódica de estado (cada 30s)
- Deregistration: Eliminación al detenerse

### 2. Configuration Management

Gestión centralizada de configuraciones por entorno.

**Jerarquía de configuraciones:**
```
Default (aplica a todos los servicios y entornos)
  ↓
Service-specific (aplica solo a un servicio en todos los entornos)
  ↓
Environment-specific (aplica a todos los servicios en un entorno)
  ↓
Service + Environment (aplica solo a un servicio en un entorno específico)
```

**Tipos de configuración:**
- **Application Settings:** Timeouts, límites de paginación, TTLs de cache
- **Integration URLs:** Endpoints de otros microservicios
- **Database Configs:** Connection pools, timeouts, retry policies
- **Third-party Services:** API keys no sensibles, endpoints externos
- **Business Rules:** Parámetros de negocio (sin código)

**Operaciones:**
- CRUD de configuraciones
- Versionado de cambios (audit trail)
- Rollback a versiones anteriores
- Bulk import/export (JSON/YAML)

### 3. Secrets Management (Seguro)

Gestión segura de credenciales y datos sensibles.

**Tipos de secrets:**
- Database passwords
- API keys (SendGrid, Twilio, Firebase)
- JWT secrets
- OAuth client secrets
- TLS certificates
- Encryption keys

**Seguridad:**
- Encriptación AES-256 en reposo
- Acceso solo via HTTPS
- RBAC: quién puede leer/escribir qué secrets
- Audit logging de cada acceso
- Rotación automática de secrets
- No logging de valores desencriptados

### 4. Feature Flags

Sistema de banderas de características para despliegues controlados.

**Funcionalidades:**
- Toggle features ON/OFF por servicio
- Targeting por porcentaje de usuarios (gradual rollout)
- Targeting por usuario específico (lista blanca)
- Targeting por grupo/rol
- Programación temporal (activar el lunes 9 AM)
- A/B testing support

**Estrategias de evaluación:**
- **simple:** ON/OFF global
- **percentage:** Porcentaje de usuarios (consistent hashing)
- **user_target:** Lista específica de usuarios
- **group_target:** Lista específica de grupos
- **schedule:** Programación temporal

### 5. System Catalogs (Catálogos Configurables)

**Propósito:** Permitir que ciertos campos del sistema usen valores definidos por configuración en lugar de enums hardcodeados. Esto evita redeploys solo por agregar un nuevo valor posible.

**Ejemplo de uso:**
- **Estado de servicio:** En lugar de un enum fijo `[active, inactive, maintenance]`, el administrador define los valores desde el panel: `activo`, `inactivo`, `suspendido`, `en_mantenimiento`, `deprecated`, etc.
- **Estado de cliente:** `nuevo`, `activo`, `inactivo`, `suspendido_por_mora`, `eliminado`
- **Tipo de notificación:** `email`, `sms`, `push`, `whatsapp`, `telegram`
- **Prioridad:** `baja`, `media`, `alta`, `critica`, `urgente`

**Estructura de un Catálogo:**
```json
{
  "key": "service_status",
  "name": "Estado de Servicio",
  "description": "Estados posibles para microservicios registrados",
  "values": [
    { "code": "active", "label": "Activo", "color": "#28a745", "sort_order": 1 },
    { "code": "inactive", "label": "Inactivo", "color": "#6c757d", "sort_order": 2 },
    { "code": "suspended", "label": "Suspendido", "color": "#ffc107", "sort_order": 3 },
    { "code": "maintenance", "label": "En Mantenimiento", "color": "#17a2b8", "sort_order": 4 }
  ],
  "is_active": true,
  "allow_multiple": false
}
```

**Features:**
- CRUD de catálogos y sus valores
- Metadatos por valor: código, etiqueta, color, orden, descripción
- Validación de unicidad de códigos dentro de un catálogo
- Soft delete de valores (para mantener historial)
- Import/export de catálogos completos
- API pública para que otros microservicios consulten catálogos

**Consumo desde otros microservicios:**
```typescript
// Obtener valores válidos de un catálogo
const statuses = await systemClient.getCatalogValues('service_status');
// Resultado: [{code: 'active', label: 'Activo', ...}, ...]

// Validar si un código existe en el catálogo
const isValid = await systemClient.validateCatalogValue('service_status', 'suspended');
```

### 6. Environment Variables Centralizado

Variables de entorno gestionadas desde un solo lugar.

**Soporte para:**
- Desarrollo (dev)
- Testing/QA (test)
- Staging (staging)
- Producción (prod)

**Features:**
- Asignación de variables a múltiples servicios
- Herencia de valores (default → servicio → entorno)
- Validación de tipos (string, number, boolean, JSON)
- Validación de formato (URL, email, regex)
- Referencias entre variables (`${db_host}:${db_port}`)

### 7. Health & Status Dashboard

Monitoreo centralizado del estado de todos los servicios.

**Datos recolectados:**
- Status: UP, DOWN, DEGRADED, UNKNOWN
- Último heartbeat timestamp
- Response time del health check
- Versión del servicio reportada
- Métricas: CPU, memory (si disponible)
- Incidentes activos
- Dependencias funcionando/fallando

**Dashboard:**
- Vista global de todos los servicios
- Filtros por entorno, equipo, status
- Histórico de uptime
- Alertas configurables

---

## Modelo de Datos

### Entidades Principales

```sql
-- Microservicios registrados
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  status_catalog_id UUID REFERENCES catalogs(id),
  status_value VARCHAR(100),
  team_owner VARCHAR(100),
  repository_url VARCHAR(500),
  documentation_url VARCHAR(500),
  technology_stack JSONB DEFAULT '[]',
  health_check_url VARCHAR(500),
  health_check_path VARCHAR(200),
  endpoints JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Catálogos del sistema (valores configurables)
CREATE TABLE catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  allow_multiple BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Valores de catálogos
CREATE TABLE catalog_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES catalogs(id),
  code VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(catalog_id, code)
);

-- Configuraciones
CREATE TABLE configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  environment VARCHAR(50),
  key VARCHAR(200) NOT NULL,
  value TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json', 'yaml')),
  is_secret BOOLEAN DEFAULT false,
  is_encrypted BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  description TEXT,
  tags JSONB DEFAULT '[]',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Historial de cambios de configuración
CREATE TABLE configuration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL REFERENCES configurations(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(100),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Secrets (encriptados)
CREATE TABLE secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  environment VARCHAR(50),
  key VARCHAR(200) NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_version VARCHAR(20) DEFAULT 'v1',
  is_rotating BOOLEAN DEFAULT false,
  last_rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access logs de secrets (quién leyó qué)
CREATE TABLE secret_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id UUID NOT NULL REFERENCES secrets(id),
  service_id UUID REFERENCES services(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('read', 'write', 'rotate')),
  accessed_by VARCHAR(100),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  strategy VARCHAR(20) DEFAULT 'simple' CHECK (strategy IN ('simple', 'percentage', 'user_target', 'group_target', 'schedule')),
  percentage INT DEFAULT 0,
  target_users JSONB DEFAULT '[]',
  target_groups JSONB DEFAULT '[]',
  schedule_start TIMESTAMP,
  schedule_end TIMESTAMP,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flag aplicaciones por servicio
CREATE TABLE feature_flag_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id),
  service_id UUID NOT NULL REFERENCES services(id),
  is_enabled BOOLEAN DEFAULT true,
  override_strategy JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_flag_id, service_id)
);

-- Heartbeats de servicios
CREATE TABLE service_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id),
  environment VARCHAR(50) NOT NULL,
  instance_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
  response_time_ms INT,
  version VARCHAR(50),
  metadata JSONB,
  reported_at TIMESTAMP DEFAULT NOW()
);

-- Dependencias entre servicios
CREATE TABLE service_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id),
  depends_on_service_id UUID NOT NULL REFERENCES services(id),
  dependency_type VARCHAR(20) DEFAULT 'required' CHECK (dependency_type IN ('required', 'optional')),
  is_healthy BOOLEAN,
  checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs general
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('service', 'configuration', 'secret', 'feature_flag', 'catalog')),
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(100),
  actor_type VARCHAR(20) DEFAULT 'user' CHECK (actor_type IN ('user', 'service')),
  ip_address VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_status ON services(status_value);
CREATE INDEX idx_catalogs_key ON catalogs(key);
CREATE INDEX idx_catalog_values_catalog_id ON catalog_values(catalog_id);
CREATE INDEX idx_catalog_values_code ON catalog_values(code);
CREATE INDEX idx_configurations_key ON configurations(key);
CREATE INDEX idx_configurations_service ON configurations(service_id);
CREATE INDEX idx_configurations_environment ON configurations(environment);
CREATE INDEX idx_secrets_key ON secrets(key);
CREATE INDEX idx_secrets_service ON secrets(service_id);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_heartbeats_service ON service_heartbeats(service_id);
CREATE INDEX idx_heartbeats_reported ON service_heartbeats(reported_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## API Endpoints

### Service Registry

```
POST   /api/v1/services                    # Registrar nuevo servicio
GET    /api/v1/services                    # Listar todos los servicios
GET    /api/v1/services/:id                  # Obtener servicio específico
PUT    /api/v1/services/:id                  # Actualizar servicio
DELETE /api/v1/services/:id                  # Eliminar servicio (soft)
POST   /api/v1/services/:id/heartbeat        # Enviar heartbeat
GET    /api/v1/services/:id/health           # Obtener health status
GET    /api/v1/services/:id/dependencies     # Obtener dependencias
POST   /api/v1/services/:id/dependencies     # Registrar dependencia
```

### Configuration

```
GET    /api/v1/configurations                # Listar configuraciones (con filtros)
GET    /api/v1/configurations/:id           # Obtener configuración
POST   /api/v1/configurations                # Crear configuración
PUT    /api/v1/configurations/:id            # Actualizar configuración
DELETE /api/v1/configurations/:id            # Eliminar configuración
POST   /api/v1/configurations/:id/rollback   # Rollback a versión anterior
GET    /api/v1/configurations/history         # Ver historial de cambios
POST   /api/v1/configurations/bulk-update    # Actualización masiva
POST   /api/v1/configurations/export         # Exportar a JSON/YAML
POST   /api/v1/configurations/import         # Importar desde JSON/YAML
```

### Secrets

```
GET    /api/v1/secrets                       # Listar secrets (solo metadata, no valores)
GET    /api/v1/secrets/:id                  # Obtener metadata
GET    /api/v1/secrets/:id/value            # Obtener valor desencriptado (requiere permisos)
POST   /api/v1/secrets                       # Crear secret
PUT    /api/v1/secrets/:id                   # Actualizar secret
DELETE /api/v1/secrets/:id                   # Eliminar secret
POST   /api/v1/secrets/:id/rotate            # Rotar secret
GET    /api/v1/secrets/:id/access-logs       # Ver quién accedió al secret
```

### Feature Flags

```
GET    /api/v1/feature-flags                 # Listar feature flags
GET    /api/v1/feature-flags/:id             # Obtener flag
POST   /api/v1/feature-flags                 # Crear flag
PUT    /api/v1/feature-flags/:id             # Actualizar flag
DELETE /api/v1/feature-flags/:id             # Eliminar flag
POST   /api/v1/feature-flags/:id/toggle      # Toggle ON/OFF
POST   /api/v1/feature-flags/:id/services    # Asociar a servicios
POST   /api/v1/feature-flags/evaluate        # Evaluar si flag está activo para usuario
```

### System Catalogs (Catálogos Configurables)

```
# Catálogos
GET    /api/v1/catalogs                      # Listar todos los catálogos
GET    /api/v1/catalogs/:key                 # Obtener catálogo por key
POST   /api/v1/catalogs                       # Crear nuevo catálogo
PUT    /api/v1/catalogs/:id                   # Actualizar catálogo
DELETE /api/v1/catalogs/:id                   # Eliminar catálogo

# Valores de catálogo
GET    /api/v1/catalogs/:id/values           # Listar valores del catálogo
GET    /api/v1/catalogs/:key/values            # Listar valores por key del catálogo
POST   /api/v1/catalogs/:id/values           # Agregar valor al catálogo
PUT    /api/v1/catalogs/values/:valueId       # Actualizar valor
DELETE /api/v1/catalogs/values/:valueId       # Eliminar valor (soft delete)

# API pública para otros microservicios
GET    /api/v1/public/catalogs/:key/values          # Obtener valores (sin auth)
POST   /api/v1/public/catalogs/:key/validate         # Validar si código existe
GET    /api/v1/public/catalogs/:key/default            # Obtener valor por defecto
```

### Service Discovery (para otros microservicios)

```
GET    /api/v1/discovery/services              # Descubrir todos los servicios activos
GET    /api/v1/discovery/services/:name       # Obtener URL de servicio específico
GET    /api/v1/discovery/services/:name/config # Obtener configuración de servicio
GET    /api/v1/discovery/health               # Health de todo el ecosistema
```

### Dashboard & Monitoring

```
GET    /api/v1/dashboard/status                # Status global de servicios
GET    /api/v1/dashboard/metrics               # Métricas agregadas
GET    /api/v1/dashboard/activity              # Actividad reciente
GET    /api/v1/audit-logs                      # Logs de auditoría
```

---

## Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         mssistemas                              │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    API Layer                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │ Services │ │ Config   │ │ Secrets  │ │ Feature  │     │   │
│  │  │ Registry │ │ Mgmt     │ │ Mgmt     │ │ Flags    │     │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │   │
│  └───────┼─────────────┼─────────────┼─────────────┼────────┘   │
│          │             │             │             │              │
│  ┌───────┼─────────────┼─────────────┼─────────────┼────────┐     │
│  │       ▼             ▼             ▼             ▼        │     │
│  │   ┌──────────────────────────────────────────────────┐  │     │
│  │   │           Business Logic Layer                   │  │     │
│  │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │     │
│  │   │  │ Service │ │ Config  │ │ Secret  │            │  │     │
│  │   │  │Service  │ │Service  │ │Service  │            │  │     │
│  │   │  └─────────┘ └─────────┘ └─────────┘            │  │     │
│  │   └──────────────────────────────────────────────────┘  │     │
│  │                       │                                 │     │
│  │   ┌──────────────────────────────────────────────────┐  │     │
│  │   │           Data Access Layer                      │  │     │
│  │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │     │
│  │   │  │ Service │ │ Config  │ │ Audit   │            │  │     │
│  │   │  │ Repo    │ │ Repo    │ │ Repo    │            │  │     │
│  │   │  └─────────┘ └─────────┘ └─────────┘            │  │     │
│  │   └──────────────────────────────────────────────────┘  │     │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL (Supabase)                        │
│  - Services, configs, secrets, flags, heartbeats, audit logs    │
└─────────────────────────────────────────────────────────────────┘
```

### Clean Architecture Layers

```
src/
├── domain/
│   ├── entities/
│   │   ├── Service.ts
│   │   ├── Catalog.ts
│   │   ├── Configuration.ts
│   │   ├── Secret.ts
│   │   ├── FeatureFlag.ts
│   │   └── ServiceHeartbeat.ts
│   ├── repositories/
│   │   ├── IServiceRepository.ts
│   │   ├── ICatalogRepository.ts
│   │   ├── IConfigurationRepository.ts
│   │   └── ISecretRepository.ts
│   └── services/
│       ├── EncryptionService.ts
│       └── AuditService.ts
│
├── application/
│   ├── use-cases/
│   │   ├── RegisterServiceUseCase.ts
│   │   ├── CreateCatalogUseCase.ts
│   │   ├── GetConfigurationUseCase.ts
│   │   ├── UpdateSecretUseCase.ts
│   │   ├── EvaluateFeatureFlagUseCase.ts
│   │   └── HealthCheckUseCase.ts
│   ├── dtos/
│   │   ├── ServiceDto.ts
│   │   ├── CatalogDto.ts
│   │   ├── ConfigurationDto.ts
│   │   └── SecretDto.ts
│   └── mappers/
│
├── infrastructure/
│   ├── persistence/
│   │   ├── config/
│   │   ├── entities/
│   │   └── repositories/
│   ├── encryption/
│   │   └── AesEncryptionService.ts
│   ├── auth/
│   │   └── JwtAuthService.ts
│   └── logging/
│       └── AuditLogger.ts
│
└── interfaces/
    ├── http/
    │   ├── controllers/
    │   │   ├── ServiceController.ts
    │   │   ├── CatalogController.ts
    │   │   ├── ConfigurationController.ts
    │   │   ├── SecretController.ts
    │   │   └── FeatureFlagController.ts
    │   ├── middleware/
    │   │   ├── AuthMiddleware.ts
    │   │   ├── AuditMiddleware.ts
    │   │   └── RateLimitMiddleware.ts
    │   └── routes/
    └── websocket/
        └── DashboardWebSocket.ts
```

---

## Tecnología Stack

| Capa | Tecnología |
|------|------------|
| **Runtime** | Node.js 20+ |
| **Framework** | Express.js |
| **Lenguaje** | TypeScript |
| **Database** | PostgreSQL 15+ (Supabase) |
| **ORM** | TypeORM |
| **Cache** | Redis (Upstash) |
| **Auth** | JWT (integración con msseguridad) |
| **Encryption** | crypto (AES-256-GCM) |
| **Testing** | Jest |
| **Documentation** | Swagger/OpenAPI |

---

## Seguridad

### RBAC (Role-Based Access Control)

| Rol | Permisos |
|-----|----------|
| **Admin** | Todo (CRUD servicios, configs, secrets) |
| **Developer** | Ver configs, crear configs propios, NO ver secrets |
| **Service Account** | Leer configs/secrets asignados, enviar heartbeats |
| **Auditor** | Solo lectura de todo, ver logs |

### Medidas de Seguridad

1. **Encryption:**
   - Secrets encriptados con AES-256-GCM
   - Master key en environment variable (nunca en código)
   - Rotación de keys periódica

2. **Access Control:**
   - JWT validation (msseguridad)
   - Permisos granulares por endpoint
   - Rate limiting por IP y por usuario

3. **Audit:**
   - Todo cambio logueado (quién, qué, cuándo)
   - Acceso a secrets auditado separadamente
   - Retención de logs: 1 año

4. **Network:**
   - HTTPS obligatorio
   - CORS configurado explícitamente
   - IP whitelisting para acceso a secrets

---

## Integraciones

### Con msseguridad
- JWT validation para autenticación
- Permisos basados en roles de msseguridad
- User sync para audit logs

### Con otros microservicios
- Client SDK (npm package) para:
  - Auto-registro al iniciar
  - Obtener configuraciones
  - Evaluar feature flags
  - Enviar heartbeats

### Con CI/CD
- API para actualizar versiones automáticamente
- Webhooks para notificar cambios de config

---

## Monitoreo

### Métricas
- Número de servicios registrados por estado
- Latencia de health checks
- Errores de desencriptación de secrets
- Uso de feature flags (cuántos usuarios afectados)

### Alertas
- Servicio no envía heartbeat por > 2 minutos
- Múltiples fallos de desencriptación
- Cambio de secret sin autorización

---

## Roadmap

### Fase 1: Core Registry + System Catalogs (3 semanas)
- CRUD de servicios
- Heartbeat system
- Health dashboard
- **System Catalogs (catálogos configurables)**
- Service discovery API

### Fase 2: Configuration (2 semanas)
- CRUD de configuraciones
- Versionado
- Import/export
- Client SDK

### Fase 3: Secrets (2 semanas)
- Encriptación
- Gestión segura
- Rotación
- Audit logs

### Fase 4: Feature Flags (1 semana)
- CRUD de flags
- Evaluation engine
- Targeting strategies

### Fase 5: Polish (1 semana)
- Testing >80%
- Swagger docs
- Dashboard UI
- Docker setup

---

## Consideraciones Hostinger

### Adaptaciones para Business Managed

| Recurso | Solución Hostinger |
|---------|-------------------|
| PostgreSQL | Supabase (free tier) |
| Redis | Upstash (free tier) |
| Storage | Supabase Storage (para exports) |
| Deploy | Git push → Hostinger auto-deploy |

### Variables de Entorno Críticas

```env
# Database
DATABASE_URL=postgresql://...

# Encryption
MASTER_KEY=32-byte-hex-encoded-key

# JWT (msseguridad)
JWT_SECRET=...
JWT_ISSUER=msseguridad

# Redis
REDIS_URL=rediss://...

# App
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## Costos Estimados

| Componente | Proveedor | Costo/mes |
|------------|-----------|-----------|
| Hostinger Business | Hostinger | Incluido |
| PostgreSQL | Supabase (500MB) | $0 |
| Redis | Upstash (10k req/día) | $0 |
| **Total** | | **$0** |

---

## Ejemplo de Uso

### Registrar un servicio desde código

```typescript
import { SystemClient } from '@eugarte/mssistemas-client';

const client = new SystemClient({
  serviceName: 'msnotificaciones',
  apiKey: process.env.MSSISTEMAS_API_KEY,
  baseUrl: 'https://mssistemas.ejemplo.com'
});

// Auto-registro al iniciar
await client.register({
  version: '1.0.0',
  endpoints: {
    dev: 'http://localhost:3003',
    prod: 'https://msnotificaciones.ejemplo.com'
  },
  healthCheckPath: '/health'
});

// Obtener configuración
const config = await client.getConfiguration('database.poolSize', 'prod');

// Evaluar feature flag
const isEnabled = await client.evaluateFlag('new-feature', userId);

// Heartbeat automático cada 30s
client.startHeartbeat();
```

---

## Conclusión

**mssistemas** es la columna vertebral operativa del ecosistema de microservicios, proporcionando:
- Centralización de configuraciones
- Gestión segura de secrets
- Control de feature releases
- Observabilidad del sistema completo

Sin este servicio, cada microservicio necesitaría gestionar su propia configuración, dificultando mantenimiento, seguridad y consistencia entre entornos.
