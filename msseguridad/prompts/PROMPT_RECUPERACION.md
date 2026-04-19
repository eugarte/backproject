# PROMPT DE RECUPERACIÓN - msseguridad

## 🎯 Propósito de este Prompt

Este documento contiene TODO el contexto necesario para reconstruir completamente el proyecto `msseguridad` (microservicio de seguridad y autenticación) si se pierde toda la documentación. Ejecutar este prompt en una sesión fresca de OpenClaw debería permitir regenerar idéntica toda la documentación técnica.

---

## 📋 CONTEXTO DEL PROYECTO

### Información del Repositorio
- **Repositorio GitHub**: `https://github.com/eugarte/msseguridad`
- **Rama principal**: `main`
- **Estructura de carpetas**:
  ```
  msseguridad/
  ├── docs/                    # Documentación técnica
  │   ├── INFORME_ARQUITECTURA.md
  │   ├── PROPUESTA_IMPLEMENTACION.md
 │   ├── REQUERIMIENTOS.md
  │   ├── HERRAMIENTAS_CALIDAD_SEGURIDAD.md
  │   ├── MODELO_DATOS_MYSQL_NODEJS.md
  │   └── DOCUMENTOS_SALIDA.md
  ├── prompts/                 # Este archivo
  │   └── PROMPT_RECUPERACION.md
  └── src/                     # Código fuente (futuro)
  ```

### Stack Tecnológico Definido
- **Runtime**: Node.js 20 LTS
- **Lenguaje**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Base de Datos**: MySQL 8.0 (cambiado de PostgreSQL original)
- **ORM**: TypeORM 0.3.x
- **Caché**: Redis 7
- **Password Hashing**: Argon2id (ganador PHC, OWASP recomendado)
- **JWT**: RS256 (asimétrico, jose/jsonwebtoken)
- **MFA**: TOTP con speakeasy
- **Arquitectura**: Clean Architecture + Hexagonal

---

## 🏗️ ARQUITECTURA DEFINIDA

### Patrón: Clean Architecture + Hexagonal

#### Estructura de Capas
```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Interfaces)                          │
│  ├─ Controllers (AuthController, UserController, etc.)     │
│  ├─ Middlewares (Auth, RateLimit, Validation, Logger)     │
│  ├─ Routes (auth.routes.ts, admin.routes.ts)              │
│  └─ DTOs / Request-Response types                          │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER (Casos de Uso)                         │
│  ├─ Services (AuthService, UserService, TokenService)      │
│  ├─ Use Cases (Login, Register, RefreshToken, etc.)        │
│  ├─ Ports / Interfaces de entrada                          │
│  └─ Command Handlers / Query Handlers                      │
├─────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER (Núcleo de Negocio)                           │
│  ├─ Entities (User, Role, Permission, RefreshToken, etc.)│
│  ├─ Value Objects (Email, Password, Token)                  │
│  ├─ Domain Services (PermissionEvaluator, TokenRotation) │
│  ├─ Repository Interfaces (IUserRepository, etc.)            │
│  └─ Domain Events (UserCreated, TokenRevoked, etc.)        │
├─────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (Adaptadores)                         │
│  ├─ Repositories (TypeOrmUserRepository, etc.)             │
│  ├─ Adapters (Argon2Adapter, JwtAdapter, TotpAdapter)       │
│  ├─ External Services (EmailService, AuditLogger)          │
│  └─ Config (Database, Redis, Environment)                   │
└─────────────────────────────────────────────────────────────┘
```

#### Reglas de Dependencia
- Las capas internas NO dependen de las externas
- Las dependencias apuntan hacia el centro (Domain)
- Se usa Inversión de Dependencias (interfaces/ports)

---

## 🗄️ MODELO DE DATOS MYSQL

### 12 Tablas Principales

1. **users** - Usuarios del sistema
   - id (UUID PK), email (UQ), password_hash, status, mfa_enabled, mfa_secret
   - failed_attempts, locked_until, password_changed_at, created_at, updated_at

2. **roles** - Roles RBAC
   - id (UUID PK), name, slug (UQ), description, hierarchy_level, is_default

3. **permissions** - Permisos ABAC
   - id (UUID PK), resource, action, slug (UQ), conditions (JSON), description

4. **user_roles** - Relación N:M usuarios-roles
   - user_id (FK), role_id (FK), granted_at, granted_by

5. **role_permissions** - Relación N:M roles-permisos
   - role_id (FK), permission_id (FK), granted_at

6. **refresh_tokens** - Tokens de refresco (family pattern)
   - id (UUID PK), user_id (FK), token_hash (UQ), family_id
   - is_revoked, revoked_reason, expires_at, created_at

7. **user_sessions** - Sesiones activas
   - id (UUID PK), user_id (FK), session_token (UQ), ip_address
   - user_agent, device_info, country, city, is_active, last_activity, expires_at

8. **audit_logs** - Logs de auditoría (particionado)
   - id (BIGINT PK), user_id (FK nullable), action, resource, resource_id
   - details (JSON), ip_address, user_agent, status, created_at

9. **mfa_backup_codes** - Códigos de respaldo MFA
   - id (UUID PK), user_id (FK), code_hash (UQ), used_at

10. **oauth_clients** - Clientes OAuth2
    - id (UUID PK), client_id (UQ), client_secret, name, redirect_uris (JSON)
    - allowed_grants (JSON), scopes, is_active, created_at

11. **oauth_authorization_codes** - Códigos de autorización OAuth2
    - id (UUID PK), code (UQ), client_id (FK), user_id (FK)
    - redirect_uri, code_challenge, code_challenge_method, expires_at, consumed_at

12. **password_history** - Historial de contraseñas (RN-002)
    - id (UUID PK), user_id (FK), password_hash, changed_at

13. **security_events** - Eventos de seguridad para alertas
    - id (UUID PK), user_id (FK nullable), event_type, severity, details (JSON)
    - acknowledged, created_at

### Índices Críticos
- `users.email` (UQ)
- `users.status + locked_until` (búsquedas por estado)
- `refresh_tokens.token_hash` (UQ)
- `refresh_tokens.user_id + is_revoked` (listado)
- `audit_logs.user_id + created_at` (consultas auditoría)
- `audit_logs.action + created_at` (particionamiento)

### Roles por Defecto (Seed Data)
```sql
-- Superadmin (hierarchy 100)
INSERT INTO roles (id, name, slug, hierarchy_level) VALUES 
('11111111-1111-1111-1111-111111111111', 'Superadmin', 'superadmin', 100);

-- Administrator (hierarchy 50)
INSERT INTO roles (id, name, slug, hierarchy_level) VALUES 
('22222222-2222-2222-2222-222222222222', 'Administrator', 'admin', 50);

-- User (hierarchy 10, is_default=true)
INSERT INTO roles (id, name, slug, hierarchy_level, is_default) VALUES 
('33333333-3333-3333-3333-333333333333', 'User', 'user', 10, true);

-- Guest (hierarchy 0)
INSERT INTO roles (id, name, slug, hierarchy_level) VALUES 
('44444444-4444-4444-4444-444444444444', 'Guest', 'guest', 0);
```

---

## 📄 DOCUMENTOS A GENERAR

### 1. INFORME_ARQUITECTURA.md

**Secciones obligatorias**:
1. Resumen Ejecutivo
2. Contexto de Negocio (stakeholders, objetivos)
3. Arquitectura de Alto Nivel
   - Diagrama de Contexto (C4 Level 1)
   - Diagrama de Contenedores (C4 Level 2)
4. Arquitectura de Software
   - Diagrama de Componentes (C4 Level 3)
   - Patrón Clean Architecture explicado
5. Modelo de Datos
   - Diagrama ER conceptual
   - Descripción de entidades
6. Seguridad
   - OWASP Top 10 mitigaciones
   - Flujo de autenticación (JWT + MFA)
   - OAuth2/OIDC flows
7. Infraestructura
   - Diagrama de despliegue
   - Kubernetes manifests básicos

### 2. PROPUESTA_IMPLEMENTACION.md

**Secciones obligatorias**:
1. Visión General (principios arquitectónicos)
2. Arquitectura de Negocio (contexto, casos de uso)
3. Arquitectura Técnica
   - 3.1 Vista de Componentes (capas Clean Architecture)
   - 3.2 Diseño Detallado de Componentes (clases, interfaces, dependencias)
   - 3.3 Modelo Entidad-Relación de Base de Datos
   - 3.4 Flujo de Datos
   - 3.5 Diagrama de Despliegue
   - 3.6 Arquitectura de Seguridad (4 capas: Perimeter, Network, App, Data)
   - **3.7 Diagramas UML**:
     - 3.7.1 Diagrama de Casos de Uso (actores: Usuario, Admin, Sistema Externo)
     - 3.7.2 Diagrama de Clases (Dominio + Aplicación + Infraestructura)
     - 3.7.3 Diagramas de Secuencia (Login MFA, Token Rotation, OAuth2)
     - 3.7.4 Diagrama de Actividades (Proceso de Autenticación)
     - 3.7.5 Diagrama de Estado (Refresh Token Lifecycle, User Account, MFA)
     - 3.7.6 Diagrama de Componentes de Despliegue (K8s, Observability)
4. Stack Tecnológico (tabla de justificación con alternativas)
5. Herramientas de Construcción (IDE, CI/CD, calidad)
6. Ciclo de Vida de Software (branching, commits, releases)
7. DevOps y Operaciones (monitoreo, backups, runbooks)
8. Plan de Implementación (roadmap 18 semanas)

### 3. REQUERIMIENTOS.md

**Secciones obligatorias**:
1. Introducción
2. **Requerimientos Funcionales** (20 RFs):
   - RF-001: Registro de usuarios
   - RF-002: Login
   - RF-003: Logout
   - RF-004: Recuperar password
   - RF-005: MFA
   - RF-006: Roles (RBAC)
   - RF-007: Permisos (ABAC)
   - RF-008: Check permission
   - RF-009: OAuth2 Auth Code
   - RF-010: Client Credentials
   - RF-011: OIDC Discovery
   - RF-012: Gestión clientes OAuth
   - RF-013: Sesiones activas
   - RF-014: Rotación tokens
   - RF-015: Expiración sesiones
   - RF-016: Audit logging
   - RF-017: Consulta logs
   - RF-018: Alertas
   - RF-019: Perfil usuario
   - RF-020: Gestión usuarios (Admin)

3. **Requerimientos No Funcionales** (17 RNFs):
   - RNF-001: Latencia < 500ms
   - RNF-002: Throughput 1000 req/s
   - RNF-003: Escalabilidad 100K concurrentes
   - RNF-004: Uptime 99.95%
   - RNF-005: DR (RTO 1h, RPO 5min)
   - RNF-006: Cifrado AES-256 + TLS 1.3
   - RNF-007: Secrets management
   - RNF-008: Security headers
   - RNF-009: Rate limiting
   - RNF-010: Validación de inputs
   - RNF-011: Compliance OWASP ASVS
   - RNF-012: UX multi-idioma
   - RNF-013: Documentación API
   - RNF-014: Testing 80% cobertura
   - RNF-015: Observability
   - RNF-016: APIs REST
   - RNF-017: OAuth2/OIDC compatibilidad

4. **Reglas de Negocio** (15 RNs):
   - RN-001: Password complejidad (12 chars, mayúscula, minúscula, número, símbolo)
   - RN-002: Historial passwords (no últimas 5)
   - RN-003: Expiración 90 días (admin)
   - RN-004: Bloqueo 15min tras 5 intentos
   - RN-005: Máximo 10 sesiones concurrentes
   - RN-006: Herencia de roles
   - RN-007: Deny prevalece sobre allow
   - RN-008: Jerarquía en gestión
   - RN-009: Access token 15 minutos
   - RN-010: Refresh token 7 días
   - RN-011: Detección reuso = revocar familia
   - RN-012: Sesión inactiva 30 min
   - RN-013: Retención logs 1 año
   - RN-014: Logs inmutables
   - RN-015: Alertas automáticas

5. Casos de Uso (diagrama y especificaciones CU-001 a CU-015)
6. **Matriz de Trazabilidad Completa**:
   - 6.1: RF → Casos de Uso → Componentes → Arquitectura → Entidades DB
   - 6.2: RNF → Soluciones Técnicas → Componentes
   - 6.3: Reglas → Implementación en código → Tests
   - 6.4: Entidades → Tablas DB → Índices
   - 6.5: Casos de Uso → Endpoints API → Tests
   - 6.6: OWASP Top 10 → Mitigaciones → Verificación

### 4. HERRAMIENTAS_CALIDAD_SEGURIDAD.md

**Secciones obligatorias**:
1. SonarQube (instalación Docker, Kubernetes, configuración proyectos)
2. Alternativas Open Source a Veracode:
   - Snyk (SCA, SAST, Container)
   - OWASP Dependency-Check
   - Semgrep (SAST)
   - Bandit (Python)
   - SpotBugs + FindSecBugs (Java)
   - Trivy (Container scanning)
   - Grype (Container scanning)
   - OWASP ZAP (DAST)
3. Generación Automática de Tests:
   - GitHub Copilot
   - CodiumAI / Codiumate
   - Diffblue Cover (Java)
   - EvoSuite (Java)
   - Pynguin (Python)
   - Randoop (Java)
4. Frameworks de Pruebas:
   - JUnit 5 + AssertJ + Mockito (Java)
   - pytest (Python)
   - Jest + Supertest (Node.js)
   - TestContainers (integración)
   - Karate (API testing)
5. Herramientas DevOps:
   - GitLab CI (pipelines seguras)
   - GitHub Actions (SAST/DAST)
   - Jenkins (SecDevOps)
   - ArgoCD (GitOps)
   - Terraform (IaC)
6. Integración completa en pipeline CI/CD
7. Makefile unificado
8. Docker Compose de monitoreo (SonarQube, Prometheus, Grafana)

### 5. MODELO_DATOS_MYSQL_NODEJS.md

**Secciones obligatorias**:
1. Resumen del Modelo de Datos
2. Stack Tecnológico (MySQL 8.0 + TypeORM)
3. Diagrama Entidad-Relación (ASCII art con todas las tablas)
4. **Tablas Detalladas** (12 tablas con DDL completo):
   - Estructura completa
   - Tipos de datos
   - Constraints (PK, FK, UQ, CHECK)
   - Índices optimizados
   - Comentarios
5. **Entidades TypeORM** (código TypeScript):
   - Decoradores @Entity, @Column, @PrimaryGeneratedColumn
   - Relaciones (@OneToMany, @ManyToOne, @ManyToMany, @JoinTable)
   - Validaciones con class-validator
   - Hooks @BeforeInsert, @BeforeUpdate
6. Diagrama relaciones (ASCII)
7. Políticas de retención y mantenimiento (stored procedures)
8. Herramientas compatibles con Node.js (matrix de compatibilidad)
9. Scripts de seed data (roles por defecto)
10. Preguntas frecuentes

### 6. DOCUMENTOS_SALIDA.md

**Secciones obligatorias**:
1. Resumen de la Fase de Construcción
2. **Documentación Técnica**:
   - API Reference (OpenAPI 3.0 / Swagger)
   - Architecture Decision Records (ADRs)
   - Database Schema Documentation
   - Deployment Guide
   - Security Runbook
   - Performance Testing Results
3. **Documentación de Operaciones**:
   - Runbooks (incident response, backup/restore, scaling)
   - Monitoring Setup Guide
   - Alerting Configuration
4. **Documentación de Seguridad**:
   - Security Assessment Report
   - Penetration Testing Report
   - OWASP ASVS Checklist
   - Compliance Matrix (GDPR, SOC2)
5. **Documentación de Usuario**:
   - Integration Guide (SDK usage)
   - Admin Dashboard Manual
   - Troubleshooting Guide
   - FAQ
6. Checklist de Aceptación

---

## 🔐 CARACTERÍSTICAS DE SEGURIDAD IMPLEMENTADAS

### Autenticación
- JWT con RS256 (asimétrico, par de claves)
- Refresh tokens con "family pattern" (detección de reuso)
- MFA TOTP (Time-based One-Time Password)
- Códigos de respaldo MFA (10 códigos de un solo uso)
- Session management con Redis

### Autorización
- RBAC (Role-Based Access Control) - roles jerárquicos
- ABAC (Attribute-Based Access Control) - condiciones dinámicas
- OAuth2 flows: Authorization Code + PKCE, Client Credentials
- OIDC Discovery endpoint

### Seguridad de Datos
- Argon2id para passwords (winner PHC 2015)
- AES-256 para datos sensibles en reposo
- TLS 1.3 para datos en tránsito
- Hashing de tokens (no almacenar tokens planos)

### Protección contra Ataques
- Rate limiting por IP y por usuario
- Account lockout tras 5 intentos fallidos
- Validación estricta de inputs (Joi/Zod)
- Security headers (Helmet.js)
- CSRF protection
- SQL injection prevention (parameterized queries)
- XSS protection

### Auditoría
- Audit logging inmutable (append-only)
- Eventos de seguridad (failed logins, token reuse, etc.)
- Retención 1 año con particionamiento
- Alertas automáticas (webhooks/email)

---

## 🛠️ HERRAMIENTAS DE DESARROLLO

### Obligatorias para empezar
1. **Runtime**: Node.js 20 LTS, npm 10+
2. **Bases de Datos**: MySQL 8.0, Redis 7 (Docker)
3. **Testing**: Jest, Supertest, ts-jest
4. **Calidad**: ESLint, Prettier, Husky, lint-staged
5. **IDE**: VS Code con extensiones ESLint, Prettier, REST Client, Docker

### Recomendadas
- SonarQube (análisis estático)
- Snyk (SCA - dependencias)
- Docker + Docker Compose
- kubectl (para K8s)
- Prometheus + Grafana (monitoreo)

---

## 📊 DIAGRAMAS UML A INCLUIR (ASCII ART)

### 1. Casos de Uso
- Actores: Usuario Final, Administrador, Sistema Externo
- Casos: Login, Register, Logout, MFA, User CRUD, Role CRUD, OAuth flows
- Relaciones: <<include>>, <<extend>>

### 2. Clases
- Entidades: User, Role, Permission, RefreshToken, UserSession, AuditLog
- Value Objects: Email, Password, Token, GeoLocation
- Interfaces: IAuthService, ITokenService, IUserRepository
- Adaptadores: Argon2Adapter, JwtAdapter, TypeOrmUserRepository

### 3. Secuencia
- Login con MFA (paso a paso con TOTP)
- Rotación de Refresh Token (family pattern, detección reuso)
- OAuth2 Authorization Code + PKCE

### 4. Actividades
- Proceso de Autenticación completo (decisiones, forks, async)

### 5. Estado
- Refresh Token Lifecycle (ACTIVE → USED_ONCE → REUSE_DETECT → REVOKE_ALL)
- User Account (PENDING → ACTIVE ←→ LOCKED/BLOCKED/SUSPENDED)
- MFA Verification (MFA_DISABLED → MFA_SETUP → MFA_ENABLED ←→ MFA_VERIFY)

### 6. Componentes de Despliegue
- Kubernetes: Ingress, Deployment, HPA
- Bases de Datos: MySQL StatefulSet, Redis Cluster
- Observabilidad: Prometheus, Grafana, Loki, Jaeger
- External Services: SMTP, Vault, SonarQube

---

## 📝 CONTENIDO ESPECÍFICO DE CADA DOCUMENTO

### INFORME_ARQUITECTURA.md - Contenido Detallado

```markdown
# INFORME DE ARQUITECTURA DE SOFTWARE
## Microservicio de Seguridad y Autenticación - msseguridad

1. RESUMEN EJECUTIVO
   - Propósito: Servicio de auth centralizado OAuth2/OIDC
   - Alcance: Autenticación, autorización, MFA, audit
   - Stakeholders: Devs, Admins, Auditores, DevOps

2. CONTEXTO DE NEGOCIO
   - Ecosistema de aplicaciones (Web, Mobile, APIs)
   - Posición: Capa de seguridad transversal
   - Stakeholder map con expectativas

3. ARQUITECTURA DE ALTO NIVEL (C4 Model)
   - Diagrama de Contexto (Level 1)
   - Diagrama de Contenedores (Level 2)

4. ARQUITECTURA DE SOFTWARE (Level 3)
   - Clean Architecture + Hexagonal
   - 4 capas: Presentation, Application, Domain, Infrastructure
   - Reglas de dependencia

5. MODELO DE DATOS
   - Diagrama ER conceptual
   - 12 tablas principales
   - Justificación MySQL vs PostgreSQL

6. SEGURIDAD
   - Autenticación: JWT + MFA + OAuth2
   - Autorización: RBAC + ABAC
   - OWASP Top 10 mitigaciones

7. INFRAESTRUCTURA
   - Kubernetes deployment
   - Monitoreo: Prometheus + Grafana
   - CI/CD: GitHub Actions
```

### PROPUESTA_IMPLEMENTACION.md - Contenido Detallado

```markdown
# PROPUESTA DE IMPLEMENTACIÓN

1. VISIÓN GENERAL
   - Objetivo: Microservicio auth robusto y escalable
   - Principios: Security by Design, Zero Trust, Least Privilege

2. ARQUITECTURA DE NEGOCIO
   - Contexto de negocio (ASCII diagram)
   - Funcionalidades principales
   - Procesos de negocio

3. ARQUITECTURA TÉCNICA
   3.1 Vista de Componentes (Clean Architecture ASCII)
   3.2 Diseño Detallado de Componentes
       - 4 capas con componentes específicos
       - Interfaces y dependencias
   3.3 Modelo Entidad-Relación
       - 12 tablas con relaciones
       - DDL MySQL completo
       - Entidades TypeORM
   3.4 Flujo de Datos
       - Secuencia auth completa
   3.5 Diagrama de Despliegue
       - Kubernetes architecture
   3.6 Arquitectura de Seguridad (4 capas)
       - CAPA 1: PERIMETER (WAF, DDoS, DNS)
       - CAPA 2: NETWORK (TLS, mTLS, Network policies)
       - CAPA 3: APPLICATION (Auth, RBAC, Rate limiting)
       - CAPA 4: DATA (Encryption, Masking, Backup)
   3.7 Diagramas UML (ver sección específica arriba)

4. STACK TECNOLÓGICO
   - Tabla completa con justificaciones
   - package.json completo

5. HERRAMIENTAS DE CONSTRUCCIÓN
   - VS Code + extensiones
   - ESLint, Prettier, Husky
   - Testing: Jest, Supertest
   - CI/CD: GitHub Actions workflow

6. CICLO DE VIDA DE SOFTWARE
   - Branching strategy (GitFlow)
   - Conventional Commits
   - Semantic Versioning

7. DEVOPS Y OPERACIONES
   - Terraform estructura
   - Kubernetes manifests
   - Observability stack
   - Backup strategy

8. PLAN DE IMPLEMENTACIÓN
   - Roadmap 18 semanas (3 fases)
   - Estimación de esfuerzo
   - Riesgos y mitigaciones
```

---

## 🎨 ESTILO DE LOS DIAGRAMAS ASCII

Todos los diagramas deben usar el estilo visual consistente:

### Cajas y Conectores
```
Simple:     ┌─────────┐    Complex:   ┌─────────────────────┐
            │  Text   │               │                     │
            └────┬────┘               │   Component Name  │
                 │                     │   • Detail 1      │
                 ▼                     │   • Detail 2      │
            ┌─────────┐               └─────────────────────┘
            │  Next   │
            └─────────┘

Flechas: ───▶  (flujo)    ◀───▶ (bidireccional)    │ (vertical)
         ───┼─── (split)      ─┬─ (join)
```

### Colores/Tipos de Componentes
```
«entity»     - Entidades de dominio (User, Role)
«value»      - Value Objects (Email, Password)
«interface»  - Interfaces/Ports
«adapter»    - Adaptadores de infraestructura
«database»   - Bases de datos
«artifact»   - Artefactos de deploy
```

---

## 🔧 COMANDOS IMPORTANTES

### Git
```bash
# Estructura de commits
<type>(<scope>): <description>

# Tipos:
feat:     Nueva feature
fix:      Bug fix
docs:     Documentación
style:    Formato (no código)
refactor: Refactorización
test:     Tests
chore:    Tareas de mantenimiento
```

### Docker
```bash
# Desarrollo local
docker-compose -f docker-compose.dev.yml up -d

# SonarQube local
docker run -d -p 9000:9000 sonarqube:community

# MySQL + Redis
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## ✅ CHECKLIST ANTES DE ENTREGAR

### Para cada documento verificar:
- [ ] Índice completo con anchors
- [ ] Diagramas ASCII legibles
- [ ] Tablas formateadas correctamente
- [ ] Código con syntax highlighting
- [ ] Todos los enlaces internos funcionan
- [ ] Numeración de secciones correcta
- [ ] Consistencia de términos
- [ ] Sin placeholders (TODO, FIXME)

### Estructura de carpetas final:
```
msseguridad/
├── docs/
│   ├── INFORME_ARQUITECTURA.md        (33 KB aprox)
│   ├── PROPUESTA_IMPLEMENTACION.md    (120+ KB aprox)
│   ├── REQUERIMIENTOS.md              (40+ KB aprox)
│   ├── HERRAMIENTAS_CALIDAD_SEGURIDAD.md (35+ KB aprox)
│   ├── MODELO_DATOS_MYSQL_NODEJS.md   (60+ KB aprox)
│   └── DOCUMENTOS_SALIDA.md           (20+ KB aprox)
├── prompts/
│   └── PROMPT_RECUPERACION.md         (este archivo)
└── src/                               # (futuro)
```

---

## 🎯 INSTRUCCIONES DE USO DE ESTE PROMPT

### Para regenerar todo:
1. Crear workspace limpio: `/root/.openclaw/workspace/msseguridad`
2. Ejecutar este prompt completo
3. Verificar que los 6 documentos se crean en `docs/`
4. Subir a GitHub: `eugarte/msseguridad`
5. Confirmar que todos los commits se realizan correctamente

### Orden de generación recomendado:
1. **INFORME_ARQUITECTURA.md** - Base conceptual
2. **HERRAMIENTAS_CALIDAD_SEGURIDAD.md** - Herramientas
3. **MODELO_DATOS_MYSQL_NODEJS.md** - Base de datos
4. **REQUERIMIENTOS.md** - Requerimientos funcionales
5. **PROPUESTA_IMPLEMENTACION.md** - Integración de todo (más complejo)
6. **DOCUMENTOS_SALIDA.md** - Checklist final

---

## 📌 DATOS ESPECÍFICOS DEL PROYECTO

### Identificadores Fijos
- **UUIDs de roles**:
  - Superadmin: `11111111-1111-1111-1111-111111111111`
  - Administrator: `22222222-2222-2222-2222-222222222222`
  - User: `33333333-3333-3333-3333-333333333333`
  - Guest: `44444444-4444-4444-4444-444444444444`

### Puertos Estándar
- App: `3000`
- MySQL: `3306`
- Redis: `6379`
- SonarQube: `9000`
- Prometheus: `9090`
- Grafana: `3000` (o `3001` si conflicto con app)

### Versiones Exactas
- Node.js: `20.x` (LTS)
- TypeScript: `5.3.x`
- TypeORM: `0.3.x`
- MySQL: `8.0`
- Redis: `7.x`

### Nombres de Tablas (snake_case)
```
users, roles, permissions, user_roles, role_permissions,
refresh_tokens, user_sessions, audit_logs, mfa_backup_codes,
oauth_clients, oauth_authorization_codes, oauth_access_tokens,
password_history, security_events
```

---

## 🚀 FIN DEL PROMPT

Este prompt contiene toda la información necesaria para reconstruir el proyecto `msseguridad` desde cero. 

**Fecha de creación**: 2026-04-16  
**Versión del prompt**: 1.0  
**Autor**: ZagaloAI (Meme Zoomer mode)
