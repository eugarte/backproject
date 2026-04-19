# 📘 Informe de Arquitectura: msseguridad
## Microservicio de Seguridad en Node.js

---

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Stack:** Node.js  
**Repositorio:** https://github.com/eugarte/msseguridad

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Microservicio](#1-arquitectura-del-microservicio)
2. [Requerimientos de Seguridad](#2-requerimientos-de-seguridad)
3. [Propuesta de Implementación](#3-propuesta-de-implementación)
4. [Stack Tecnológico Detallado](#4-stack-tecnológico-detallado)
5. [Ciclo de Vida de Software y DevOps](#5-ciclo-de-vida-de-software-y-devops)

---

## 1. Arquitectura del Microservicio

### 1.1 Patrón Arquitectónico Recomendado: Clean Architecture + Hexagonal

Para un microservicio de seguridad, se recomienda **Clean Architecture** combinada con **Arquitectura Hexagonal** (Ports & Adapters):

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  API REST   │  │  Middlewares │  │  Controllers        │ │
│  │  (Express)  │  │  (Auth/Val)  │  │  (Routes)           │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Services  │  │    DTOs      │  │  Use Cases          │ │
│  │  (Business) │  │  (Mapping)   │  │  (Orchestration)    │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Entities  │  │  Value Obj   │  │  Domain Services    │ │
│  │  (User,     │  │  (Token,     │  │  (Auth logic)       │ │
│  │  Role,      │  │  Permission) │  │                     │ │
│  │  Permission)│  │              │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              INFRASTRUCTURE LAYER (Adapters)                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Database   │  │    Cache     │  │  External APIs      │ │
│  │  (TypeORM)  │  │   (Redis)    │  │  (OAuth Providers)  │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Justificación:**
- **Separación de responsabilidades:** La lógica de seguridad queda aislada del framework
- **Testabilidad:** Se pueden testear los casos de uso sin depender de infraestructura
- **Flexibilidad:** Fácil cambiar de base de datos o framework sin tocar la lógica de negocio

### 1.2 Componentes Principales

| Componente | Responsabilidad |
|------------|-----------------|
| **Authentication Service** | Login, logout, refresh tokens, MFA |
| **Authorization Service** | RBAC, ABAC, permisos, scopes |
| **Token Service** | Generación y validación de JWT, rotación |
| **User Management** | CRUD de usuarios, perfiles |
| **Session Service** | Gestión de sesiones activas, invalidación |
| **Audit Service** | Logging de eventos de seguridad |

### 1.3 Comunicación con Otros Servicios

```mermaid
graph TB
    subgraph "Clientes"
        WEB[Aplicación Web]
        MOBILE[App Móvil]
        API[Otras APIs]
    end

    subgraph "msseguridad"
        GATEWAY[API Gateway / Ingress]
        AUTH[Auth Service]
        USER[User Service]
        PERM[Permission Service]
        REDIS[(Redis Cache)]
        DB[(PostgreSQL)]
    end

    subgraph "Servicios Internos"
        S1[Microservicio A]
        S2[Microservicio B]
        S3[Microservicio C]
    end

    WEB -->|HTTPS/JSON| GATEWAY
    MOBILE -->|HTTPS/JSON| GATEWAY
    API -->|HTTPS/JSON| GATEWAY
    
    GATEWAY --> AUTH
    GATEWAY --> USER
    GATEWAY --> PERM
    
    AUTH --> REDIS
    AUTH --> DB
    USER --> DB
    PERM --> REDIS
    
    S1 -->|Validar Token| GATEWAY
    S2 -->|Validar Token| GATEWAY
    S3 -->|Validar Token| GATEWAY
```

**Patrón de comunicación:**
- **Sincrónica:** Validación de tokens (via API Gateway o directa)
- **Asincrónica:** Eventos de seguridad (login fallido, bloqueos) via message broker

### 1.4 Escalabilidad y Alta Disponibilidad

- **Stateless:** El servicio debe ser stateless para permitir múltiples instancias
- **Redis:** Para sesiones compartidas entre instancias
- **Load Balancer:** Distribución de carga entre instancias del servicio
- **Database:** Replicación de PostgreSQL (primary-read replica)

---

## 2. Requerimientos de Seguridad

### 2.1 OAuth 2.0

**Flujos recomendados:**

| Flujo | Uso | Seguridad |
|-------|-----|-----------|
| **Authorization Code + PKCE** | Aplicaciones SPA, móviles nativas | ⭐⭐⭐⭐⭐ |
| **Client Credentials** | Comunicación server-to-server | ⭐⭐⭐⭐ |
| **Device Code** | Dispositivos con input limitado | ⭐⭐⭐⭐ |

**NO usar:**
- ❌ Implicit flow (deprecated, inseguro)
- ❌ Password grant (legacy, poco seguro)
- ❌ Authorization Code sin PKCE en SPAs

**Estructura de implementación:**
```typescript
// Authorization endpoint
GET /oauth/authorize?response_type=code&client_id=xxx&redirect_uri=xxx&scope=xxx&state=xxx&code_challenge=xxx&code_challenge_method=S256

// Token endpoint
POST /oauth/token
{
  "grant_type": "authorization_code",
  "code": "xxx",
  "redirect_uri": "xxx",
  "client_id": "xxx",
  "code_verifier": "xxx" // PKCE
}
```

### 2.2 JWT (JSON Web Tokens)

**Estructura del token:**
```json
// Header
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-1"
}

// Payload
{
  "sub": "user-id",
  "iss": "msseguridad",
  "aud": "nombre-app",
  "iat": 1713225600,
  "exp": 1713229200,
  "jti": "unique-token-id",
  "scope": "read write",
  "roles": ["user", "admin"],
  "permissions": ["users:read", "users:write"]
}
```

**Mejores prácticas:**
- ✅ **Algoritmo:** RS256 (asimétrico) o ES256 para firmas
- ✅ **Claves:** Rotación periódica (múltiples `kid` activos)
- ✅ **Claims obligatorios:** `sub`, `iss`, `aud`, `iat`, `exp`, `jti`
- ✅ **Tiempo de vida:** Access tokens: 15 min, Refresh tokens: 7-30 días
- ✅ **Lista negra:** Capacidad de revocar tokens (via Redis)

**Rotación de tokens:**
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Access Token│  expires│ Refresh Token│ expires│  New Access │
│  (15 min)   │────────▶│  (7 days)   │────────▶│  + Refresh  │
└─────────────┘         └─────────────┘         └─────────────┘
```

### 2.3 OWASP Top 10 Mitigaciones

| Riesgo OWASP | Mitigación en msseguridad |
|--------------|---------------------------|
| **A01 - Broken Access Control** | RBAC estricto, validación de permisos en cada endpoint, principle of least privilege |
| **A02 - Cryptographic Failures** | TLS 1.3, encriptación AES-256-GCM, hashing Argon2id para passwords |
| **A03 - Injection** | Query parameterization (TypeORM), input validation (Joi/Zod), sanitización |
| **A04 - Insecure Design** | Threat modeling, secure by default, defense in depth |
| **A05 - Security Misconfiguration** | Config management, hardening headers, mínimos privilegios |
| **A06 - Vulnerable Components** | Dependabot, Snyk, npm audit, SBOM |
| **A07 - Auth Failures** | MFA, rate limiting, account lockout, secure session management |
| **A08 - Data Integrity Failures** | Firma de paquetes, verificación de integridad |
| **A09 - Logging Failures** | Audit logs completos, inmutabilidad, SIEM integration |
| **A10 - SSRF** | Whitelist de URLs, validación de IPs privadas |

### 2.4 Otros Estándares

**OpenID Connect (OIDC):**
- Extensión de OAuth 2.0 para autenticación
- Endpoints: `/oidc/.well-known/openid-configuration`
- Claims estándar: `openid`, `profile`, `email`

**Rate Limiting:**
```typescript
// Configuración recomendada
{
  "login": "5 intentos / 15 minutos",
  "api": "100 requests / minuto",
  "token_refresh": "10 / hora"
}
```

**CORS:**
```typescript
{
  origin: ['https://app.tudominio.com'], // Whitelist estricto
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  maxAge: 86400
}
```

**Headers de seguridad:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 2.5 Manejo de Secretos

**NUNCA:**
- ❌ Commitear secrets en el repositorio
- ❌ Hardcodear API keys
- ❌ Enviar secrets por logs

**SIEMPRE:**
- ✅ Usar variables de entorno
- ✅ Usar secret managers (AWS Secrets Manager, HashiCorp Vault, Docker Secrets)
- ✅ Rotación automática de credenciales

---

## 3. Propuesta de Implementación

### 3.1 Estructura de Carpetas

```
msseguridad/
├── src/
│   ├── config/              # Configuración (env, database, etc.)
│   ├── domain/              # Entidades y lógica de negocio pura
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Role.ts
│   │   │   ├── Permission.ts
│   │   │   ├── RefreshToken.ts
│   │   │   └── AuditLog.ts
│   │   ├── value-objects/
│   │   │   ├── Email.ts
│   │   │   ├── Password.ts
│   │   │   └── Token.ts
│   │   └── services/
│   │       ├── AuthService.ts
│   │       └── TokenService.ts
│   ├── application/         # Casos de uso
│   │   ├── dto/
│   │   │   ├── LoginDto.ts
│   │   │   ├── RegisterDto.ts
│   │   │   └── TokenDto.ts
│   │   ├── use-cases/
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── RegisterUseCase.ts
│   │   │   ├── RefreshTokenUseCase.ts
│   │   │   └── LogoutUseCase.ts
│   │   └── interfaces/
│   │       ├── IUserRepository.ts
│   │       ├── ITokenRepository.ts
│   │       └── ICacheService.ts
│   ├── infrastructure/      # Adaptadores y detalles técnicos
│   │   ├── database/
│   │   │   ├── typeorm/
│   │   │   │   ├── entities/
│   │   │   │   ├── migrations/
│   │   │   │   └── repositories/
│   │   ├── cache/
│   │   │   └── RedisCacheService.ts
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   ├── middlewares/
│   │   │   │   ├── AuthMiddleware.ts
│   │   │   │   ├── RateLimitMiddleware.ts
│   │   │   │   └── ValidationMiddleware.ts
│   │   │   └── routes/
│   │   ├── security/
│   │   │   ├── PasswordHasher.ts
│   │   │   ├── TokenGenerator.ts
│   │   │   └── CryptoService.ts
│   │   └── external/
│   │       └── OAuthProviders/
│   ├── interfaces/          # Entry points (API REST)
│   │   ├── http/
│   │   │   ├── server.ts
│   │   │   └── app.ts
│   │   └── cli/
│   └── shared/              # Utilidades
│       ├── errors/
│       ├── logger/
│       └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api/                 # OpenAPI specs
│   └── architecture/
├── docker/
├── scripts/
└── .github/
    └── workflows/           # CI/CD
```

### 3.2 Dependencias Principales

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "jose": "^5.1.3",
    "bcrypt": "^5.1.1",
    "argon2": "^0.31.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "date-fns": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "prettier": "^3.1.1",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

### 3.3 Endpoints API Propuestos

#### Autenticación
```
POST   /api/v1/auth/register          # Registro
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/logout            # Logout
POST   /api/v1/auth/refresh           # Refresh token
POST   /api/v1/auth/forgot-password   # Solicitar reset
POST   /api/v1/auth/reset-password    # Resetear password
POST   /api/v1/auth/verify-email      # Verificar email
POST   /api/v1/auth/mfa/enable        # Habilitar MFA
POST   /api/v1/auth/mfa/verify        # Verificar código MFA
```

#### OAuth 2.0 / OIDC
```
GET    /oauth/authorize               # Authorize endpoint
POST   /oauth/token                   # Token endpoint
POST   /oauth/introspect              # Introspect token
POST   /oauth/revoke                  # Revoke token
GET    /oauth/.well-known/jwks.json   # JWKS endpoint
GET    /.well-known/openid-configuration  # OIDC discovery
```

#### Gestión de Usuarios
```
GET    /api/v1/users                  # Listar usuarios
GET    /api/v1/users/:id              # Obtener usuario
PUT    /api/v1/users/:id              # Actualizar usuario
DELETE /api/v1/users/:id              # Eliminar usuario
GET    /api/v1/users/me               # Perfil actual
PUT    /api/v1/users/me/password     # Cambiar password
```

#### Roles y Permisos (RBAC)
```
GET    /api/v1/roles                  # Listar roles
POST   /api/v1/roles                  # Crear rol
PUT    /api/v1/roles/:id              # Actualizar rol
DELETE /api/v1/roles/:id              # Eliminar rol
GET    /api/v1/permissions            # Listar permisos
POST   /api/v1/users/:id/roles        # Asignar rol a usuario
```

#### Sesiones
```
GET    /api/v1/sessions               # Listar sesiones activas
DELETE /api/v1/sessions/:id           # Cerrar sesión específica
DELETE /api/v1/sessions               # Cerrar todas las sesiones
```

### 3.4 Modelo de Datos

```typescript
// User Entity
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, indexed
  passwordHash: string;          // Argon2id hash
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;            // Encrypted TOTP secret
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  refreshTokens: RefreshToken[];
  auditLogs: AuditLog[];
}

// Role Entity
interface Role {
  id: string;
  name: string;                  // e.g., 'admin', 'user', 'editor'
  description: string;
  isDefault: boolean;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// Permission Entity
interface Permission {
  id: string;
  resource: string;              // e.g., 'users', 'posts'
  action: string;                // e.g., 'create', 'read', 'update', 'delete'
  description: string;
}

// Refresh Token Entity
interface RefreshToken {
  id: string;
  tokenHash: string;             // SHA-256 of token
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  replacedByTokenId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Audit Log Entity
interface AuditLog {
  id: string;
  userId?: string;
  action: string;                // e.g., 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE'
  resource: string;
  resourceId?: string;
  details: JSON;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}
```

### 3.5 Flujos de Autenticación

#### Login con MFA
```
┌─────────┐                                    ┌──────────────┐
│ Cliente │                                    │ msseguridad  │
└────┬────┘                                    └──────┬───────┘
     │                                                │
     │ POST /auth/login                               │
     │ { email, password }                            │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                                │──┐
     │                                                │  │ Validar credenciales
     │                                                │◀─┘
     │                                                │
     │                                                │──┐
     │                                                │  │ ¿MFA habilitado?
     │                                                │◀─┘
     │                                                │
     │ 202 Accepted                                   │
     │ { mfaRequired: true, mfaToken }               │
     │◀───────────────────────────────────────────────┤
     │                                                │
     │ POST /auth/mfa/verify                          │
     │ { mfaToken, code }                             │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                                │──┐
     │                                                │  │ Validar TOTP
     │                                                │◀─┘
     │                                                │
     │ 200 OK                                         │
     │ { accessToken, refreshToken, user }           │
     │◀───────────────────────────────────────────────┤
```

#### Refresh Token Rotation
```
┌─────────┐                                    ┌──────────────┐
│ Cliente │                                    │ msseguridad  │
└────┬────┘                                    └──────┬───────┘
     │                                                │
     │ POST /auth/refresh                             │
     │ { refreshToken }                               │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                                │──┐
     │                                                │  │ Validar token
     │                                                │  │ (hash y expiración)
     │                                                │◀─┘
     │                                                │
     │                                                │──┐
     │                                                │  │ Revocar token anterior
     │                                                │◀─┘
     │                                                │
     │                                                │──┐
     │                                                │  │ Generar nuevos tokens
     │                                                │◀─┘
     │                                                │
     │ 200 OK                                         │
     │ { accessToken, refreshToken }                 │
     │◀───────────────────────────────────────────────┤
```

---

## 4. Stack Tecnológico Detallado

### 4.1 Runtime y Framework

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Runtime** | Node.js 20 LTS | Última LTS, soporte largo, performance |
| **Framework** | Express.js 4.x | Maduro, ecosistema grande, flexible |
| **Lenguaje** | TypeScript 5.x | Tipado estático, mejor DX, menos bugs |

*Alternativa considerada:* Fastify (más rápido, pero Express tiene más recursos de aprendizaje)

### 4.2 Base de Datos

| Uso | Tecnología | Justificación |
|-----|------------|---------------|
| **Datos persistentes** | PostgreSQL 16 | ACID, robustez, JSON support, buen soporte de TypeORM |
| **Cache/Sesiones** | Redis 7 | Ultra rápido, TTL nativo, pub/sub para invalidaciones |

**Configuración PostgreSQL recomendada:**
```sql
-- Usar UUID como primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Índices recomendados
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(isActive) WHERE isActive = true;
CREATE INDEX idx_refresh_tokens_user ON refreshTokens(userId);
CREATE INDEX idx_refresh_tokens_expires ON refreshTokens(expiresAt);
CREATE INDEX idx_audit_logs_user ON auditLogs(userId);
CREATE INDEX idx_audit_logs_created ON auditLogs(createdAt);
```

### 4.3 ORM y Acceso a Datos

| Tecnología | Uso |
|------------|-----|
| **TypeORM** | ORM principal (migraciones, relaciones, repositorios) |
| **ioredis** | Cliente Redis avanzado (cluster, sentinel, pub/sub) |

### 4.4 Seguridad y Criptografía

| Tecnología | Uso |
|------------|-----|
| **argon2** | Hashing de contraseñas (más seguro que bcrypt) |
| **jose** | JWT signing/verification (más moderno que jsonwebtoken) |
| **helmet** | Headers de seguridad HTTP |
| **express-rate-limit** | Rate limiting |
| **cors** | CORS configuration |

### 4.5 Validación y Serialización

| Tecnología | Uso |
|------------|-----|
| **Joi** | Validación de schemas de entrada |
| **class-validator** | Validación de DTOs decoradores |
| **class-transformer** | Transformación de objetos |

### 4.6 Testing

| Tipo | Tecnología |
|------|------------|
| **Unitario** | Jest + ts-jest |
| **Integración** | Jest + supertest |
| **E2E** | Jest + supertest (con test database) |
| **Cobertura** | Jest --coverage |

**Cobertura mínima objetivo:** 80% líneas, 70% branches

### 4.7 Documentación

| Tecnología | Uso |
|------------|-----|
| **Swagger/OpenAPI 3.0** | Documentación de API interactiva |
| **swagger-ui-express** | UI embebida en `/docs` |

### 4.8 Logging y Observabilidad

| Tecnología | Uso |
|------------|-----|
| **Winston** | Logger estructurado (JSON) |
| **Pino** | *Alternativa:* Logger más rápido |

**Estructura de logs:**
```json
{
  "level": "info",
  "message": "User login successful",
  "timestamp": "2026-04-16T01:19:00.123Z",
  "service": "msseguridad",
  "requestId": "uuid-v4",
  "userId": "user-uuid",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 45,
  "context": { ... }
}
```

### 4.9 Colas de Mensajes (Opcional)

Para eventos de seguridad asíncronos:
| Tecnología | Uso |
|------------|-----|
| **BullMQ** | Colas basadas en Redis (eventos de auditoría) |
| **RabbitMQ** | *Alternativa:* Message broker más robusto |

---

## 5. Ciclo de Vida de Software y DevOps

### 5.1 Estrategia de Git

**GitFlow simplificado:**
```
main (production)
  ↑
hotfix/* ─────────────┘
  ↑
develop (integration)
  ↑
feature/*
  ↑
release/*
```

**Conventions:**
- Branches: `feature/JIRA-123-login-mfa`, `hotfix/fix-token-expiry`
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `security:`)
- Ejemplo: `feat(auth): add MFA verification endpoint`

### 5.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
      - uses: securecodewarrior/github-action-add-sarif@v1

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t msseguridad:${{ github.sha }} .
      - run: docker push registry/msseguridad:${{ github.sha }}
```

### 5.3 Linting y Formateo

**ESLint configuration (.eslintrc.js):**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'security'],
  rules: {
    'security/detect-object-injection': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': ['warn', { allow: ['error'] }]
  }
};
```

**Prettier configuration (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Husky + lint-staged (.husky/pre-commit):**
```bash
#!/bin/sh
npx lint-staged
```

### 5.4 Containerización (Docker)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
USER node
WORKDIR /app
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node ./dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
CMD ["dumb-init", "node", "dist/interfaces/http/server.js"]
```

**docker-compose.yml (desarrollo):**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://user:pass@postgres:5432/msseguridad
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: msseguridad
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 5.5 Estrategia de Despliegue

**Opciones recomendadas:**

| Plataforma | Caso de uso |
|------------|-------------|
| **Railway / Render** | MVP, rápido, sin preocupaciones |
| **Fly.io** | Buen balance precio/rendimiento |
| **AWS ECS / EKS** | Producción enterprise |
| **Google Cloud Run** | Serverless, escala a cero |

**Despliegue con zero-downtime:**
```yaml
# Ejemplo con Docker Swarm
version: '3.8'
services:
  msseguridad:
    image: msseguridad:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 5s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### 5.6 Monitoreo y Observabilidad

**Métricas clave:**

| Métrica | Alerta | Descripción |
|---------|--------|-------------|
| `auth_login_success_rate` | < 95% | Tasa de logins exitosos |
| `auth_login_duration_p99` | > 500ms | Latencia de login |
| `token_refresh_rate` | > 100/min | Posible problema de tokens |
| `rate_limit_hits` | > 50/min | Posible ataque |
| `db_connection_pool` | > 80% | Problema de conexiones |

**Herramientas:**
- **APM:** Datadog, New Relic, o Grafana + Prometheus
- **Logs:** ELK Stack o Grafana Loki
- **Uptime:** Pingdom, UptimeRobot

**Health checks:**
```typescript
// GET /health
{
  "status": "healthy",
  "timestamp": "2026-04-16T01:19:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "disk": "ok"
  }
}

// GET /ready (para kubernetes)
{
  "status": "ready"
}
```

### 5.7 Backup y Disaster Recovery

**Estrategia:**
- **PostgreSQL:** Backups diarios automáticos (pg_dump), retención 30 días
- **Redis:** Persistencia RDB + AOF
- **Secrets:** Backup encriptado en AWS SSM / Vault

**RTO/RPO objetivo:**
- RTO (Recovery Time Objective): < 1 hora
- RPO (Recovery Point Objective): < 24 horas

---

## 🎯 Resumen de Decisiones Clave

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Arquitectura** | Clean + Hexagonal | Separación de responsabilidades, testabilidad |
| **Framework** | Express + TypeScript | Madurez + tipado estático |
| **Auth** | JWT (RS256) + Refresh Tokens | Stateless + capacidad de revocación |
| **Passwords** | Argon2id | Algoritmo más seguro actualmente |
| **OAuth** | Authorization Code + PKCE | Flujo más seguro para SPAs y móviles |
| **DB** | PostgreSQL + Redis | ACID + velocidad para cache/sesiones |
| **Deploy** | Docker + GitHub Actions | Portabilidad + automatización |

---

## 📚 Referencias

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [JWT Best Practices (RFC 8725)](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

*Fin del informe - Generado para el proyecto msseguridad*