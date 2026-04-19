# 🏗️ msseguridad - Microservicio de Seguridad y Autenticación

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-blue)](.github/workflows/cicd.yml)
[![Security](https://img.shields.io/badge/Security-DevSecOps-green)](SECURITY_CONFIG.md)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Microservicio de seguridad y autenticación robusto, escalable y compatible con estándares OAuth2/OIDC, construido con **Node.js**, **TypeScript**, **Clean Architecture** y **Hexagonal Architecture**.

---

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Integración con mssistemas](#-integración-con-mssistemas)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Calidad de Código](#-calidad-de-código)
- [DevSecOps](#-devsecops)
- [Kubernetes](#-kubernetes)
- [Documentación](#-documentación)
- [Contribución](#-contribución)

---

## ✨ Características

### 🔐 Seguridad
- **JWT RS256** (asimétrico) con rotación de claves
- **OAuth2/OIDC** completo (Authorization Code + PKCE, Client Credentials)
- **MFA TOTP** con códigos de respaldo
- **RBAC + ABAC** (control de acceso basado en roles y atributos)
- **Argon2id** para hashing de passwords (winner PHC 2015)
- **Rate limiting** por IP y usuario
- **Audit logging** inmutable
- **OWASP Top 10** mitigaciones implementadas

### 🏗️ Arquitectura
- **Clean Architecture** (4 capas: Domain, Application, Infrastructure, Interfaces)
- **Hexagonal Architecture** (puertos y adaptadores)
- **Domain-Driven Design** (entidades, value objects, domain services)
- **SOLID principles**
- **Dependency Inversion**

### 🗄️ Datos
- **MySQL 8.0** con JSON support
- **TypeORM 0.3.x** con migrations
- **Redis 7** para caché y sesiones
- **12 tablas** normalizadas
- **Particionamiento** de audit logs
- **Índices optimizados** para queries de seguridad

### 📊 Observabilidad
- **Prometheus** métricas
- **Grafana** dashboards
- **Jaeger** distributed tracing
- **Winston** logging estructurado
- **Health checks** (liveness/readiness)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Runtime** | Node.js 20 LTS |
| **Lenguaje** | TypeScript 5.x |
| **Framework** | Express.js 4.x |
| **Base de Datos** | MySQL 8.0 |
| **ORM** | TypeORM 0.3.x |
| **Caché** | Redis 7 |
| **Seguridad** | Argon2id, JWT (jose), Speakeasy (TOTP) |
| **Testing** | Jest, Supertest, ts-jest |
| **Calidad** | ESLint, Prettier, SonarQube, Husky |
| **CI/CD** | GitHub Actions |
| **Monitoreo** | Prometheus, Grafana, Jaeger |

---

## 🏛️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│  INTERFACES LAYER                                               │
│  ├─ Controllers (Auth, User, Admin, OAuth)                     │
│  ├─ Middlewares (Auth, RateLimit, Validation, Audit)           │
│  ├─ Routes                                                      │
│  └─ DTOs                                                        │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                              │
│  ├─ Services (AuthService, UserService, TokenService)          │
│  ├─ Use Cases (Login, Register, RefreshToken)                  │
│  ├─ Ports (Interfaces de entrada)                              │
│  └─ DTOs                                                        │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                                   │
│  ├─ Entities (User, Role, Permission, RefreshToken)              │
│  ├─ Value Objects (Email, Password, Token)                     │
│  ├─ Domain Services (PermissionEvaluator, TokenRotation)       │
│  ├─ Repository Interfaces                                       │
│  └─ Domain Events                                               │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                           │
│  ├─ Repositories (TypeOrmUserRepository, etc.)                 │
│  ├─ Adapters (Argon2Adapter, JwtAdapter, TotpAdapter)          │
│  ├─ External Services (EmailService, AuditLogger)              │
│  └─ Config (Database, Redis, Environment)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 20+ y npm 10+
- Docker y Docker Compose
- Git

### 1. Clonar repositorio

```bash
git clone https://github.com/eugarte/msseguridad.git
cd msseguridad
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 4. Iniciar infraestructura (Docker)

```bash
docker-compose up -d
```

Esto inicia:
- MySQL 8.0 en puerto 3306
- Redis 7 en puerto 6379
- SonarQube en puerto 9000
- Prometheus en puerto 9090
- Grafana en puerto 3001
- Jaeger en puerto 16686

### 5. Generar claves JWT

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 6. Ejecutar migraciones

```bash
npm run db:migrate
```

### 7. Seed datos iniciales

```bash
npm run db:seed
```

### 8. Iniciar servidor

```bash
npm run start:dev
```

El servidor estará disponible en: http://localhost:3000

---

## 🔗 Integración con mssistemas

msseguridad se integra con **mssistemas** para gestión centralizada de catálogos y configuración.

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# mssistemas Integration
MSSISTEMAS_URL=http://localhost:3001
MSSISTEMAS_API_KEY=your-api-key-here
SERVICE_NAME=msseguridad
SERVICE_VERSION=1.0.0
SERVICE_BASE_URL=http://localhost:3000
HEARTBEAT_INTERVAL_MS=30000
```

### Funcionalidades

| Funcionalidad | Descripción |
|---------------|-------------|
| **Catálogos Dinámicos** | `UserStatus` y `UserRole` obtienen valores de mssistemas con fallback local |
| **Configuración Centralizada** | Obtén configuraciones por ambiente desde mssistemas |
| **Auto-registro** | El servicio se registra automáticamente al iniciar |
| **Heartbeat** | Envia señales de vida cada 30 segundos |

### Uso de Catálogos

```typescript
import { UserStatus } from '@domain/enums/UserStatus';
import { UserRole } from '@domain/enums/UserRole';

// Los valores se cargan automáticamente de mssistemas
// con fallback a valores por defecto si no está disponible
const status = UserStatus.ACTIVE;  // 'active' o valor del catálogo
const role = UserRole.ADMIN;       // 'admin' o valor del catálogo

// Validar valores
const isValid = await UserStatus.validate('active');
const hasPermission = UserRole.hasPermission('admin', 'user');
```

### SystemClient

```typescript
import { SystemClient } from '@infrastructure/system/SystemClient';

const client = new SystemClient({
  baseUrl: process.env.MSSISTEMAS_URL!,
  apiKey: process.env.MSSISTEMAS_API_KEY!,
  serviceName: 'msseguridad',
  serviceVersion: '1.0.0',
});

// Obtener valores de catálogo
const values = await client.getCatalogValues('user_status');

// Validar código en catálogo
const isValid = await client.validateCatalogValue('user_status', 'active');

// Obtener configuración
const config = await client.getConfiguration('max_login_attempts', 'production');

// Registrar servicio
await client.registerService();

// Iniciar heartbeat automático
client.startHeartbeat(30000);
```

---

## 💻 Desarrollo

### Scripts disponibles

```bash
# Desarrollo
npm run start:dev          # Modo watch con tsx
npm run start:debug        # Modo debug

# Compilación
npm run build              # Compilar TypeScript
npm run start              # Iniciar compilado

# Testing
npm run test               # Ejecutar tests
npm run test:unit          # Tests unitarios
npm run test:integration   # Tests de integración
npm run test:e2e           # Tests E2E
npm run test:coverage      # Cobertura

# Calidad de código
npm run lint               # ESLint
npm run lint:fix           # ESLint --fix
npm run format             # Prettier
npm run format:check       # Verificar formato
npm run typecheck          # TypeScript --noEmit

# Base de datos
npm run db:migrate         # Ejecutar migraciones
npm run db:migrate:revert  # Revertir migración
npm run db:generate        # Generar migración
npm run db:seed            # Seed datos

# SonarQube
npm run sonar:scan         # Análisis SonarQube
```

### Estructura de carpetas

```
src/
├── domain/              # Capa de dominio
│   ├── entities/        # Entidades de negocio
│   ├── value-objects/   # Value objects
│   ├── repositories/    # Interfaces de repositorios
│   ├── services/        # Domain services
│   └── events/          # Domain events
├── application/         # Capa de aplicación
│   ├── services/        # Application services
│   ├── use-cases/       # Casos de uso
│   ├── ports/           # Interfaces de entrada
│   └── dto/             # Data Transfer Objects
├── infrastructure/      # Capa de infraestructura
│   ├── config/          # Configuraciones
│   ├── database/        # Migraciones y seeds
│   ├── repositories/    # Implementaciones TypeORM
│   ├── adapters/        # Adaptadores externos
│   ├── http/            # Middlewares, controllers, routes
│   └── services/        # Servicios externos
└── interfaces/          # Capa de interfaces
    └── http/            # HTTP layer
```

---

## 🧪 Testing

### Coverage requerido: 80%

```bash
# Unit tests (rápidos, sin dependencias)
npm run test:unit

# Integration tests (con DB)
npm run test:integration

# E2E tests (flujos completos)
npm run test:e2e

# Todos los tests con cobertura
npm run test:coverage
```

### Estrategia de testing

| Tipo | Alcance | Herramientas |
|------|---------|--------------|
| **Unit** | Domain entities, value objects, domain services | Jest, mocks |
| **Integration** | Repositories, adapters, database | Jest, TestContainers |
| **E2E** | API endpoints, flujos completos | Supertest, Jest |
| **Contract** | API contracts, DTOs | Joi/Zod + tests |

---

## 🔍 Calidad de Código

### ESLint + Prettier

```bash
npm run lint        # Verificar
npm run lint:fix    # Corregir automáticamente
npm run format      # Formatear
```

### Pre-commit hooks (Husky)

Los hooks automáticos ejecutan:
1. ESLint --fix
2. Prettier --write
3. Tests unitarios relacionados

### SonarQube

```bash
# Local (requiere docker-compose up)
npm run sonar:scan

# Acceder a SonarQube: http://localhost:9000
# Credenciales por defecto: admin/admin
```

### GitHub Actions

El pipeline CI/CD ejecuta:
1. Lint y format check
2. TypeScript typecheck
3. Tests unitarios
4. Tests de integración
5. Cobertura mínima 80%
6. Análisis SonarQube

---

## 🔒 DevSecOps

### Pipeline CI/CD Completo

Pipeline de 7 fases implementado en `.github/workflows/cicd.yml`:

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  LINT   │──▶│SECURITY │──▶│  TEST   │──▶│ SONAR   │──▶│  BUILD  │
│  CHECK  │   │  SCAN   │   │         │   │  QUBE   │   │         │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └────┬────┘
                                                             │
              ┌─────────┐   ┌─────────┐                    │
              │  PROD   │◀──│ STAGING │◀─────────────────────┘
              │ DEPLOY  │   │ DEPLOY  │
              └─────────┘   └─────────┘
```

### Herramientas de Seguridad

| Herramienta | Tipo | Descripción |
|-------------|------|-------------|
| **SonarQube** | SAST | Análisis continuo de calidad y seguridad |
| **Semgrep** | SAST | Reglas personalizadas, OWASP Top 10 |
| **Snyk** | SCA/SAST | Vulnerabilidades en dependencias |
| **npm audit** | SCA | Auditoría de paquetes npm |
| **GitLeaks** | Secrets | Detección de credenciales hardcodeadas |
| **ESLint Security** | SAST | Patrones inseguros en código |
| **Trivy** | Container | Escaneo de imágenes Docker |
| **Syft** | SBOM | Generación de Software Bill of Materials |

### Comandos de Seguridad (Makefile)

```bash
make security              # Ejecutar todos los escaneos
make semgrep               # SAST con Semgrep
make sonar-local           # SonarQube local con Docker
make docker-scan           # Escanear imagen con Trivy
make sbom                  # Generar SBOM
make gitleaks              # Detectar secretos en código
```

### SonarQube Local

```bash
# Iniciar SonarQube con Docker
make sonar-local

# Acceder: http://localhost:9000 (admin/admin)
```

### CI Local (Simulación)

```bash
make ci-local              # Simular pipeline CI
make ci-full               # CI completo con seguridad
```

---

## ☸️ Kubernetes

### Despliegue con Helm

```bash
# Instalar dependencias Helm
make helm-deps

# Desplegar a staging
make deploy-staging

# Desplegar a producción
make deploy-production
```

### Estructura de Charts

```
k8s/helm/
├── Chart.yaml                 # Metadata
├── values.yaml                # Valores por defecto
├── values-staging.yaml        # Configuración staging
├── values-production.yaml     # Configuración producción
└── templates/
    ├── deployment.yaml        # Deployment principal
    ├── service.yaml           # Service ClusterIP
    ├── ingress.yaml           # Ingress con TLS
    ├── hpa.yaml               # Autoscaling
    ├── pdb.yaml               # Pod Disruption Budget
    └── networkpolicy.yaml     # Políticas de red
```

### Características de Seguridad

- 🔐 **Security Contexts**: Non-root, read-only filesystem
- 🔐 **Network Policies**: Restricciones ingress/egress
- 📊 **Pod Disruption Budgets**: Alta disponibilidad
- 📊 **HPA**: Autoscaling con behavior personalizado
- 🌐 **Ingress**: Rate limiting, TLS automático
- 📈 **Monitoring**: Prometheus ServiceMonitor

### Requisitos

- Kubernetes 1.24+
- Helm 3.x
- Ingress Controller (nginx)
- cert-manager (para TLS)
- Prometheus Operator (para métricas)

---

## 📚 Documentación

La documentación completa está en la carpeta `docs/`:

| Documento | Descripción |
|-----------|-------------|
| `INFORME_ARQUITECTURA.md` | Arquitectura de alto nivel (C4 Model) |
| `PROPUESTA_IMPLEMENTACION.md` | Propuesta técnica completa con UML |
| `REQUERIMIENTOS.md` | RFs, RNFs, reglas de negocio, trazabilidad |
| `HERRAMIENTAS_CALIDAD_SEGURIDAD.md` | Guía de herramientas de calidad y seguridad |
| `MODELO_DATOS_MYSQL_NODEJS.md` | DDL completo + entidades TypeORM |
| `RESUMEN_IMPLEMENTACION.md` | Resumen de implementación de fases |
| `DOCUMENTOS_SALIDA.md` | Checklist de entregables |

### API Documentation

- Swagger UI: http://localhost:3000/api-docs (próximamente)
- OpenAPI spec: `docs/openapi.yaml` (próximamente)

---

## 🤝 Contribución

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `security`

**Scopes:** `auth`, `user`, `role`, `permission`, `token`, `oauth`, `mfa`, `security`, `db`

**Ejemplo:**
```
feat(auth): implementar refresh token rotation

- Agregar family_id para detectar reuso
- Invalidar toda la familia en caso de reuso
- Notificar al usuario por email

Closes #123
```

### Branching Strategy

- `main`: Producción estable
- `develop`: Integración continua
- `feature/*`: Nuevas features
- `fix/*`: Bug fixes
- `hotfix/*`: Fixes urgentes a producción

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

## 👥 Autores

- **Equipo de Arquitectura** - *Diseño inicial* - 2026

---

## 🙏 Agradecimientos

- [OWASP](https://owasp.org/) por las guías de seguridad
- [Node.js](https://nodejs.org/) community
- [TypeORM](https://typeorm.io/) team

---

<p align="center">
  <strong>msseguridad</strong> - Seguridad sin compromisos
</p>
