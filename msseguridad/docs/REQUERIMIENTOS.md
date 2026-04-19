# 📋 DOCUMENTO DE REQUERIMIENTOS
## Microservicio de Seguridad y Autenticación - msseguridad

---

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Proyecto:** msseguridad  
**Tipo:** Elicitación de Requerimientos  

---

## 📑 ÍNDICE

1. [Introducción](#1-introducción)
2. [Requerimientos Funcionales](#2-requerimientos-funcionales)
3. [Requerimientos No Funcionales](#3-requerimientos-no-funcionales)
4. [Reglas de Negocio](#4-reglas-de-negocio)
5. [Casos de Uso](#5-casos-de-uso)
6. [Matriz de Trazabilidad Completa](#6-matríz-de-trazabilidad-completa)
   - 6.1 [Trazabilidad RF → Casos de Uso → Componentes](#61-trazabilidad-rf--casos-de-uso--componentes)
   - 6.2 [Trazabilidad RNF → Requisitos Técnicos](#62-trazabilidad-rnf--requisitos-técnicos)
   - 6.3 [Trazabilidad Reglas de Negocio → Implementación](#63-trazabilidad-reglas-de-negocio--implementación)
   - 6.4 [Trazabilidad Entidades → Tablas DB](#64-trazabilidad-entidades--tablas-db)
   - 6.5 [Trazabilidad Casos de Uso → Endpoints API](#65-trazabilidad-casos-de-uso--endpoints-api)
   - 6.6 [Trazabilidad Riesgos OWASP → Mitigaciones](#66-trazabilidad-riesgos-owasp--mitigaciones)

---

## 1. INTRODUCCIÓN

### 1.1 Propósito

Este documento define los requerimientos funcionales y no funcionales para el desarrollo del microservicio **msseguridad**, encargado de gestionar autenticación, autorización y seguridad para el ecosistema de aplicaciones.

### 1.2 Alcance

El sistema deberá proveer:
- Autenticación de usuarios (login/logout)
- Autorización basada en roles (RBAC) y atributos (ABAC)
- Multi-factor authentication (MFA)
- Soporte OAuth2/OIDC para integración con terceros
- Gestión de sesiones y tokens JWT
- Auditoría de eventos de seguridad

### 1.3 Stakeholders

| Stakeholder | Rol | Interés |
|-------------|-----|---------|
| Usuarios Finales | Utilizar el sistema de forma segura | UX simple, seguridad transparente |
| Administradores | Gestionar usuarios y permisos | Control granular, auditoría |
| Desarrolladores | Integrar sus apps con el servicio | APIs claras, documentación |
| Auditores | Verificar cumplimiento normativo | Logs completos, trazabilidad |
| DevOps | Operar el servicio | Monitoreo, escalabilidad |

### 1.4 Definiciones y Acrónimos

| Término | Definición |
|---------|------------|
| **RF** | Requerimiento Funcional |
| **RNF** | Requerimiento No Funcional |
| **RBAC** | Role-Based Access Control |
| **ABAC** | Attribute-Based Access Control |
| **MFA** | Multi-Factor Authentication |
| **TOTP** | Time-based One-Time Password |
| **JWT** | JSON Web Token |
| **OIDC** | OpenID Connect |
| **SAST** | Static Application Security Testing |
| **DAST** | Dynamic Application Security Testing |

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Módulo de Autenticación

#### RF-001: Registro de Usuarios
**Prioridad:** Alta  
**Descripción:** El sistema debe permitir el registro de nuevos usuarios mediante email y contraseña.

**Criterios de Aceptación:**
- El email debe ser único en el sistema
- La contraseña debe cumplir políticas de seguridad (mínimo 12 caracteres, mayúsculas, minúsculas, números, símbolos)
- Se debe enviar email de verificación antes de activar la cuenta
- El usuario debe confirmar el email dentro de 24 horas

**Flujo:**
```
Usuario → Ingresa email + password → Sistema valida → Envía email → 
Usuario confirma → Cuenta activada
```

#### RF-002: Inicio de Sesión
**Prioridad:** Alta  
**Descripción:** Usuarios registrados pueden iniciar sesión con credenciales válidas.

**Criterios de Aceptación:**
- Validación de email y contraseña
- Bloqueo temporal tras 5 intentos fallidos (15 minutos)
- Notificación por email de intentos sospechosos
- Generación de tokens JWT (access + refresh)

#### RF-003: Cierre de Sesión
**Prioridad:** Alta  
**Descripción:** Permitir cerrar sesión en dispositivo actual o todos los dispositivos.

**Criterios de Aceptación:**
- Revocación inmediata del access token
- Revocación del refresh token
- Opción "Cerrar sesión en todos los dispositivos"
- Registro en audit log

#### RF-004: Recuperación de Contraseña
**Prioridad:** Alta  
**Descripción:** Permitir recuperar acceso mediante email verificado.

**Criterios de Aceptación:**
- Enviar email con link temporal (válido 1 hora)
- Link de un solo uso
- Notificación de cambio de contraseña
- Invalidar sesiones activas tras cambio

#### RF-005: Autenticación Multi-Factor (MFA)
**Prioridad:** Media  
**Descripción:** Soporte opcional de MFA mediante TOTP (Google Authenticator, Authy).

**Criterios de Aceptación:**
- Activación voluntaria por usuario
- Generación de QR para configuración
- Backup codes (10 códigos de recuperación)
- Validación de código TOTP en login
- Opción "Recordar este dispositivo" (30 días)

---

### 2.2 Módulo de Autorización

#### RF-006: Gestión de Roles (RBAC)
**Prioridad:** Alta  
**Descripción:** Sistema de roles para control de acceso basado en roles.

**Criterios de Aceptación:**
- Roles predefinidos: superadmin, admin, user, guest
- Creación de roles personalizados
- Asignación de múltiples roles por usuario
- Jerarquía de roles (herencia de permisos)

**Roles Base:**
| Rol | Descripción | Permisos Base |
|-----|-------------|---------------|
| superadmin | Control total | Todos |
| admin | Gestión de usuarios | users:read, users:update, roles:read |
| user | Usuario estándar | users:read_own, users:update_own |
| guest | Acceso limitado | (ninguno, solo login) |

#### RF-007: Gestión de Permisos (ABAC)
**Prioridad:** Media  
**Descripción:** Permisos granulares basados en recursos y acciones.

**Criterios de Aceptación:**
- Permisos en formato `recurso:acción` (ej: `users:create`, `reports:export`)
- Asignación de permisos a roles
- Soporte para condiciones ABAC (ej: solo usuarios del departamento IT)
- API para verificar permisos en tiempo real

#### RF-008: Verificación de Acceso
**Prioridad:** Alta  
**Descripción:** Endpoints para verificar si un usuario tiene permiso sobre un recurso.

**Criterios de Aceptación:**
- API `/auth/check-permission` para verificación síncrona
- Respuesta en < 50ms
- Soporte para verificación por token JWT
- Caché de permisos en Redis

---

### 2.3 Módulo OAuth2/OIDC

#### RF-009: Soporte OAuth2 Authorization Code + PKCE
**Prioridad:** Alta  
**Descripción:** Implementar flujo Authorization Code con PKCE para aplicaciones SPA y móviles.

**Criterios de Aceptación:**
- Endpoint `/oauth/authorize`
- Endpoint `/oauth/token`
- Soporte PKCE (S256 obligatorio para public clients)
- Validación de redirect_uri
- Scopes configurables por cliente

#### RF-010: Soporte OAuth2 Client Credentials
**Prioridad:** Media  
**Descripción:** Flujo para comunicación server-to-server.

**Criterios de Aceptación:**
- Autenticación con client_id + client_secret
- Scopes limitados a operaciones de API
- Tokens de corta duración (1 hora máximo)
- Sin refresh tokens

#### RF-011: OpenID Connect Discovery
**Prioridad:** Media  
**Descripción:** Endpoints de descubrimiento OIDC.

**Criterios de Aceptación:**
- `/.well-known/openid-configuration`
- `/oauth/.well-known/jwks.json`
- Claims estándar: sub, iss, aud, exp, iat, email, profile

#### RF-012: Gestión de Clientes OAuth2
**Prioridad:** Baja  
**Descripción:** Administración de aplicaciones cliente.

**Criterios de Aceptación:**
- Registrar nuevas aplicaciones
- Configurar redirect_uris permitidos
- Generar client_id y client_secret
- Activar/desactivar clientes

---

### 2.4 Módulo de Gestión de Sesiones

#### RF-013: Gestión de Sesiones Activas
**Prioridad:** Media  
**Descripción:** Usuarios pueden ver y gestionar sus sesiones activas.

**Criterios de Aceptación:**
- Listar dispositivos activos (dispositivo, ubicación, última actividad)
- Cerrar sesión remota de dispositivos específicos
- Notificación al cerrar sesión remota

#### RF-014: Rotación de Refresh Tokens
**Prioridad:** Alta  
**Descripción:** Implementar rotación de refresh tokens por seguridad.

**Criterios de Aceptación:**
- Cada uso de refresh token genera uno nuevo
- Invalidación de token anterior
- Detección de reuso de tokens revocados (posible compromiso)
- Notificación y revocación de familia de tokens si se detecta reuso

#### RF-015: Política de Expiración de Sesiones
**Prioridad:** Media  
**Descripción:** Expiración automática por inactividad.

**Criterios de Aceptación:**
- Access tokens: 15 minutos
- Refresh tokens: 7 días (con rotación)
- Sesiones inactivas: 30 minutos
- Sesiones totales máximo: 7 días

---

### 2.5 Módulo de Auditoría

#### RF-016: Registro de Eventos de Seguridad
**Prioridad:** Alta  
**Descripción:** Log de todos los eventos relevantes de seguridad.

**Eventos a registrar:**
- Login exitoso/fallido
- Logout
- Cambio de contraseña
- Activación/desactivación de MFA
- Asignación de roles
- Creación/eliminación de usuarios
- Bloqueos de cuenta
- Intentos de acceso no autorizados

**Datos a registrar:**
- Timestamp (ISO 8601)
- User ID
- IP address
- User agent
- Tipo de acción
- Resultado (success/failure)
- Detalles adicionales (JSON)

#### RF-017: Consulta de Logs de Auditoría
**Prioridad:** Media  
**Descripción:** API para consultar logs (solo administradores).

**Criterios de Aceptación:**
- Filtrado por usuario, fecha, tipo de evento
- Paginación
- Exportación a CSV/JSON
- Retención: 1 año

#### RF-018: Alertas de Seguridad
**Prioridad:** Media  
**Descripción:** Notificaciones automáticas de eventos sospechosos.

**Alertas configurables:**
- Múltiples login fallidos
- Login desde ubicación inusual
- Cambio de contraseña
- Nuevo dispositivo
- Revocación masiva de tokens

---

### 2.6 Módulo de Usuarios

#### RF-019: Perfil de Usuario
**Prioridad:** Media  
**Descripción:** Gestión de información personal.

**Criterios de Aceptación:**
- Ver perfil propio
- Editar información básica (nombre, avatar)
- Cambiar contraseña
- Configurar preferencias (idioma, zona horaria)

#### RF-020: Gestión de Usuarios (Admin)
**Prioridad:** Alta  
**Descripción:** Administradores pueden gestionar usuarios.

**Criterios de Aceptación:**
- Listar usuarios (con filtros y búsqueda)
- Crear usuarios manualmente
- Editar usuarios
- Desactivar/activar usuarios
- Asignar/remover roles
- Ver sesiones activas del usuario
- Forzar cierre de sesión
- Forzar cambio de contraseña

---

## 3. REQUERIMIENTOS NO FUNCIONALES

### 3.1 Rendimiento

#### RNF-001: Latencia de Autenticación
**Descripción:** Tiempo máximo para operaciones de autenticación.

**Especificaciones:**
| Operación | Latencia Máxima |
|-----------|-----------------|
| Login | < 500ms (p95) |
| Verificación de token | < 50ms (p99) |
| Verificación de permisos | < 50ms (p99) |
| Generación de JWT | < 100ms |
| Refresh token | < 200ms |

#### RNF-002: Throughput
**Descripción:** Capacidad de procesamiento.

**Especificaciones:**
- 1000 logins/segundo
- 5000 verificaciones de token/segundo
- 100 operaciones de administración/segundo

#### RNF-003: Escalabilidad
**Descripción:** Capacidad de crecimiento.

**Especificaciones:**
- Horizontal scaling (stateless)
- Soporte para 100,000 usuarios concurrentes
- 1,000,000 usuarios registrados

### 3.2 Disponibilidad

#### RNF-004: Uptime
**Descripción:** Tiempo de disponibilidad requerido.

**Especificaciones:**
- 99.95% uptime mensual (máximo 21 minutos de downtime)
- Maintenance windows programados
- Zero-downtime deployments

#### RNF-005: Recuperación ante Desastres
**Descripción:** Capacidad de recuperación.

**Especificaciones:**
- RTO (Recovery Time Objective): < 1 hora
- RPO (Recovery Point Objective): < 5 minutos
- Backups automáticos cada 6 horas
- Replicación multi-zona

### 3.3 Seguridad

#### RNF-006: Cifrado
**Descripción:** Cifrado de datos en tránsito y reposo.

**Especificaciones:**
- TLS 1.3 para todas las comunicaciones
- AES-256 para datos en reposo
- Argon2id para hashes de contraseñas
- RSA-2048/4096 o EC P-256 para firmas JWT

#### RNF-007: Gestión de Secretos
**Descripción:** Manejo seguro de credenciales.

**Especificaciones:**
- Nunca hardcodear secrets
- Uso de secret managers (HashiCorp Vault, AWS Secrets Manager)
- Rotación automática de claves JWT cada 90 días
- Variables de entorno para configuración sensible

#### RNF-008: Headers de Seguridad
**Descripción:** Headers HTTP de seguridad obligatorios.

**Especificaciones:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### RNF-009: Rate Limiting
**Descripción:** Protección contra abuso.

**Especificaciones:**
| Endpoint | Límite | Ventana |
|----------|--------|---------|
| /auth/login | 5 intentos | 15 minutos |
| /auth/register | 3 intentos | 1 hora |
| /auth/forgot-password | 3 intentos | 1 hora |
| /oauth/token | 10 requests | 1 minuto |
| API general | 100 requests | 1 minuto |

#### RNF-010: Validación de Inputs
**Descripción:** Sanitización de entradas.

**Especificaciones:**
- Validación estricta de schemas (Joi/Zod)
- Sanitización contra XSS e inyección SQL
- Límite de tamaño de payloads (10KB máximo)
- Validación de Content-Type

#### RNF-011: Cumplimiento Normativo
**Descripción:** Estándares de cumplimiento.

**Especificaciones:**
- OWASP Top 10 compliance
- OWASP ASVS Level 2
- GDPR (derecho al olvido, portabilidad de datos)
- PCI DSS (si procesa pagos)
- SOC 2 Type II (roadmap)

### 3.4 Usabilidad

#### RNF-012: UX de Autenticación
**Descripción:** Experiencia de usuario simple.

**Especificaciones:**
- Login en máximo 2 clicks
- Mensajes de error claros (no exponer información sensible)
- Soporte múltiple idiomas (es, en)
- Diseño responsive
- Compatibilidad con lectores de pantalla (WCAG 2.1 AA)

### 3.5 Mantenibilidad

#### RNF-013: Documentación
**Descripción:** Documentación completa.

**Especificaciones:**
- OpenAPI/Swagger para todas las APIs
- README con instrucciones de setup
- ADRs (Architecture Decision Records)
- Guía de contribución

#### RNF-014: Testing
**Descripción:** Cobertura de tests.

**Especificaciones:**
- 80% cobertura de código mínimo
- Tests unitarios para lógica de negocio
- Tests de integración para APIs
- Tests E2E para flujos críticos
- Tests de seguridad automatizados

#### RNF-015: Monitoreo
**Descripción:** Observabilidad completa.

**Especificaciones:**
- Métricas de aplicación (Prometheus)
- Logging estructurado (JSON)
- Distributed tracing (OpenTelemetry)
- Alertas configurables
- Dashboard de seguridad (intentos de login, bloqueos)

### 3.6 Interoperabilidad

#### RNF-016: APIs REST
**Descripción:** APIs estándar.

**Especificaciones:**
- RESTful APIs
- JSON para payloads
- HTTP status codes estándar
- Versionado de APIs (/api/v1/, /api/v2/)
- Paginación con cursor-based

#### RNF-017: Compatibilidad OAuth2/OIDC
**Descripción:** Estándares abiertos.

**Especificaciones:**
- RFC 6749 (OAuth 2.0)
- RFC 7636 (PKCE)
- RFC 7519 (JWT)
- OpenID Connect Core 1.0

---

## 4. REGlas DE NEGOCIO

### 4.1 Reglas de Autenticación

| ID | Regla | Descripción |
|----|-------|-------------|
| RN-001 | Complejidad de Password | Mínimo 12 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo |
| RN-002 | Historial de Passwords | No permitir reutilizar las últimas 5 contraseñas |
| RN-003 | Expiración de Password | Forzar cambio cada 90 días para usuarios admin |
| RN-004 | Bloqueo de Cuenta | 5 intentos fallidos = bloqueo 15 minutos |
| RN-005 | Sesiones Concurrentes | Máximo 10 sesiones activas por usuario |

### 4.2 Reglas de Autorización

| ID | Regla | Descripción |
|----|-------|-------------|
| RN-006 | Herencia de Roles | Un usuario con rol "admin" hereda todos los permisos de "user" |
| RN-007 | Conflicto de Permisos | Deny explícito prevalece sobre allow |
| RN-008 | Jerarquía | Usuario solo puede gestionar usuarios con menor hierarchy_level |

### 4.3 Reglas de Tokens

| ID | Regla | Descripción |
|----|-------|-------------|
| RN-009 | Vida Access Token | 15 minutos máximo |
| RN-010 | Vida Refresh Token | 7 días con rotación obligatoria |
| RN-011 | Refresh Token Reuse | Detectar reuso = revocar toda la familia de tokens |
| RN-012 | Sesión Inactiva | Expirar después de 30 minutos sin actividad |

### 4.4 Reglas de Auditoría

| ID | Regla | Descripción |
|----|-------|-------------|
| RN-013 | Retención de Logs | 1 año para eventos de seguridad |
| RN-014 | Inmutabilidad | Los logs de auditoría no pueden modificarse |
| RN-015 | Alertas | Notificar a seguridad@empresa.com ante eventos críticos |

---

## 5. CASOS DE USO

### 5.1 Diagrama de Casos de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO                                  │
└────────┬───────────────────────────────┬──────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────────┐
│   Autenticarse  │            │  Gestionar Perfil    │
│                 │            │  - Ver info          │
│  - Registrar    │            │  - Editar info       │
│  - Login        │            │  - Cambiar password  │
│  - Logout       │            │  - Configurar MFA    │
│  - Recuperar    │            └──────────┬───────────┘
│    password     │                       │
└─────────────────┘                       │
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │  Ver Sesiones        │
                              │  - Listar activas    │
                              │  - Cerrar remota     │
                              └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ADMINISTRADOR                               │
└────────┬───────────────────────────────┬──────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────────┐
│ Gestionar       │            │  Gestionar Roles     │
│ Usuarios        │            │  - Crear rol         │
│ - Crear         │            │  - Editar rol        │
│ - Editar        │            │  - Asignar permisos  │
│ - Desactivar    │            │  - Eliminar rol      │
│ - Ver sesiones  │            └──────────────────────┘
│ - Forzar logout │
│ - Asignar roles │
└─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SISTEMA EXTERNO                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ OAuth2/OIDC     │
│ - Register app  │
│ - Authorize     │
│ - Get token     │
│ - Refresh token │
│ - Introspect    │
└─────────────────┘
```

### 5.2 Especificación de Casos de Uso

#### CU-001: Iniciar Sesión con MFA

**Actor:** Usuario  
**Precondición:** Usuario registrado, MFA habilitado  
**Postcondición:** Sesión iniciada, tokens emitidos

**Flujo Principal:**
1. Usuario ingresa email y contraseña
2. Sistema valida credenciales
3. Sistema detecta MFA habilitado
4. Sistema envía código TOTP o solicita código de app
5. Usuario ingresa código MFA
6. Sistema valida código MFA
7. Sistema genera access token y refresh token
8. Sistema registra evento en audit log
9. Sistema retorna tokens al usuario

**Flujo Alternativo 5a - Código incorrecto:**
5a.1 Usuario ingresa código inválido
5a.2 Sistema rechaza código
5a.3 Sistema permite 3 intentos antes de bloquear

**Flujo Alternativo 5b - Backup code:**
5b.1 Usuario selecciona "Usar código de respaldo"
5b.2 Usuario ingresa backup code
5b.3 Sistema valida y marca código como usado

---

#### CU-002: Rotación de Refresh Token

**Actor:** Sistema  
**Precondición:** Usuario con refresh token válido  
**Postcondición:** Nuevo par de tokens emitidos, anterior revocado

**Flujo:**
1. Cliente envía refresh token a /auth/refresh
2. Sistema valida refresh token (hash, expiración, no revocado)
3. Sistema verifica que token no haya sido usado antes (detectar reuso)
4. Sistema genera nuevo access token
5. Sistema genera nuevo refresh token
6. Sistema marca token anterior como revocado (replaced)
7. Sistema asocia nuevo token al mismo family_id
8. Sistema retorna nuevo par de tokens

**Flujo Excepción 3a - Reuso detectado:**
3a.1 Token ya fue usado (comprometido)
3a.2 Sistema revoca TODA la familia de tokens
3a.3 Sistema notifica a usuario (email)
3a.4 Sistema retorna error de autenticación

---

## 6. MATRIZ DE TRAZABILIDAD COMPLETA

### 6.1 Trazabilidad RF → Casos de Uso → Componentes → Arquitectura

| RF ID | Descripción | Caso de Uso | Componente / Servicio | Capa Arquitectura | Entidades / Tablas DB | Prioridad |
|-------|-------------|-------------|----------------------|-------------------|----------------------|-----------|
| **RF-001** | Registro de usuarios | CU-003 | UserService, AuthController | Application / Presentation | `users`, `password_history` | Alta |
| **RF-002** | Login | CU-001 | AuthService, TokenService | Application | `users`, `user_sessions`, `refresh_tokens`, `audit_logs` | Alta |
| **RF-003** | Logout | CU-004 | TokenService, SessionService | Application | `user_sessions`, `refresh_tokens` | Alta |
| **RF-004** | Recuperar password | CU-005 | EmailService, AuthService | Infrastructure / Application | `users`, `audit_logs` | Alta |
| **RF-005** | MFA | CU-001 | MfaService, AuthService | Application | `users`, `mfa_backup_codes` | Media |
| **RF-006** | Roles (RBAC) | CU-006 | RoleService, PermissionService | Application | `roles`, `user_roles` | Alta |
| **RF-007** | Permisos (ABAC) | CU-007 | PermissionService, PermissionEvaluator | Domain / Application | `permissions`, `role_permissions` | Media |
| **RF-008** | Check permission | CU-008 | AuthMiddleware, PermissionService | Infrastructure / Application | `permissions` (cache Redis) | Alta |
| **RF-009** | OAuth2 Auth Code | CU-009 | OAuthService, OAuthController | Application / Presentation | `oauth_clients`, `oauth_authorization_codes` | Alta |
| **RF-010** | Client Credentials | CU-010 | OAuthService | Application | `oauth_clients`, `oauth_access_tokens` | Media |
| **RF-011** | OIDC Discovery | CU-011 | OIDCController | Presentation | (config) | Media |
| **RF-012** | Gestión clientes OAuth | CU-012 | ClientService, AdminController | Application / Presentation | `oauth_clients` | Baja |
| **RF-013** | Sesiones activas | CU-013 | SessionService, UserController | Application / Presentation | `user_sessions` | Media |
| **RF-014** | Rotación tokens | CU-002 | TokenService, TokenRotationService | Domain / Application | `refresh_tokens` | Alta |
| **RF-015** | Expiración sesiones | CU-002 | TokenService, SessionCleanup | Application | `user_sessions`, `refresh_tokens` | Media |
| **RF-016** | Audit logging | Todos | AuditService, AuditLogRepository | Infrastructure | `audit_logs` | Alta |
| **RF-017** | Consulta logs | CU-014 | AuditService, AdminController | Application / Presentation | `audit_logs` | Media |
| **RF-018** | Alertas | Todos | AlertService, SecurityEventService | Infrastructure | `security_events` | Media |
| **RF-019** | Perfil | CU-015 | UserService, UserController | Application / Presentation | `users` | Media |
| **RF-020** | Gestión usuarios (Admin) | CU-006 | AdminController, UserService | Application / Presentation | `users`, `user_roles` | Alta |

### 6.2 Trazabilidad RNF → Requisitos Técnicos → Componentes de Arquitectura

| RNF ID | Requisito | Solución Técnica | Componentes Involucrados | Estado |
|--------|-----------|------------------|-------------------------|--------|
| **RNF-001** | Latencia < 500ms | Redis cache, pool de conexiones, índices optimizados | RedisCluster, QueryOptimizer, ConnectionPool | Diseño |
| **RNF-002** | Throughput 1000 req/s | Horizontal scaling, load balancer, stateless | KubernetesHPA, NginxIngress, PodAutoscaler | Diseño |
| **RNF-003** | Escalabilidad 100K concurrentes | Kubernetes, microservicios, caché distribuida | K8sDeployment, RedisCluster, ServiceMesh | Diseño |
| **RNF-004** | Uptime 99.95% | Multi-zone deployment, health checks, circuit breakers | K8sProbes, IstioCircuitBreaker, MultiAZ | Diseño |
| **RNF-005** | DR (RTO 1h, RPO 5min) | Backups cada 6h, replicación binlog, snapshots | MySQLReplica, VeleroBackup, CronJob | Diseño |
| **RNF-006** | Cifrado AES-256 + TLS 1.3 | Cert-manager, Let's Encrypt, MySQL SSL | CertManager, TLSConfig, MySQLSSL | Implementado |
| **RNF-007** | Secrets management | HashiCorp Vault, external secrets operator | VaultAgent, ExternalSecrets, SealedSecrets | Diseño |
| **RNF-008** | Security headers | Helmet.js middleware configurado | HelmetMiddleware, SecurityHeaders | Implementado |
| **RNF-009** | Rate limiting | express-rate-limit + Redis store | RateLimitMiddleware, RedisStore | Implementado |
| **RNF-010** | Validación de inputs | Joi/Zod schemas, express-validator | ValidationMiddleware, SchemaValidator | Implementado |
| **RNF-011** | Compliance OWASP ASVS | SAST/DAST en CI/CD, pentesting | SonarQube, OWASPZAP, Snyk, Semgrep | Pendiente |
| **RNF-012** | UX multi-idioma | i18n framework, detección de idioma | I18nService, LocaleMiddleware | Diseño |
| **RNF-013** | Documentación API | OpenAPI 3.0, Swagger UI, Redoc | OpenAPIDocs, SwaggerController | En progreso |
| **RNF-014** | Testing 80% cobertura | Jest + Supertest + TestContainers | TestSuite, CoverageReporter, MockExtender | En progreso |
| **RNF-015** | Observability | Prometheus, Grafana, Loki, Jaeger | MetricsCollector, Logger, Tracer | Diseño |
| **RNF-016** | APIs RESTful | Express.js, REST conventions, HATEOAS | RESTController, APIGateway | Implementado |
| **RNF-017** | OAuth2/OIDC | node-oauth2-server, JWT RS256, JWKS | OAuth2Server, JwtService, JwksEndpoint | Implementado |

### 6.3 Trazabilidad Reglas de Negocio → Implementación

| Regla ID | Regla de Negocio | Implementación Técnica | Ubicación Código | Test Asociado |
|----------|------------------|----------------------|------------------|---------------|
| RN-001 | Password 12 chars, complejidad | PasswordPolicyService.validate() | `domain/services/PasswordPolicyService.ts` | `password-policy.test.ts` |
| RN-002 | No reutilizar últimas 5 passwords | PasswordHistoryRepository.check() | `infrastructure/repositories/PasswordHistoryRepository.ts` | `password-history.test.ts` |
| RN-003 | Expiración 90 días admin | Scheduler job + User.passwordChangedAt | `application/jobs/PasswordExpirationJob.ts` | `password-expiration.test.ts` |
| RN-004 | Bloqueo 15 min tras 5 intentos | AuthService.login() + User.failedAttempts | `application/services/AuthService.ts` | `account-lockout.test.ts` |
| RN-005 | Max 10 sesiones concurrentes | SessionService.create() + contador | `application/services/SessionService.ts` | `session-limit.test.ts` |
| RN-006 | Herencia de roles | RoleService.getEffectivePermissions() | `domain/services/PermissionEvaluator.ts` | `role-inheritance.test.ts` |
| RN-007 | Deny prevalece sobre allow | PermissionEvaluator.evaluate() | `domain/services/PermissionEvaluator.ts` | `permission-conflict.test.ts` |
| RN-008 | Jerarquía en gestión | AdminController.checkHierarchy() | `interfaces/http/controllers/AdminController.ts` | `hierarchy-check.test.ts` |
| RN-009 | Access token 15 min | JwtService.sign() con exp | `infrastructure/adapters/JwtAdapter.ts` | `token-expiration.test.ts` |
| RN-010 | Refresh token 7 días | RefreshToken.expiresAt calculado | `domain/entities/RefreshToken.ts` | `refresh-expiration.test.ts` |
| RN-011 | Detección reuso = revocar familia | TokenService.rotate() + detect reuse | `application/services/TokenService.ts` | `token-reuse.test.ts` |
| RN-012 | Sesión inactiva 30 min | Session.touch() + middleware | `infrastructure/http/middleware/SessionTimeout.ts` | `session-timeout.test.ts` |
| RN-013 | Retención logs 1 año | Particionamiento audit_logs + archive | `infrastructure/jobs/LogArchivalJob.ts` | (integration) |
| RN-014 | Logs inmutables | AuditLogRepository append-only | `infrastructure/repositories/AuditLogRepository.ts` | `audit-immutable.test.ts` |
| RN-015 | Alertas automáticas | AlertService.evaluateConditions() | `infrastructure/services/AlertService.ts` | `alert-trigger.test.ts` |

### 6.4 Trazabilidad Entidades de Negocio → Tablas de Base de Datos

| Entidad Dominio | Atributos Principales | Tabla(s) DB | Relaciones | Índices Principales |
|-----------------|----------------------|-------------|------------|---------------------|
| User | id, email, password, status, mfaEnabled, lockedUntil | `users` | 1:N RefreshTokens, Sessions, AuditLogs | `email` (UQ), `status`, `locked_until` |
| Role | id, name, slug, hierarchyLevel, isDefault | `roles` | N:M User (via user_roles), N:M Permission | `slug` (UQ), `hierarchy_level` |
| Permission | id, resource, action, slug, conditions | `permissions` | N:M Role (via role_permissions) | `slug` (UQ), `resource+action` (UQ) |
| RefreshToken | id, tokenHash, familyId, isRevoked, expiresAt | `refresh_tokens` | N:1 User | `token_hash` (UQ), `user_id+is_revoked`, `family_id` |
| UserSession | id, sessionToken, ipAddress, isActive, expiresAt | `user_sessions` | N:1 User, 1:1 RefreshToken | `session_token` (UQ), `user_id+is_active` |
| AuditLog | id, userId, action, resource, status, createdAt | `audit_logs` | N:1 User (nullable) | `user_id+created_at`, `action+created_at` (partitioned) |
| MfaBackupCode | id, codeHash, usedAt | `mfa_backup_codes` | N:1 User | `code_hash` (UQ), `user_id+used_at` |
| OAuthClient | id, clientId, clientSecret, redirectUris, grants | `oauth_clients` | 1:N AuthCodes, AccessTokens | `client_id` (UQ) |
| OAuthAuthCode | id, code, expiresAt, consumedAt, codeChallenge | `oauth_authorization_codes` | N:1 Client, N:1 User | `code` (UQ), `expires_at` |
| OAuthAccessToken | id, token, expiresAt, revokedAt | `oauth_access_tokens` | N:1 Client, N:1 User | `token` (UQ), `expires_at` |
| PasswordHistory | id, passwordHash, changedAt | `password_history` | N:1 User | `user_id+changed_at` |
| SecurityEvent | id, eventType, severity, acknowledged | `security_events` | N:1 User (nullable) | `created_at`, `event_type`, `severity` |

### 6.5 Trazabilidad Casos de Uso → Endpoints API → Tests

| Caso de Uso | Endpoint API | Método HTTP | Componentes Testeados | Tipo de Test |
|-------------|--------------|-------------|----------------------|--------------|
| CU-001 Login | `/auth/login` | POST | AuthController, AuthService, UserRepository | Unit, Integration, E2E |
| CU-001 MFA | `/auth/mfa/verify` | POST | MfaService, TotpAdapter, UserRepository | Unit, Integration |
| CU-002 Refresh Token | `/auth/refresh` | POST | TokenService, TokenRepository, JwtAdapter | Unit, Integration |
| CU-003 Register | `/auth/register` | POST | UserService, EmailAdapter, PasswordPolicy | Unit, Integration, E2E |
| CU-004 Logout | `/auth/logout` | POST | TokenService (revoke), SessionService | Unit, Integration |
| CU-005 Recover Password | `/auth/forgot-password` | POST | EmailService, TokenService (reset token) | Integration |
| CU-006 User CRUD | `/admin/users/*` | CRUD | AdminController, UserService, RoleService | Integration, E2E |
| CU-007 Role Management | `/admin/roles/*` | CRUD | RoleController, PermissionService | Integration |
| CU-008 Check Permission | `/auth/check-permission` | GET | AuthMiddleware, PermissionEvaluator | Unit, Integration |
| CU-009 OAuth Authorize | `/oauth/authorize` | GET | OAuthService, OAuthController | Integration |
| CU-010 OAuth Token | `/oauth/token` | POST | OAuthService, TokenService | Integration |
| CU-011 OIDC Discovery | `/.well-known/openid-configuration` | GET | OIDCController | Unit |
| CU-013 List Sessions | `/users/me/sessions` | GET | SessionService, SessionRepository | Unit, Integration |
| CU-014 Audit Query | `/admin/audit-logs` | GET | AuditService, AuditRepository | Integration |
| CU-015 User Profile | `/users/me` | GET/PATCH | UserController, UserService | Unit, Integration |

### 6.6 Trazabilidad Riesgos de Seguridad → Mitigaciones → Verificación

| Riesgo OWASP | Requisito | Mitigación Implementada | Verificación (Test/Scan) |
|--------------|-----------|------------------------|--------------------------|
| A01 - Broken Access Control | RF-006, RF-007, RF-008 | RBAC + ABAC, middleware auth, least privilege | Unit: permission-evaluator.test.ts |
| A02 - Cryptographic Failures | RNF-006, RN-001 | Argon2id, AES-256, TLS 1.3, RS256 JWT | SAST: SonarQube, Snyk |
| A03 - Injection | RNF-010 | Parameterized queries (TypeORM), input validation | DAST: OWASP ZAP, SQLMap |
| A04 - Insecure Design | RN-004, RN-009, RN-011 | Rate limiting, token rotation, account lockout | Integration: security-ratelimit.test.ts |
| A05 - Security Misconfiguration | RNF-008, RNF-009 | Helmet headers, security middleware, env validation | SAST: ESLint Security |
| A06 - Vulnerable Components | RNF-011 | npm audit, Snyk SCA, Dependabot, SBOM | SCA: Snyk, Trivy |
| A07 - ID and Auth Failures | RF-002, RF-005, RF-014 | MFA, secure session, token rotation, logout | Integration: auth-flow.test.ts |
| A08 - Data Integrity Failures | RN-002, RN-014 | Password history, immutable audit logs, signatures | Unit: audit-immutable.test.ts |
| A09 - Logging Failures | RF-016, RF-017, RF-018 | Structured logging, audit trail, security alerts | Integration: audit-logging.test.ts |
| A10 - SSRF | RNF-010 | URL validation, allowlists, request sanitization | SAST: Semgrep SSRF rules |
| RF-006 | Roles | CU-006 | RoleService | Alta |
| RF-007 | Permisos | CU-007 | PermissionService | Media |
| RF-008 | Check permission | CU-008 | AuthMiddleware | Alta |
| RF-009 | OAuth2 Auth Code | CU-009 | OAuthService | Alta |
| RF-010 | Client Credentials | CU-010 | OAuthService | Media |
| RF-011 | OIDC Discovery | CU-011 | OIDCController | Media |
| RF-012 | Gestión clientes | CU-012 | ClientService | Baja |
| RF-013 | Sesiones activas | CU-013 | SessionService | Media |
| RF-014 | Rotación tokens | CU-002 | TokenService | Alta |
| RF-015 | Expiración sesiones | CU-002 | TokenService | Media |
| RF-016 | Audit logging | Todos | AuditService | Alta |
| RF-017 | Consulta logs | CU-014 | AuditController | Media |
| RF-018 | Alertas | Todos | AlertService | Media |
| RF-019 | Perfil | CU-015 | UserController | Media |
| RF-020 | Gestión usuarios | CU-006 | AdminController | Alta |

### 6.2 Trazabilidad RNF → Requisitos Técnicos

| RNF ID | Requisito | Solución Técnica | Estado |
|--------|-----------|------------------|--------|
| RNF-001 | Latencia | Redis cache, índices DB, conexiones pool | Diseño |
| RNF-002 | Throughput | Horizontal scaling, load balancer | Diseño |
| RNF-003 | Escalabilidad | Kubernetes, stateless design | Diseño |
| RNF-004 | Uptime | Multi-zone deployment, health checks | Diseño |
| RNF-005 | DR | Backups automatizados, replicación DB | Diseño |
| RNF-006 | Cifrado | TLS 1.3, AES-256, Argon2id, RS256 | Implementado |
| RNF-007 | Secrets | Vault integration, env vars | Diseño |
| RNF-008 | Headers | Helmet.js middleware | Implementado |
| RNF-009 | Rate limiting | express-rate-limit | Implementado |
| RNF-010 | Validación | Joi/Zod schemas | Implementado |
| RNF-011 | Compliance | OWASP ASVS checklist | Pendiente |
| RNF-012 | UX | Frontend SPA, i18n | Diseño |
| RNF-013 | Documentación | OpenAPI, ADRs | En progreso |
| RNF-014 | Testing | Jest, 80% coverage | En progreso |
| RNF-015 | Monitoreo | Prometheus, Grafana, ELK | Diseño |
| RNF-016 | APIs REST | Express.js, REST conventions | Implementado |
| RNF-017 | OAuth2 | oauth2-server library | Implementado |

---

## 📎 ANEXOS

### Anexo A: Glosario de Términos de Negocio

| Término | Definición |
|---------|------------|
| **Usuario** | Persona que interactúa con el sistema, identificada por email |
| **Cuenta** | Registro de usuario en el sistema con sus credenciales |
| **Sesión** | Período de interacción autenticada entre usuario y sistema |
| **Token** | Credencial digital que representa la autenticación del usuario |
| **Rol** | Conjunto de permisos asignados a un grupo de usuarios |
| **Permiso** | Autorización para realizar una acción sobre un recurso |
| **Cliente OAuth** | Aplicación registrada que consume APIs OAuth2 |

### Anexo B: Prioridades

| Prioridad | Definición |
|-----------|------------|
| **Alta** | Crítico para el funcionamiento básico. Debe estar en MVP. |
| **Media** | Importante pero no bloqueante. Puede esperar a v1.1. |
| **Baja** | Deseable pero no esencial. Roadmap futuro. |

### Anexo C: Versionado

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Abril 2026 | Arquitecto | Documento inicial |

---

*Fin del Documento de Requerimientos*
