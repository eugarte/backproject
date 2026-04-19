# 🏗️ PROPUESTA DE IMPLEMENTACIÓN
## Microservicio de Seguridad y Autenticación - msseguridad

---

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Autor:** Equipo de Arquitectura  
**Estado:** Propuesta Técnica  

---

## 📑 ÍNDICE

1. [Visión General](#1-visión-general)
2. [Arquitectura de Negocio](#2-arquitectura-de-negocio)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
   - 3.1 [Vista de Componentes (Capas)](#31-vista-de-componentes)
   - 3.2 [Diseño Detallado de Componentes](#32-diseño-detallado-de-componentes)
   - 3.3 [Modelo Entidad-Relación de Base de Datos](#33-modelo-entidad-relación-de-base-de-datos)
   - 3.4 [Flujo de Datos](#34-flujo-de-datos)
   - 3.5 [Diagrama de Despliegue](#35-diagrama-de-despliegue)
   - 3.6 [Arquitectura de Seguridad](#36-arquitectura-de-seguridad)
   - 3.7 [Diagramas UML](#37-diagramas-uml)
     - 3.7.1 [Diagrama de Casos de Uso](#371-diagrama-de-casos-de-uso)
     - 3.7.2 [Diagrama de Clases](#372-diagrama-de-clases)
     - 3.7.3 [Diagramas de Secuencia](#373-diagramas-de-secuencia)
     - 3.7.4 [Diagrama de Actividades](#374-diagrama-de-actividades)
     - 3.7.5 [Diagrama de Estado](#375-diagrama-de-estado)
     - 3.7.6 [Diagrama de Componentes de Despliegue](#376-diagrama-de-componentes-de-despliegue)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Herramientas de Construcción](#5-herramientas-de-construcción)
6. [Ciclo de Vida de Software](#6-ciclo-de-vida-de-software)
7. [DevOps y Operaciones](#7-devops-y-operaciones)
8. [Plan de Implementación](#8-plan-de-implementación)

---

## 1. VISIÓN GENERAL

### 1.1 Objetivo del Proyecto

Implementar un **microservicio de seguridad y autenticación** robusto, escalable y compatible con estándares OAuth2/OIDC, que sirva como pilar de seguridad para todo el ecosistema de aplicaciones.

### 1.2 Principios Arquitectónicos

| Principio | Descripción |
|-----------|-------------|
| **Seguridad por Diseño** | Cada componente considera seguridad desde su concepción |
| **Zero Trust** | Nunca confiar, siempre verificar |
| **Least Privilege** | Mínimos privilegios necesarios |
| **Defense in Depth** | Múltiples capas de seguridad |
| **Stateless** | Servicio sin estado para escalabilidad horizontal |
| **API-First** | Diseño orientado a APIs RESTful |

### 1.3 Stakeholders y Expectativas

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAPA DE STAKEHOLDERS                        │
└─────────────────────────────────────────────────────────────────┘

Desarrolladores                          Usuarios Finales
├── APIs claras y documentadas         ├── Experiencia simple
├── SDKs disponibles                     ├── Seguridad transparente
├── Logs de debug útiles               └── Acceso rápido

Administradores                        Auditores/Legal
├── Dashboard de gestión               ├── Logs inmutables
├── Alertas de seguridad               ├── Cumplimiento GDPR/SOC2
└── Reportes de auditoría                └── Retención garantizada

DevOps/SRE                             Ejecutivos
├── Monitoreo completo                 ├── ROI en seguridad
├── Auto-healing                         ├── Reducción de riesgo
└── Deployments sin downtime             └── Escalabilidad garantizada
```

---

## 2. ARQUITECTURA DE NEGOCIO

### 2.1 Contexto de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA DE APLICACIONES                   │
└─────────────────────────────────────────────────────────────────┘

        ┌─────────────┐
        │  Web App    │────────────┐
        │  (SPA)      │            │
        └─────────────┘            │
                                   │
        ┌─────────────┐            │     ┌─────────────────────┐
        │ Mobile App  │────────────┼────▶│                     │
        │ (iOS/And)   │            │     │   msseguridad       │
        └─────────────┘            │     │                     │
                                   │     │  • Autenticación    │
        ┌─────────────┐            │     │  • Autorización     │
        │  API Public │────────────┘     │  • OAuth2/OIDC      │
        │  (Terceros) │                  │  • MFA              │
        └─────────────┘                  │  • Auditoría        │
                                         └──────────┬──────────┘
                                                    │
                       ┌────────────────────────────┼────────────────────────────┐
                       │                            │                            │
                       ▼                            ▼                            ▼
                ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
                │ Microserv   │              │ Microserv   │              │ Microserv   │
                │  A          │              │  B          │              │  C          │
                │  (Ventas)   │              │  (Compras)  │              │  (RRHH)     │
                └─────────────┘              └─────────────┘              └─────────────┘
```

### 2.2 Capacidades de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                  CAPACIDADES DE NEGOCIO                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  GESTIÓN DE         │
                    │  IDENTIDAD          │
                    │                     │
                    │ • Registro          │
                    │ • Perfiles          │
                    │ • Datos personales  │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │ AUTENTICACIÓN │  │ AUTORIZACIÓN  │  │  GOBIERNO     │
    │               │  │               │  │               │
    │ • Login/Logout│  │ • Roles       │  │ • Auditoría   │
    │ • MFA         │  │ • Permisos    │  │ • Reportes    │
    │ • Tokens      │  │ • Scopes      │  │ • Cumplimiento│
    │ • Sesiones    │  │ • Delegación  │  │ • Alertas     │
    └───────────────┘  └───────────────┘  └───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  INTEGRACIÓN        │
                    │  FEDERADA           │
                    │                     │
                    │ • OAuth2            │
                    │ • OIDC              │
                    │ • SSO               │
                    │ • Social Login      │
                    └─────────────────────┘
```

### 2.3 Procesos de Negocio

#### Proceso: Onboarding de Usuario

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  START  │───▶│Registro │───▶│  Email  │───▶│ Activar │───▶│Asignar  │
│         │    │         │    │  Verify │    │  Cuenta │    │Rol Def. │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                  │
                                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐
│   END   │◀───│ Acceso  │◀───│ Opcional│◀───│  Completar      │
│         │    │ App     │    │   MFA   │    │  Perfil         │
└─────────┘    └─────────┘    └─────────┘    └─────────────────┘
```

#### Proceso: Autenticación Segura

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Login  │───▶│Validar  │───▶│¿Bloqueo?│───▶│ ¿MFA    │───▶│Generar  │
│         │    │Password │    │         │    │Activo?  │    │Tokens   │
└─────────┘    └─────────┘    └────┬────┘    └────┬────┘    └────┬────┘
                                   │              │              │
                         ┌─────────┘              │              │
                         ▼                         ▼              ▼
                   ┌─────────┐              ┌─────────┐      ┌─────────┐
                   │ Rechazar│              │Verificar│      │ Sesión  │
                   │ + Log   │              │   MFA   │      │ Activa  │
                   └─────────┘              └─────────┘      └─────────┘
```

### 2.4 Entidades de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE DOMINIO                            │
└─────────────────────────────────────────────────────────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│    USER       │────────▶│     ROLE      │────────▶│  PERMISSION   │
│               │ 1    *  │               │  *    * │               │
│ - id          │         │ - id          │         │ - id          │
│ - email       │         │ - name        │         │ - resource    │
│ - password    │         │ - slug        │         │ - action      │
│ - status      │         │ - hierarchy   │         │ - slug        │
│ - mfaEnabled  │         │ - isDefault   │         │ - conditions  │
└───────┬───────┘         └───────────────┘         └───────────────┘
        │
        │ 1                      ┌───────────────┐
        │                        │ REFRESH_TOKEN │
        ├───────────────────────▶│               │
        │ 1                  *   │ - id          │
        │                        │ - tokenHash   │
        ├───────────────────────▶│ - familyId    │
        │ 1                  *   │ - expiresAt     │
        │                        │ - isRevoked   │
        ├───────────────────────▶│ - metadata    │
        │ 1                  *   └───────────────┘
        │
        │                        ┌───────────────┐
        ├───────────────────────▶│ USER_SESSION  │
        │ 1                  *   │               │
        │                        │ - id          │
        │                        │ - ip          │
        │                        │ - userAgent   │
        │                        │ - isActive    │
        │                        │ - expiresAt   │
        │                        └───────────────┘
        │
        │                        ┌───────────────┐
        ├───────────────────────▶│   AUDIT_LOG   │
        │ 1                  *   │               │
        │                        │ - id          │
        │                        │ - action      │
        │                        │ - resource    │
        │                        │ - timestamp   │
        │                        │ - ip          │
        │                        └───────────────┘
        │
        │                        ┌───────────────┐
        └───────────────────────▶│ MFA_BACKUP    │
                             *   │   _CODE       │
                                 │               │
                                 │ - id          │
                                 │ - codeHash    │
                                 │ - usedAt      │
                                 └───────────────┘
```

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Vista de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA EN CAPAS                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Interfaces)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │ REST API    │  │  Middleware  │  │   WebSocket         │     │
│  │ Controllers │  │  Auth/Rate   │  │   (Real-time)       │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER (Casos de Uso)                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │   Auth      │  │   User Mgmt  │  │   OAuth2/OIDC       │     │
│  │   Service   │  │   Service    │  │   Service           │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │   MFA       │  │   Audit      │  │   Token             │     │
│  │   Service   │  │   Service    │  │   Service           │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER (Lógica de Negocio)                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │   User      │  │   Token      │  │   Permission        │     │
│  │   Entity    │  │   Entity     │  │   Entity            │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │   Password  │  │   JWT        │  │   Session           │     │
│  │   VO        │  │   Value Obj  │  │   Value Obj         │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (Adapters)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │   MySQL     │  │   Redis      │  │   Email             │     │
│  │   Adapter   │  │   Adapter    │  │   Adapter           │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │   Argon2    │  │   JWT        │  │   Logger            │     │
│  │   Adapter   │  │   Adapter    │  │   Adapter           │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │   TOTP      │  │   Cache      │  │   Event Bus         │     │
│  │   Adapter   │  │   Adapter    │  │   Adapter           │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Diseño Detallado de Componentes

#### 3.2.1 Diagrama de Componentes de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA msseguridad - COMPONENTES                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE PRESENTACIÓN                               │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │ AuthController  │  │ UserController  │  │ OAuthController │  │ AdminCtrl   ││
│  │                 │  │                 │  │                 │  │             ││
│  │ - POST /login   │  │ - GET /me       │  │ - /authorize    │  │ - CRUD      ││
│  │ - POST /logout  │  │ - PATCH /me     │  │ - /token        │  │   users     ││
│  │ - POST /refresh │  │ - GET /sessions │  │ - /introspect   │  │ - CRUD      ││
│  │ - POST /mfa/enable│ │ - DELETE /sessions│ │ - /.well-known │  │   roles     ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘│
│           │                    │                    │                   │      │
│           └────────────────────┴────────────────────┘                   │      │
│                              │                                          │      │
└──────────────────────────────┼──────────────────────────────────────────┼──────┘
                               │                                          │
                               ▼                                          │
┌─────────────────────────────────────────────────────────────────────────┼──────┐
│                              CAPA DE APLICACIÓN                         │      │
│                                                                         │      │
│  ┌───────────────────────────────────────────────────────────────────┐  │      │
│  │                    APPLICATION SERVICES (Use Cases)               │  │      │
│  │                                                                  │  │      │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │  │      │
│  │  │AuthService   │ │UserService   │ │OAuthService  │ │Token   │ │  │      │
│  │  │              │ │              │ │              │ │Service │ │  │      │
│  │  │• login()     │ │• create()    │ │• authorize() │ │• create│ │  │      │
│  │  │• logout()    │ │• update()    │ │• token()     │ │• rotate│ │  │      │
│  │  │• verifyMfa() │ │• delete()    │ │• introspect()│ │• revoke│ │  │      │
│  │  │• register()  │ │• findById()  │ │• revoke()    │ │• verify│ │  │      │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───┬────┘ │  │      │
│  │         │                │                │             │      │  │      │
│  │  ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐ ┌──┴────┐ │  │      │
│  │  │MfaService    │ │AuditService  │ │SessionService│ │PermSvc│ │  │      │
│  │  │              │ │              │ │              │ │       │ │  │      │
│  │  │• enable()    │ │• log()       │ │• create()    │ │• check│ │  │      │
│  │  │• verify()    │ │• query()     │ │• terminate() │ │• grant│ │  │      │
│  │  │• disable()   │ │• export()    │ │• list()      │ │• revoke│ │  │      │
│  │  │• genBackup() │ │• alert()      │ │• cleanup()   │ │• list │ │  │      │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └───────┘ │  │      │
│  │                                                                │  │      │
│  └────────────────────────────────────────────────────────────────┘  │      │
│                                                                     │      │
│  ┌────────────────────────────────────────────────────────────────┐ │      │
│  │                    DTOs y Validación                            │ │      │
│  │  • LoginDto, RegisterDto, TokenDto, UpdateUserDto, etc.      │ │      │
│  │  • Validación con Joi / class-validator                        │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
└─────────────────────────────────────────────────────────────────────┼──────┘
                               │                                      │
                               ▼                                      │
┌─────────────────────────────────────────────────────────────────────┼──────┐
│                              CAPA DE DOMINIO                        │      │
│                                                                     │      │
│  ┌───────────────────────────────────────────────────────────────┐ │      │
│  │                    ENTIDADES DE NEGOCIO                       │ │      │
│  │                                                                │ │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │ │      │
│  │  │ User     │ │ Role     │ │Permission│ │RefreshTok│ │Mfa   │ │ │      │
│  │  │          │ │          │ │          │ │en        │ │Config│ │ │      │
│  │  │• id      │ │• id      │ │• id      │ │• id      │ │• id  │ │ │      │
│  │  │• email   │ │• name    │ │• resource│ │• hash    │ │• type│ │ │      │
│  │  │• password│ │• slug    │ │• action  │ │• familyId│ │• key │ │ │      │
│  │  │• status  │ │• level   │ │• slug    │ │• expires │ │• backup│ │      │
│  │  │• mfaEnab │ │• isDefault│ │• conds   │ │• revoked │ │      │ │      │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬──┘ │ │      │
│  │       │            │            │            │           │    │ │      │
│  │       └────────────┴────────────┴────────────┴───────────┘    │ │      │
│  │                                                                │ │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │ │      │
│  │  │ Session  │ │ AuditLog │ │ OAuthClient│ │OAuthCode │ │MfaBkp│ │ │      │
│  │  │          │ │          │ │            │ │          │ │Code  │ │ │      │
│  │  │• id      │ │• id      │ │• id        │ │• id      │ │• id  │ │ │      │
│  │  │• userId  │ │• userId  │ │• name      │ │• code    │ │• hash│ │ │      │
│  │  │• ip      │ │• action  │ │• secret    │ │• clientId│ │• used│ │ │      │
│  │  │• ua      │ │• resource│ │• redirect  │ │• userId  │ │• at  │ │ │      │
│  │  │• active  │ │• ip      │ │• grants    │ │• expires │ │      │ │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │ │      │
│  │                                                                │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
│                                                                     │      │
│  ┌────────────────────────────────────────────────────────────────┐ │      │
│  │                    VALUE OBJECTS                                  │ │      │
│  │  • Email (validación formato)                                   │ │      │
│  │  • Password (hash interno)                                      │ │      │
│  │  • Token (JWT estructurado)                                     │      │
│  │  • PermissionSlug (formato resource:action)                     │ │      │
│  │  • GeoLocation (lat, long, city, country)                       │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
│                                                                     │      │
│  ┌────────────────────────────────────────────────────────────────┐ │      │
│  │                    DOMAIN SERVICES                              │ │      │
│  │  • PasswordPolicyService (valida complejidad)                   │ │      │
│  │  • TokenRotationService (lógica de rotación)                    │ │      │
│  │  • PermissionEvaluatorService (evalúa ABAC)                   │ │      │
│  │  • AuditDomainService (reglas de auditoría)                   │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
└─────────────────────────────────────────────────────────────────────┼──────┘
                               │                                      │
                               ▼                                      │
┌─────────────────────────────────────────────────────────────────────┼──────┐
│                           CAPA DE INFRAESTRUCTURA                  │      │
│                                                                     │      │
│  ┌───────────────────────────────────────────────────────────────┐ │      │
│  │                    REPOSITORIES (Interfaces + Impl)           │ │      │
│  │                                                                │ │      │
│  │  IUserRepository ──────▶ TypeOrmUserRepository (MySQL)        │ │      │
│  │  IRoleRepository ──────▶ TypeOrmRoleRepository (MySQL)        │ │      │
│  │  ITokenRepository ─────▶ TypeOrmTokenRepository (MySQL)       │ │      │
│  │  ISessionRepository ───▶ RedisSessionRepository (Redis)       │ │      │
│  │  ICacheRepository ─────▶ RedisCacheRepository (Redis)           │ │      │
│  │  IAuditRepository ─────▶ TypeOrmAuditRepository (MySQL)         │ │      │
│  │                                                                │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
│                                                                     │      │
│  ┌───────────────────────────────────────────────────────────────┐ │      │
│  │                    ADAPTERS EXTERNOS                          │ │      │
│  │                                                                │ │      │
│  │  ISecurityAdapter ─────▶ Argon2Adapter (hashing)            │ │      │
│  │  ITokenAdapter ────────▶ JwtAdapter (jsonwebtoken/jose)      │ │      │
│  │  IMfaAdapter ──────────▶ SpeakeasyAdapter (TOTP)             │ │      │
│  │  IEmailAdapter ─────────▶ NodemailerAdapter (SMTP)           │ │      │
│  │  ILoggerAdapter ────────▶ WinstonAdapter (logging)           │ │      │
│  │  IEventAdapter ─────────▶ RedisEventAdapter (pub/sub)        │ │      │
│  │                                                                │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
│                                                                     │      │
│  ┌───────────────────────────────────────────────────────────────┐ │      │
│  │                    FRAMEWORK & MIDDLEWARE                     │ │      │
│  │                                                                │ │      │
│  │  • Express.js (HTTP framework)                                │ │      │
│  │  • Helmet (security headers)                                    │ │      │
│  │  • express-rate-limit (throttling)                            │ │      │
│  │  • cors (CORS handling)                                         │ │      │
│  │  • compression (gzip)                                           │ │      │
│  │  • express-validator (input validation)                       │ │      │
│  │                                                                │ │      │
│  └────────────────────────────────────────────────────────────────┘ │      │
└─────────────────────────────────────────────────────────────────────┴──────┘
```

#### 3.2.2 Diagrama de Dependencias entre Componentes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DEPENDENCIAS ENTRE COMPONENTES                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  AuthController                                                                 │
│  ├──▶ AuthService                                                               │
│  │    ├──▶ IUserRepository (Domain Interface)                                  │
│  │    │         └──▶ TypeOrmUserRepository (Infra)                              │
│  │    ├──▶ ITokenService (App Interface)                                        │
│  │    │         ├──▶ TokenService (App)                                         │
│  │    │         │      ├──▶ ITokenRepository                                    │
│  │    │         │      └──▶ JwtAdapter (Infra)                                 │
│  │    ├──▶ ISecurityAdapter (Domain Interface)                                  │
│  │    │         └──▶ Argon2Adapter (Infra)                                     │
│  │    ├──▶ IMfaAdapter (Domain Interface)                                       │
│  │    │         └──▶ SpeakeasyAdapter (Infra)                                  │
│  │    └──▶ IAuditService (App Interface)                                        │
│  │              └──▶ AuditService (App)                                          │
│  └──▶ RateLimitMiddleware (infra)                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  OAuthController                                                                │
│  ├──▶ OAuthService                                                              │
│  │    ├──▶ IOAuthClientRepository                                               │
│  │    ├──▶ IOAuthCodeRepository                                                  │
│  │    ├──▶ ITokenService (reutiliza)                                            │
│  │    └──▶ IUserRepository (reutiliza)                                          │
│  └──▶ AuthMiddleware (infra)                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  AdminController                                                                │
│  ├──▶ UserService (con permisos de admin)                                       │
│  ├──▶ RoleService                                                               │
│  │    └──▶ IRoleRepository                                                      │
│  └──▶ PermissionService                                                         │
│       └──▶ IPermissionRepository                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  Cross-Cutting Concerns (todos los controllers)                                 │
│  ├──▶ ErrorHandlerMiddleware                                                   │
│  ├──▶ LoggingMiddleware                                                        │
│  ├──▶ CorrelationIdMiddleware                                                  │
│  └──▶ SecurityHeadersMiddleware (Helmet)                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 Interfaces y Contratos

**Repository Interfaces (Domain):**
```typescript
// IUserRepository.ts - Capa de Dominio
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findAll(options: QueryOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  exists(email: Email): Promise<boolean>;
  countActive(): Promise<number>;
}

// ITokenRepository.ts
interface ITokenRepository {
  findByHash(hash: string): Promise<RefreshToken | null>;
  findByFamilyId(familyId: string): Promise<RefreshToken[]>;
  findActiveByUser(userId: string): Promise<RefreshToken[]>;
  save(token: RefreshToken): Promise<RefreshToken>;
  revoke(id: string, reason: string): Promise<void>;
  revokeFamily(familyId: string, reason: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}

// ISessionRepository.ts
interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findActiveByUser(userId: string): Promise<Session[]>;
  save(session: Session): Promise<Session>;
  terminate(id: string): Promise<void>;
  terminateAllByUser(userId: string, exceptId?: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}
```

**Service Interfaces (Application):**
```typescript
// IAuthService.ts - Capa de Aplicación
interface IAuthService {
  login(credentials: LoginDto): Promise<Result<AuthTokens, AuthError>>;
  logout(token: string, allDevices?: boolean): Promise<Result<void, AuthError>>;
  refreshToken(refreshToken: string): Promise<Result<AuthTokens, AuthError>>;
  register(data: RegisterDto): Promise<Result<User, AuthError>>;
  verifyMfa(userId: string, code: string): Promise<Result<AuthTokens, AuthError>>;
  enableMfa(userId: string): Promise<Result<MfaSetup, AuthError>>;
  confirmMfa(userId: string, code: string, secret: string): Promise<Result<void, AuthError>>;
  disableMfa(userId: string, password: string): Promise<Result<void, AuthError>>;
  recoverWithBackupCode(userId: string, code: string): Promise<Result<AuthTokens, AuthError>>;
}

// ITokenService.ts
interface ITokenService {
  generateTokens(user: User, sessionId: string): Promise<AuthTokens>;
  verifyAccessToken(token: string): Promise<Result<TokenPayload, TokenError>>;
  rotateRefreshToken(refreshToken: string): Promise<Result<AuthTokens, TokenError>>;
  revokeToken(token: string, reason: string): Promise<void>;
  revokeAllUserTokens(userId: string, reason: string): Promise<void>;
}

// IAuditService.ts
interface IAuditService {
  log(event: AuditEvent): Promise<void>;
  query(filters: AuditFilters): Promise<PaginatedResult<AuditLog>>;
  export(filters: AuditFilters, format: 'csv' | 'json'): Promise<Buffer>;
  getSecurityAlerts(startDate: Date, endDate: Date): Promise<SecurityAlert[]>;
}
```

**Adapter Interfaces (Infrastructure):**
```typescript
// ISecurityAdapter.ts - Capa de Infraestructura
interface ISecurityAdapter {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  needsRehash(hash: string): boolean;
}

// ITokenAdapter.ts
interface ITokenAdapter {
  sign(payload: object, options: SignOptions): Promise<string>;
  verify(token: string, options: VerifyOptions): Promise<TokenPayload>;
  decode(token: string): TokenPayload | null;
  generateKeyPair(): Promise<KeyPair>;
}

// IMfaAdapter.ts
interface IMfaAdapter {
  generateSecret(): string;
  generateQrCodeUrl(secret: string, account: string, issuer: string): string;
  verifyToken(secret: string, token: string): boolean;
  generateBackupCodes(): string[];
  verifyBackupCode(code: string, hashes: string[]): boolean;
  hashBackupCode(code: string): string;
}
```

---

### 3.3 Modelo Entidad-Relación de Base de Datos

#### 3.3.1 Diagrama ER Completo (Crow's Foot Notation)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         MODELO ENTIDAD-RELACIÓN MySQL 8.0                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     users       │         │     roles       │         │  permissions    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ PK id           │         │ PK id           │         │ PK id           │
│ email (UQ)      │         │ name (UQ)       │         │ resource        │
│ password_hash   │         │ slug (UQ)       │         │ action          │
│ first_name      │         │ description     │         │ slug (UQ)       │
│ last_name       │         │ hierarchy_level │         │ description     │
│ status          │         │ is_system       │         │ conditions      │
│ email_verified  │         │ is_default      │         │ created_at      │
│ mfa_enabled     │         │ created_at      │         │ updated_at      │
│ mfa_secret      │         │ updated_at      │         └─────────────────┘
│ mfa_backup_codes│         └─────────────────┘                  │
│ locked_until    │                │                             │
│ failed_attempts │                │                             │
│ password_changed│                │                             │
│ last_login      │                ▼                             ▼
│ created_at      │         ┌─────────────────┐         ┌─────────────────┐
│ updated_at      │         │  role_permissions│        │  user_roles     │
└─────────────────┘         ├─────────────────┤         ├─────────────────┤
         │                  │ PK role_id (FK) │         │ PK user_id (FK) │
         │                  │ PK perm_id (FK) │         │ PK role_id (FK) │
         │                  │ granted_at      │         │ assigned_by (FK)│
         │                  └─────────────────┘         │ assigned_at     │
         │                                              └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ refresh_tokens  │         │ user_sessions   │         │   audit_logs    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ PK id           │         │ PK id           │         │ PK id           │
│ FK user_id      │         │ FK user_id      │         │ FK user_id      │
│ token_hash (UQ) │         │ session_token   │         │ action          │
│ family_id       │         │ ip_address      │         │ resource        │
│ is_revoked      │         │ user_agent      │         │ resource_id     │
│ revoked_reason  │         │ device_info     │         │ details (JSON)  │
│ expires_at      │         │ country         │         │ ip_address      │
│ created_at      │         │ city            │         │ user_agent      │
│ metadata (JSON) │         │ is_active       │         │ status          │
└─────────────────┘         │ last_activity   │         │ created_at      │
         │                  │ expires_at      │         │ session_id      │
         │                  │ created_at      │         └─────────────────┘
         │                  └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│mfa_backup_codes │
├─────────────────┤
│ PK id           │
│ FK user_id      │
│ code_hash (UQ)  │
│ used_at         │
│ used_ip         │
│ created_at      │
└─────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════
                               OAUTH2 / OIDC TABLES
═══════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  oauth_clients  │         │oauth_auth_codes │         │  oauth_tokens   │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ PK id           │         │ PK id           │         │ PK id           │
│ client_id (UQ)  │────────▶│ FK client_id    │         │ FK client_id    │
│ client_secret   │         │ FK user_id      │         │ FK user_id      │
│ name            │         │ code (UQ)       │         │ access_token    │
│ redirect_uris   │         │ redirect_uri    │         │ refresh_token   │
│ grants          │         │ expires_at      │         │ scopes          │
│ scopes          │         │ consumed        │         │ expires_at      │
│ is_confidential │         │ code_challenge  │         │ created_at      │
│ is_active       │         │ code_challenge_ │         └─────────────────┘
│ created_at      │         │   method        │
│ updated_at      │         └─────────────────┘
└─────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════
                               PASSWORD HISTORY (Security)
═══════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────┐
│ password_history│
├─────────────────┤
│ PK id           │
│ FK user_id      │
│ password_hash   │
│ changed_at      │
│ changed_by      │
│ reason          │
└─────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════
                               SECURITY EVENTS (Real-time)
═══════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────┐
│ security_events │
├─────────────────┤
│ PK id           │
│ event_type      │
│ severity        │
│ user_id         │
│ ip_address      │
│ user_agent      │
│ details (JSON)  │
│ acknowledged    │
│ acknowledged_by │
│ created_at      │
└─────────────────┘
```

#### 3.3.2 DDL Completo de la Base de Datos

```sql
-- ============================================================
-- 1. TABLA: users (Usuarios del sistema)
-- ============================================================
CREATE TABLE users (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email                   VARCHAR(255) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    avatar_url              VARCHAR(500),
    status                  ENUM('active', 'inactive', 'suspended', 'pending') 
                            DEFAULT 'pending',
    email_verified_at       TIMESTAMP NULL,
    mfa_enabled             BOOLEAN DEFAULT FALSE,
    mfa_secret              VARCHAR(255),
    mfa_backup_codes_hash   JSON,
    locked_until            TIMESTAMP NULL,
    failed_login_attempts   INT UNSIGNED DEFAULT 0,
    password_changed_at     TIMESTAMP NULL,
    last_login_at           TIMESTAMP NULL,
    last_login_ip           VARCHAR(45),
    preferences             JSON,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at),
    INDEX idx_users_locked (locked_until),
    INDEX idx_users_mfa (mfa_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TABLA: roles (Roles del sistema RBAC)
-- ============================================================
CREATE TABLE roles (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name                    VARCHAR(100) NOT NULL,
    slug                    VARCHAR(100) NOT NULL,
    description             TEXT,
    hierarchy_level         INT UNSIGNED DEFAULT 100,
    is_system               BOOLEAN DEFAULT FALSE,
    is_default              BOOLEAN DEFAULT FALSE,
    metadata                JSON,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_roles_slug (slug),
    UNIQUE KEY uk_roles_name (name),
    INDEX idx_roles_hierarchy (hierarchy_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles por defecto
INSERT INTO roles (id, name, slug, description, hierarchy_level, is_system, is_default) VALUES
('11111111-1111-1111-1111-111111111111', 'Superadmin', 'superadmin', 'Control total del sistema', 0, TRUE, FALSE),
('22222222-2222-2222-2222-222222222222', 'Administrator', 'admin', 'Gestión de usuarios y configuración', 50, TRUE, FALSE),
('33333333-3333-3333-3333-333333333333', 'User', 'user', 'Usuario estándar del sistema', 100, TRUE, TRUE),
('44444444-4444-4444-4444-444444444444', 'Guest', 'guest', 'Acceso limitado', 200, TRUE, FALSE);

-- ============================================================
-- 3. TABLA: permissions (Permisos granulares)
-- ============================================================
CREATE TABLE permissions (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    resource                VARCHAR(50) NOT NULL,
    action                  VARCHAR(50) NOT NULL,
    slug                    VARCHAR(100) NOT NULL,
    description             TEXT,
    conditions              JSON,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_permissions_slug (slug),
    UNIQUE KEY uk_permissions_resource_action (resource, action),
    INDEX idx_permissions_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos por defecto
INSERT INTO permissions (slug, resource, action, description) VALUES
('users:create', 'users', 'create', 'Crear usuarios'),
('users:read', 'users', 'read', 'Ver cualquier usuario'),
('users:read:own', 'users', 'read:own', 'Ver perfil propio'),
('users:update', 'users', 'update', 'Editar cualquier usuario'),
('users:update:own', 'users', 'update:own', 'Editar perfil propio'),
('users:delete', 'users', 'delete', 'Eliminar usuarios'),
('users:block', 'users', 'block', 'Bloquear/desbloquear usuarios'),
('roles:manage', 'roles', 'manage', 'Gestionar roles y permisos'),
('audit:read', 'audit', 'read', 'Ver logs de auditoría'),
('system:configure', 'system', 'configure', 'Configuración del sistema');

-- ============================================================
-- 4. TABLA: user_roles (Relación N:M usuarios-roles)
-- ============================================================
CREATE TABLE user_roles (
    user_id                 CHAR(36) NOT NULL,
    role_id                 CHAR(36) NOT NULL,
    assigned_by             CHAR(36),
    assigned_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at              TIMESTAMP NULL,
    is_primary              BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_roles_assigned (assigned_at),
    INDEX idx_user_roles_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLA: role_permissions (Relación N:M roles-permisos)
-- ============================================================
CREATE TABLE role_permissions (
    role_id                 CHAR(36) NOT NULL,
    permission_id           CHAR(36) NOT NULL,
    granted_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by              CHAR(36),
    
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asignar permisos a roles
-- Superadmin: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions;

-- Admin: permisos de gestión
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions 
WHERE slug IN ('users:read', 'users:update', 'users:block', 'audit:read');

-- User: solo permisos propios
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM permissions 
WHERE slug LIKE '%:own';

-- ============================================================
-- 6. TABLA: refresh_tokens (Tokens de refresco con rotación)
-- ============================================================
CREATE TABLE refresh_tokens (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id                 CHAR(36) NOT NULL,
    token_hash              VARCHAR(255) NOT NULL,
    family_id               CHAR(36) NOT NULL,
    session_id              CHAR(36),
    is_revoked              BOOLEAN DEFAULT FALSE,
    revoked_at              TIMESTAMP NULL,
    revoked_reason          VARCHAR(100),
    expires_at              TIMESTAMP NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata                JSON,
    
    UNIQUE KEY uk_tokens_hash (token_hash),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tokens_user (user_id, is_revoked),
    INDEX idx_tokens_family (family_id),
    INDEX idx_tokens_expires (expires_at),
    INDEX idx_tokens_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLA: user_sessions (Sesiones activas)
-- ============================================================
CREATE TABLE user_sessions (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id                 CHAR(36) NOT NULL,
    refresh_token_id        CHAR(36),
    session_token           VARCHAR(255) NOT NULL,
    ip_address              VARCHAR(45) NOT NULL,
    user_agent              VARCHAR(500),
    device_info             JSON,
    country                 VARCHAR(2),
    city                    VARCHAR(100),
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),
    is_active               BOOLEAN DEFAULT TRUE,
    last_activity_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at              TIMESTAMP NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (refresh_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    UNIQUE KEY uk_sessions_token (session_token),
    INDEX idx_sessions_user (user_id, is_active),
    INDEX idx_sessions_expires (expires_at),
    INDEX idx_sessions_ip (ip_address),
    INDEX idx_sessions_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLA: audit_logs (Auditoría - particionable)
-- ============================================================
CREATE TABLE audit_logs (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id                 CHAR(36),
    session_id              CHAR(36),
    action                  VARCHAR(50) NOT NULL,
    resource                VARCHAR(50) NOT NULL,
    resource_id             VARCHAR(100),
    details                 JSON,
    status                  ENUM('success', 'failure', 'denied') NOT NULL,
    ip_address              VARCHAR(45) NOT NULL,
    user_agent              VARCHAR(500),
    country                 VARCHAR(2),
    city                    VARCHAR(100),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_user (user_id, created_at),
    INDEX idx_audit_action (action, created_at),
    INDEX idx_audit_resource (resource, resource_id),
    INDEX idx_audit_time (created_at),
    INDEX idx_audit_ip (ip_address),
    INDEX idx_audit_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p2024q1 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01')),
    PARTITION p2024q2 VALUES LESS THAN (UNIX_TIMESTAMP('2024-07-01')),
    PARTITION p2024q3 VALUES LESS THAN (UNIX_TIMESTAMP('2024-10-01')),
    PARTITION p2024q4 VALUES LESS THAN (UNIX_TIMESTAMP('2025-01-01')),
    PARTITION pfuture VALUES LESS THAN MAXVALUE
);

-- ============================================================
-- 9. TABLA: mfa_backup_codes (Códigos de respaldo MFA)
-- ============================================================
CREATE TABLE mfa_backup_codes (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id                 CHAR(36) NOT NULL,
    code_hash               VARCHAR(255) NOT NULL,
    used_at                 TIMESTAMP NULL,
    used_ip                 VARCHAR(45),
    used_session_id         CHAR(36),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_backup_codes_hash (code_hash),
    INDEX idx_backup_codes_user (user_id, used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TABLAS OAUTH2 (Open Authorization)
-- ============================================================

CREATE TABLE oauth_clients (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id               VARCHAR(100) NOT NULL,
    client_secret           VARCHAR(255),
    name                    VARCHAR(200) NOT NULL,
    description             TEXT,
    redirect_uris           JSON NOT NULL,
    allowed_grants          JSON NOT NULL,
    allowed_scopes          JSON NOT NULL,
    is_confidential         BOOLEAN DEFAULT TRUE,
    is_active               BOOLEAN DEFAULT TRUE,
    created_by              CHAR(36),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_oauth_clients_client_id (client_id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_oauth_clients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE oauth_authorization_codes (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code                    VARCHAR(255) NOT NULL,
    client_id               CHAR(36) NOT NULL,
    user_id                 CHAR(36) NOT NULL,
    redirect_uri            VARCHAR(500) NOT NULL,
    scope                   VARCHAR(500),
    code_challenge          VARCHAR(255),
    code_challenge_method   ENUM('S256', 'plain'),
    expires_at              TIMESTAMP NOT NULL,
    consumed_at             TIMESTAMP NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES oauth_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_auth_codes_code (code),
    INDEX idx_auth_codes_expires (expires_at),
    INDEX idx_auth_codes_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE oauth_access_tokens (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token                   VARCHAR(500) NOT NULL,
    client_id               CHAR(36) NOT NULL,
    user_id                 CHAR(36),
    scope                   VARCHAR(500),
    expires_at              TIMESTAMP NOT NULL,
    revoked_at              TIMESTAMP NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES oauth_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_access_tokens_token (token),
    INDEX idx_access_tokens_expires (expires_at),
    INDEX idx_access_tokens_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. TABLA: password_history (Histórico de contraseñas)
-- ============================================================
CREATE TABLE password_history (
    id                      CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id                 CHAR(36) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    changed_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by              CHAR(36),
    reason                  VARCHAR(100),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_password_history_user (user_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. TABLA: security_events (Eventos de seguridad en tiempo real)
-- ============================================================
CREATE TABLE security_events (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type              VARCHAR(50) NOT NULL,
    severity                ENUM('info', 'warning', 'critical') NOT NULL,
    user_id                 CHAR(36),
    ip_address              VARCHAR(45),
    user_agent              VARCHAR(500),
    details                 JSON,
    acknowledged            BOOLEAN DEFAULT FALSE,
    acknowledged_by         CHAR(36),
    acknowledged_at           TIMESTAMP NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_security_events_time (created_at),
    INDEX idx_security_events_user (user_id),
    INDEX idx_security_events_type (event_type),
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_ack (acknowledged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORED PROCEDURES PARA MANTENIMIENTO
-- ============================================================

DELIMITER //

-- Procedimiento: Limpiar tokens expirados
CREATE PROCEDURE cleanup_expired_tokens()
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL 7 DAY;
    
    DELETE FROM oauth_authorization_codes 
    WHERE expires_at < NOW() - INTERVAL 1 DAY;
    
    DELETE FROM oauth_access_tokens 
    WHERE expires_at < NOW() - INTERVAL 1 DAY;
    
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL 30 DAY;
END //

-- Procedimiento: Limpiar logs antiguos (mover a archive)
CREATE PROCEDURE archive_old_audit_logs(IN days_to_keep INT)
BEGIN
    SET @cutoff_date = DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    -- Insertar en tabla de archivo (debe existir audit_logs_archive)
    INSERT INTO audit_logs_archive 
    SELECT * FROM audit_logs 
    WHERE created_at < @cutoff_date;
    
    -- Eliminar de tabla principal
    DELETE FROM audit_logs 
    WHERE created_at < @cutoff_date;
    
    SELECT ROW_COUNT() AS archived_records;
END //

-- Procedimiento: Desbloquear cuentas expiradas
CREATE PROCEDURE unlock_expired_accounts()
BEGIN
    UPDATE users 
    SET locked_until = NULL, 
        failed_login_attempts = 0,
        status = 'active'
    WHERE locked_until IS NOT NULL 
      AND locked_until < NOW();
END //

-- Procedimiento: Detectar sesiones sospechosas
CREATE PROCEDURE detect_suspicious_sessions()
BEGIN
    INSERT INTO security_events (event_type, severity, user_id, ip_address, details)
    SELECT 
        'multiple_sessions_same_ip',
        'warning',
        user_id,
        ip_address,
        JSON_OBJECT('session_count', COUNT(*), 'sessions', JSON_ARRAYAGG(id))
    FROM user_sessions
    WHERE is_active = TRUE
      AND created_at > NOW() - INTERVAL 1 HOUR
    GROUP BY user_id, ip_address
    HAVING COUNT(*) > 5;
END //

DELIMITER ;

-- ============================================================
-- VISTAS PARA REPORTES
-- ============================================================

-- Vista: Usuarios con roles
CREATE VIEW v_users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    u.mfa_enabled,
    u.created_at,
    GROUP_CONCAT(r.name ORDER BY r.hierarchy_level) AS roles,
    GROUP_CONCAT(r.slug ORDER BY r.hierarchy_level) AS role_slugs
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id;

-- Vista: Permisos efectivos por usuario
CREATE VIEW v_user_permissions AS
SELECT 
    u.id AS user_id,
    u.email,
    p.resource,
    p.action,
    p.slug AS permission
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.status = 'active'
GROUP BY u.id, p.id;

-- Vista: Sesiones activas con info de usuario
CREATE VIEW v_active_sessions AS
SELECT 
    s.id AS session_id,
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    s.ip_address,
    s.country,
    s.city,
    s.device_info,
    s.last_activity_at,
    s.expires_at,
    TIMESTAMPDIFF(MINUTE, s.last_activity_at, NOW()) AS minutes_inactive
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE
  AND s.expires_at > NOW();

-- Vista: Estadísticas de login
CREATE VIEW v_login_statistics AS
SELECT 
    DATE(created_at) AS date,
    HOUR(created_at) AS hour,
    action,
    status,
    COUNT(*) AS count
FROM audit_logs
WHERE action IN ('login', 'login_failed', 'logout')
  AND created_at > NOW() - INTERVAL 30 DAY
GROUP BY DATE(created_at), HOUR(created_at), action, status;
```

#### 3.3.3 Diagrama de Clases TypeORM

```typescript
// ============================================================
// ENTIDADES TYPEORM - Dominio
// ============================================================

@Entity('users')
class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ name: 'first_name', length: 100, nullable: true })
    firstName: string;

    @Column({ name: 'last_name', length: 100, nullable: true })
    lastName: string;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
    status: UserStatus;

    @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
    emailVerifiedAt: Date;

    @Column({ name: 'mfa_enabled', default: false })
    mfaEnabled: boolean;

    @Column({ name: 'mfa_secret', length: 255, nullable: true })
    mfaSecret: string;

    @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
    lockedUntil: Date;

    @Column({ name: 'failed_login_attempts', default: 0 })
    failedLoginAttempts: number;

    @OneToMany(() => RefreshTokenEntity, token => token.user)
    refreshTokens: RefreshTokenEntity[];

    @OneToMany(() => UserSessionEntity, session => session.user)
    sessions: UserSessionEntity[];

    @ManyToMany(() => RoleEntity)
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
    })
    roles: RoleEntity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('roles')
class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ length: 100, unique: true })
    slug: string;

    @Column({ type: 'int', name: 'hierarchy_level', default: 100 })
    hierarchyLevel: number;

    @Column({ name: 'is_system', default: false })
    isSystem: boolean;

    @ManyToMany(() => PermissionEntity)
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_id' },
        inverseJoinColumn: { name: 'permission_id' }
    })
    permissions: PermissionEntity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

@Entity('permissions')
class PermissionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    resource: string;

    @Column({ length: 50 })
    action: string;

    @Column({ length: 100, unique: true })
    slug: string;

    @Column({ type: 'json', nullable: true })
    conditions: any;
}

@Entity('refresh_tokens')
class RefreshTokenEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, user => user.refreshTokens)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ name: 'token_hash', unique: true })
    tokenHash: string;

    @Column({ name: 'family_id' })
    familyId: string;

    @Column({ name: 'is_revoked', default: false })
    isRevoked: boolean;

    @Column({ name: 'expires_at' })
    expiresAt: Date;
}

@Entity('user_sessions')
class UserSessionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, user => user.sessions)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ name: 'session_token', unique: true })
    sessionToken: string;

    @Column({ name: 'ip_address', length: 45 })
    ipAddress: string;

    @Column({ type: 'json', nullable: true })
    deviceInfo: any;

    @Column({ default: true })
    isActive: boolean;

    @Column({ name: 'expires_at' })
    expiresAt: Date;
}

@Entity('audit_logs')
class AuditLogEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ length: 50 })
    action: string;

    @Column({ length: 50 })
    resource: string;

    @Column({ type: 'json', nullable: true })
    details: any;

    @Column({ type: 'enum', enum: ['success', 'failure', 'denied'] })
    status: string;

    @Column({ name: 'ip_address', length: 45 })
    ipAddress: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
```

---

### 3.4 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECUENCIA DE REQUEST                         │
└─────────────────────────────────────────────────────────────────┘

     Cliente              API Gateway           Auth Service         Data Layer
        │                      │                      │                  │
        │ POST /auth/login     │                      │                  │
        │────────────────────▶│                      │                  │
        │                      │ Rate Limit Check     │                  │
        │                      │──────────┐           │                  │
        │                      │◀─────────┘           │                  │
        │                      │    Route to Service  │                  │
        │                      │─────────────────────▶│                  │
        │                      │                      │ Validate Input   │
        │                      │                      │──────────┐       │
        │                      │                      │◀─────────┘       │
        │                      │                      │    Check User      │
        │                      │                      │─────────────────▶│
        │                      │                      │◀─────────────────│
        │                      │                      │ Verify Password    │
        │                      │                      │ Argon2id verify    │
        │                      │                      │    Check MFA       │
        │                      │                      │ (if enabled)       │
        │                      │                      │─────────────────▶│
        │                      │                      │◀─────────────────│
        │                      │                      │ Generate Tokens    │
        │                      │                      │ (JWT RS256)        │
        │                      │                      │    Store Refresh   │
        │                      │                      │─────────────────▶│
        │                      │                      │◀─────────────────│
        │                      │                      │    Log Event       │
        │                      │                      │ (async)            │
        │                      │                      │─────────────────▶│
        │                      │    Return Response   │                  │
        │                      │◀─────────────────────│                  │
        │    Access + Refresh  │                      │                  │
        │◀─────────────────────│                      │                  │
        │                      │                      │                  │
```

### 3.5 Diagrama de Despliegue

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE DESPLIEGUE                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         KUBERNETES CLUSTER                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      INGRESS (nginx)                         ││
│  │              TLS termination, routing                        ││
│  └───────────────────────────┬─────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────────────────┴─────────────────────────────────┐│
│  │              SERVICE MESH (Istio/Linkerd) - opcional       ││
│  │              mTLS, traffic management                       ││
│  └───────────────────────────┬─────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────────────────┴─────────────────────────────────┐│
│  │              msseguridad PODS (HPA: 3-10 replicas)          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       ││
│  │  │  Pod 1      │  │  Pod 2      │  │  Pod 3      │       ││
│  │  │  Node.js    │  │  Node.js    │  │  Node.js    │  ...  ││
│  │  │  Express    │  │  Express    │  │  Express    │       ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────────────────┼─────────────────────────────────┐│
│  │                           │         DATA LAYER              ││
│  │  ┌─────────────────────┐  │  ┌─────────────────────┐        ││
│  │  │   MySQL Primary     │◀─┼──│   MySQL Replica     │        ││
│  │  │   (StatefulSet)     │  │  │   (Read replicas)   │        ││
│  │  └─────────────────────┘  │  └─────────────────────┘        ││
│  │  ┌─────────────────────┐  │  ┌─────────────────────┐        ││
│  │  │   Redis Cluster     │  │  │   Redis Sentinel    │        ││
│  │  │   (Sessions/Cache)  │  │  │   (High Availability) │        ││
│  │  └─────────────────────┘  │  └─────────────────────┘        ││
│  └───────────────────────────┴─────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              OBSERVABILITY STACK                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   ││
│  │  │ Prometheus  │  │   Grafana   │  │    ELK / Loki       │   ││
│  │  │ (Metrics)   │  │ (Dashboards)│  │    (Logs)           │   ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│              EXTERNAL SERVICES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │   SMTP      │  │   Vault     │  │   SonarQube         │    │
│  │  (Email)    │  │  (Secrets)  │  │  (Code Quality)      │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.6 Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPAS DE SEGURIDAD                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CAPA 1: PERIMETER                                              │
│  • WAF (CloudFlare/AWS WAF)                                    │
│  • DDoS Protection                                               │
│  • Bot Detection                                                 │
│  • Geo-blocking (opcional)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 2: NETWORK                                                │
│  • VPC / Private Subnets                                       │
│  • Network Policies (Kubernetes)                                 │
│  • Service Mesh mTLS                                           │
│  • Firewall rules                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 3: APPLICATION                                            │
│  • HTTPS / TLS 1.3                                               │
│  • Rate Limiting                                                 │
│  • Input Validation                                              │
│  • Authentication & Authorization                              │
│  • CORS policies                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 4: DATA                                                   │
│  • Encryption at Rest (AES-256)                                  │
│  • Encryption in Transit (TLS)                                   │
│  • Field-level encryption (PII)                                  │
│  • Backup encryption                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 5: MONITORING                                             │
│  • Audit Logging                                                 │
│  • Intrusion Detection                                           │
│  • Anomaly Detection                                             │
│  • Alerting & Response                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.7 Diagramas UML

Esta sección contiene los principales diagramas UML que modelan el sistema completo.

#### 3.7.1 Diagrama de Casos de Uso (Use Case Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DIAGRAMA DE CASOS DE USO                                   │
│                              msseguridad - Sistema                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │   «actor»       │
                           │  Usuario Final  │
                           │   (Persona)     │
                           └────────┬────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │«use case»   │         │«use case»   │         │«use case»   │
    │  Registrar  │         │   Login     │         │   Logout    │
    │   Cuenta    │         │             │         │             │
    └─────────────┘         └──────┬──────┘         └─────────────┘
                                   │
                     ┌─────────────┼─────────────┐
                     │             │             │
                     ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │«use case»│  │«use case»│  │«use case»│
              │Habilitar │  │ Gestionar│  │ Recuperar│
              │   MFA    │  │ Perfil   │  │Password │
              └──────────┘  └──────────┘  └──────────┘
                                   │
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │«use case»│  │«use case»│  │«use case»│
              │  Ver     │  │ Cerrar   │  │ Cambiar  │
              │Sesiones  │  │Sesión    │  │Password  │
              └──────────┘  └──────────┘  └──────────┘


                           ┌─────────────────┐
                           │   «actor»       │
                           │ Administrador   │
                           │   (Persona)     │
                           └────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
 ┌─────────────┐           ┌─────────────┐               ┌─────────────┐
 │«use case»   │           │«use case»   │               │«use case»   │
 │ Crear User  │           │ Editar User │               │ Bloquear    │
 │             │           │             │               │   User      │
 └─────────────┘           └─────────────┘               └─────────────┘
        │                           │                           │
        │              ┌─────────────┴─────────────┐               │
        │              │                             │               │
        ▼              ▼                             ▼               ▼
 ┌─────────────┐ ┌─────────────┐              ┌─────────────┐ ┌─────────────┐
 │«use case»   │ │«use case»   │              │«use case»   │ │«use case»   │
 │ Asignar     │ │ Revocar     │              │  Crear      │ │  Editar     │
 │   Roles     │ │   Roles     │              │   Rol       │ │   Rol       │
 └─────────────┘ └─────────────┘              └─────────────┘ └─────────────┘
        │                                            │
        │              ┌─────────────────────────────┼─────────────┐
        │              │                             │             │
        ▼              ▼                             ▼             ▼
 ┌─────────────┐ ┌─────────────┐              ┌─────────────┐ ┌─────────────┐
 │«use case»   │ │«use case»   │              │«use case»   │ │«use case»   │
 │ Ver Audit   │ │ Exportar    │              │ Configurar  │ │ Ver         │
 │   Logs      │ │   Logs      │              │  Permisos   │ │ Alertas     │
 └─────────────┘ └─────────────┘              └─────────────┘ └─────────────┘


                           ┌─────────────────┐
                           │   «actor»       │
                           │ Sistema Externo │
                           │   (Sistema)     │
                           └────────┬────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │«use case»   │         │«use case»   │         │«use case»   │
    │  Solicitar  │         │  Validar    │         │  Refrescar  │
    │ Autorización│         │   Token     │         │   Token     │
    │   (OAuth2)  │         │             │         │             │
    └─────────────┘         └─────────────┘         └─────────────┘
                                   │
                                   ▼
                          ┌─────────────┐
                          │«include»    │
                          │ Verificar   │
                          │  Permisos   │
                          └─────────────┘

═══════════════════════════════════════════════════════════════════════════════════════
                              RELACIONES INCLUDE/EXTEND
═══════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐            │
│   │    Login      │────────▶│«include»      │         │   Login       │            │
│   │               │         │ Validar       │         │   + MFA       │            │
│   └───────────────┘         │ Credenciales  │         │               │            │
│                             └───────────────┘         └───────────────┘            │
│                                                           ▲                         │
│                                                           │«extend»                  │
│                                                           │(si MFA habilitado)       │
│                                                         ┌─┴─────────────┐            │
│                                                         │ Verificar MFA │            │
│                                                         └───────────────┘            │
│                                                                                     │
│   ┌───────────────┐         ┌───────────────┐                                        │
│   │ Crear User    │────────▶│«include»      │                                        │
│   │               │         │ Validar Email │                                        │
│   └───────────────┘         │ Unico         │                                        │
│                             └───────────────┘                                        │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.7.2 Diagrama de Clases (Class Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA DE CLASES                                      │
│                              Dominio + Aplicación                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   CAPA DE DOMINIO                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   «entity»          │      │   «entity»          │      │   «entity»          │
│   User              │<>────│   Role              │<>────│   Permission        │
├─────────────────────┤ 1  * ├─────────────────────┤ *  * ├─────────────────────┤
│ - id: UUID          │      │ - id: UUID          │      │ - id: UUID          │
│ - email: Email      │      │ - name: string      │      │ - resource: string  │
│ - password: Pass    │      │ - slug: string      │      │ - action: string    │
│ - status: Status    │      │ - hierarchy: int    │      │ - slug: string      │
│ - mfaEnabled: bool│      │ - isDefault: bool  │      │ - conditions: JSON  │
│ - mfaSecret: string│     │                     │      │                     │
│ - lockedUntil: Date │      │ + canAccess()       │      │ + evaluate()        │
│ - failedAttempts: int│     │ + getPermissions()  │      │                     │
│                     │      │                     │      │                     │
│ + login()           │      └─────────────────────┘      └─────────────────────┘
│ + enableMfa()       │                △
│ + disableMfa()      │                │
│ + lock()            │      ┌─────────┴─────────┐
│ + unlock()          │      │                   │
│ + changePassword()  │      ▼                   ▼
│ + verifyPassword()   │┌──────────┐      ┌──────────┐
│ + hasPermission()   ││Superadmin│      │  Admin   │
└─────────────────────┘│  Role    │      │  Role    │
        │ 1            └──────────┘      └──────────┘
        │
        │ 1
        ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   «value object»    │      │   «value object»    │      │   «value object»    │
│   Email             │      │   Password          │      │   Token             │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ - value: string     │      │ - hash: string      │      │ - accessToken: str  │
│                     │      │ - algorithm: string │      │ - refreshToken: str │
│ + validate()        │      │ - salt: string      │      │ - expiresIn: int    │
│ + normalize()       │      │                     │      │ - type: string      │
│ + equals()          │      │ + verify()          │      │                     │
│                     │      │ + needsRehash()     │      │ + isExpired()       │
└─────────────────────┘      │ + toString(): ***   │      │ + toBearer()        │
                             └─────────────────────┘      └─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   «entity»          │      │   «entity»          │      │   «entity»          │
│   RefreshToken      │      │   UserSession       │      │   AuditLog          │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ - id: UUID          │      │ - id: UUID          │      │ - id: bigint        │
│ - userId: UUID      │      │ - userId: UUID      │      │ - userId: UUID      │
│ - tokenHash: string │      │ - sessionToken: str │      │ - action: string    │
│ - familyId: UUID    │      │ - ipAddress: string │      │ - resource: string│
│ - isRevoked: bool   │      │ - userAgent: string │      │ - resourceId: string│
│ - revokedReason: str│      │ - deviceInfo: JSON  │      │ - details: JSON     │
│ - expiresAt: Date │      │ - country: string   │      │ - ipAddress: string │
│ - metadata: JSON    │      │ - city: string      │      │ - status: Status    │
│                     │      │ - isActive: bool    │      │ - createdAt: Date   │
│ + revoke()          │      │ - lastActivity: Date│      │                     │
│ + isValid(): bool   │      │ - expiresAt: Date   │      │                     │
│ + rotate(): Token   │      │                     │      │                     │
│                     │      │ + terminate()       │      │                     │
│                     │      │ + touch()           │      │                     │
└─────────────────────┘      │ + isExpired(): bool │      │                     │
                             └─────────────────────┘      └─────────────────────┘
                                    │ 1
                                    │
                                    ▼
                             ┌─────────────────────┐
                             │   «value object»    │
                             │   GeoLocation       │
                             ├─────────────────────┤
                             │ - latitude: decimal │
                             │ - longitude: decimal│
                             │ - country: string   │
                             │ - city: string      │
                             └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE APLICACIÓN                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐
│ «interface»                   │
│ IAuthService                  │
├───────────────────────────────┤
│ + login(credentials): Result  │
│ + logout(token): Result       │
│ + refreshToken(token): Result │
│ + register(data): Result        │
│ + verifyMfa(userId, code)     │
│ + enableMfa(userId)           │
│ + disableMfa(userId, pass)    │
└───────────────┬───────────────┘
                △
                │ implements
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│ AuthService   │ │ AuthController│
├───────────────┤ ├───────────────┤
│ - userRepo    │ │ - authService │
│ - tokenRepo   │ │ - rateLimiter │
│ - tokenSvc    │ │ - validator   │
│ - security    │ │               │
│ - auditSvc    │ │ + login()     │
│               │ │ + logout()    │
│ + login()     │ │ + refresh()   │
│ + logout()    │ │ + register()  │
│ + refresh()   │ │ + enableMfa() │
└───────────────┘ └───────────────┘

┌───────────────────────────────┐      ┌───────────────────────────────┐
│ «interface»                   │      │ «interface»                   │
│ ITokenService                 │      │ IUserRepository               │
├───────────────────────────────┤      ├───────────────────────────────┤
│ + generateTokens(): Tokens    │      │ + findById(): User            │
│ + verifyAccessToken(): Payload│      │ + findByEmail(): User         │
│ + rotateRefreshToken(): Tokens│      │ + findAll(): User[]           │
│ + revokeToken()               │      │ + save(): User                │
│ + revokeAllUserTokens()       │      │ + update(): User              │
└───────────────┬───────────────┘      │ + delete()                    │
                △                      │ + exists(): boolean           │
                │ implements           └───────────────┬───────────────┘
        ┌───────┴───────┐                              △
        │               │                              │ implements
        ▼               ▼                              │
┌───────────────┐ ┌───────────────┐          ┌─────────┴─────────┐
│ TokenService  │ │ JwtAdapter    │          │TypeOrmUserRepository│
├───────────────┤ ├───────────────┤          ├─────────────────────┤
│ - tokenRepo   │ │ - privateKey  │          │ - repository        │
│ - jwtAdapter  │ │ - publicKey   │          │                     │
│               │ │ - algorithm   │          │ + findById()        │
│ + generate()  │ │               │          │ + findByEmail()     │
│ + verify()    │ │ + sign()      │          │ + save()            │
│ + rotate()    │ │ + verify()    │          │ + update()          │
└───────────────┘ └───────────────┘          └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE INFRAESTRUCTURA                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐      ┌───────────────────────────────┐      ┌───────────────┐
│ «interface»                   │      │ «interface»                   │      │ «adapter»     │
│ ISecurityAdapter              │      │ IEmailAdapter                 │      │ Argon2Adapter │
├───────────────────────────────┤      ├───────────────────────────────┤      ├───────────────┤
│ + hashPassword(): string      │      │ + send()                      │      │ - argon2      │
│ + verifyPassword(): boolean   │      │ + sendTemplate()              │      │               │
│ + needsRehash(): boolean      │      │ + sendBulk()                  │      │ + hash()      │
└───────────────┬───────────────┘      └───────────────┬───────────────┘      │ + verify()    │
                △                                      △                      └───────────────┘
                │                                      │
                └──────────────────┬───────────────────┘
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                         ▼                   ▼
               ┌───────────────┐   ┌───────────────┐
               │SecurityService│   │ EmailService  │
               └───────────────┘   └───────────────┘
```

#### 3.7.3 Diagramas de Secuencia (Sequence Diagrams)

**Diagrama de Secuencia: Login con MFA**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SECUENCIA: LOGIN CON MFA                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Cliente              API              AuthService          UserRepo         MFAService
      │                   │                    │                 │                 │
      │ POST /login       │                    │                 │                 │
      │──────────────────▶│                    │                 │                 │
      │                   │ validate(cred)     │                 │                 │
      │                   │──────────────────▶│                │                 │
      │                   │                    │ findByEmail()   │                 │
      │                   │                    │────────────────▶│                 │
      │                   │                    │◀────────────────│                 │
      │                   │                    │                 │                 │
      │                   │                    │ verifyPassword()                │
      │                   │                    │ (Argon2id)      │                 │
      │                   │                    │────────┐        │                 │
      │                   │                    │◀───────┘        │                 │
      │                   │                    │                 │                 │
      │                   │                    │ checkMfaEnabled │                 │
      │                   │                    │────────┐        │                 │
      │                   │                    │◀───────┘        │                 │
      │                   │                    │                 │                 │
      │     [MFA enabled] │                    │                 │                 │
      │◀──────────────────│ return MFA_REQUIRED│                 │                 │
      │                   │                    │                 │                 │
      │ POST /mfa/verify  │                    │                 │                 │
      │──────────────────▶│ verifyMfa()        │                 │                 │
      │                   │──────────────────▶│                 │                 │
      │                   │                    │                 │                 │──┐
      │                   │                    │                 │                 │  │ verifyTOTP
      │                   │                    │                 │                 │◀─┘
      │                   │                    │◀─────────────────────────────────│
      │                   │                    │                 │                 │
      │                   │                    │ generateTokens()                  │
      │                   │                    │────────┐        │                 │
      │                   │                    │        │ sign JWT              │
      │                   │                    │◀───────┘        │                 │
      │                   │                    │                 │                 │
      │                   │                    │ saveRefreshToken                │
      │                   │                    │────────────────▶│                 │
      │                   │                    │◀────────────────│                 │
      │                   │                    │                 │                 │
      │                   │    return Tokens   │                 │                 │
      │◀──────────────────│◀───────────────────│                 │                 │
      │                   │                    │                 │                 │
      ├───────────────────┴────────────────────┴─────────────────┴─────────────────┤
      │                              ASYNC (no bloqueante)                          │
      │                   │                    │                 │                 │
      │                   │                    │ logEvent()      │                 │
      │                   │                    │───────────────────────────────────▶│
      │                   │                    │                 │                 │
      │                   │                    │ sendEmail()     │                 │
      │                   │                    │──────────────────────────────▶  │
      │                   │                    │                 │                 │
```

**Diagrama de Secuencia: Rotación de Refresh Token (Family Pattern)**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SECUENCIA: ROTACIÓN DE REFRESH TOKEN                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Cliente              API            TokenService        TokenRepo        JwtAdapter
      │                   │                  │                 │               │
      │ POST /refresh     │                  │                 │               │
      │ {refreshToken}    │                  │                 │               │
      │──────────────────▶│                 │                 │               │
      │                   │ rotate(token)    │                 │               │
      │                   │─────────────────▶│                │               │
      │                   │                  │                 │               │
      │                   │                  │ findByHash()    │               │
      │                   │                  │────────────────▶│               │
      │                   │                  │◀────────────────│               │
      │                   │                  │                 │               │
      │                   │                  │ [Token no existe]              │
      │                   │                  │ ──▶ return Error               │
      │                   │                  │                 │               │
      │                   │                  │ [Token revocado]               │
      │                   │                  │ ──▶ revokeFamily() ────────────▶│
      │                   │                  │ return Error (suspicious)      │
      │                   │                  │                 │               │
      │                   │                  │ [Token válido]                 │
      │                   │                  │                 │               │
      │                   │                  │ verifyExpiry()  │               │
      │                   │                  │────────┐        │               │
      │                   │                  │◀───────┘        │               │
      │                   │                  │                 │               │
      │                   │                  │ generateNewPair │               │
      │                   │                  │────────┐        │               │
      │                   │                  │        │ sign()  │               │
      │                   │                  │        │────────▶│               │
      │                   │                  │        │◀────────│               │
      │                   │                  │◀───────┘        │               │
      │                   │                  │                 │               │
      │                   │                  │ save(newToken)  │               │
      │                   │                  │ markOldReplaced │               │
      │                   │                  │────────────────▶│               │
      │                   │                  │◀────────────────│               │
      │                   │                  │                 │               │
      │                   │    return Tokens │                 │               │
      │◀──────────────────│◀─────────────────│                 │               │
      │                   │                  │                 │               │
```

**Diagrama de Secuencia: OAuth2 Authorization Code Flow con PKCE**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SECUENCIA: OAUTH2 AUTHORIZATION CODE + PKCE                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

  UserAgent    ClientApp     AuthServer      UserRepo      OAuthRepo      JwtAdapter
      │            │             │             │             │             │
      │            │ 1. /authorize?           │             │             │
      │            │    client_id&            │             │             │
      │            │    code_challenge        │             │             │
      │            │────────────────────────▶│             │             │
      │            │             │             │             │             │
      │ redirect   │             │ 2. validate client      │             │
      │ to login   │             │────────────────────────▶│             │
      │◀───────────│             │             │             │             │
      │            │             │◀────────────│             │             │
      │            │             │             │             │             │
      │ 3. login   │             │             │             │             │
      │────────────────────────▶│             │             │             │
      │            │             │ authenticate│             │             │
      │            │             │────────────▶│             │             │
      │            │             │◀────────────│             │             │
      │            │             │             │             │             │
      │ consent    │             │ 4. check grants           │             │
      │ screen     │             │             │             │             │
      │◀───────────│             │             │             │             │
      │            │             │             │             │             │
      │ approve    │             │             │             │             │
      │────────────────────────▶│             │             │             │
      │            │             │             │             │             │
      │            │             │ 5. generate code          │             │
      │            │             │──────────────────────────▶│             │
      │            │             │             │             │             │
      │ redirect   │             │             │             │             │
      │ to         │             │             │             │             │
      │ redirect_uri│            │             │             │             │
      │?code=xxx   │             │             │             │             │
      │───────────▶│             │             │             │             │
      │            │             │             │             │             │
      │            │ 6. POST /token           │             │             │
      │            │    code&                  │             │             │
      │            │    code_verifier          │             │             │
      │            │────────────────────────▶│             │             │
      │            │             │             │             │             │
      │            │             │ 7. verify PKCE            │             │
      │            │             │    S256(code_verifier)    │             │
      │            │             │    == code_challenge    │             │
      │            │             │────────────┐            │             │
      │            │             │◀───────────┘            │             │
      │            │             │             │             │             │
      │            │             │ 8. consume code           │             │
      │            │             │──────────────────────────▶│             │
      │            │             │             │             │             │
      │            │             │ 9. generate tokens        │             │
      │            │             │───────────────────────────────────────▶│
      │            │             │             │             │             │
      │            │             │◀───────────────────────────────────────│
      │            │             │             │             │             │
      │            │    10. return {access, refresh}       │             │
      │            │◀────────────────────────│             │             │
      │            │             │             │             │             │
```

#### 3.7.4 Diagrama de Actividades (Activity Diagram)

**Proceso de Autenticación Completo**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ACTIVITY: PROCESO DE AUTENTICACIÓN                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────┐
                        │  START  │
                        └────┬────┘
                             │
                             ▼
                    ┌─────────────────┐
         ┌─────────│  Recibir Request  │
         │         │   POST /login     │
         │         └────────┬────────┘
         │                  │
         │                  ▼
         │         ┌─────────────────┐
         │         │ Validar Schema  │
         │         │   (Joi/Zod)     │
         │         └────────┬────────┘
         │                  │
         │      ┌───────────┴───────────┐
         │      │                       │
         │   [Inválido]             [Válido]
         │      │                       │
         │      ▼                       ▼
         │ ┌─────────┐         ┌─────────────────┐
         │ │ return  │         │  Buscar User    │
         │ │ 400     │         │  por Email      │
         │ └────┬────┘         └────────┬────────┘
         │      │                        │
         │      │              ┌─────────┴─────────┐
         │      │              │                   │
         │      │          [No existe]        [Existe]
         │      │              │                   │
         │      │              ▼                   ▼
         │      │      ┌─────────────┐    ┌─────────────┐
         │      │      │ return 401  │    │ Verificar   │
         │      │      │ credencial  │    │ Password    │
         │      │      │  inválida   │    │  Argon2id   │
         │      │      └─────────────┘    └──────┬──────┘
         │      │                                 │
         │      │                    ┌────────────┴────────────┐
         │      │                    │                         │
         │      │                [Inválida]              [Válida]
         │      │                    │                         │
         │      │                    ▼                         ▼
         │      │          ┌─────────────┐            ┌─────────────┐
         │      │          │ Incrementar │            │ Resetear    │
         │      │          │   intentos  │            │  intentos   │
         │      │          └──────┬──────┘            └──────┬──────┘
         │      │                 │                          │
         │      │                 ▼                          ▼
         │      │      ┌─────────────────┐         ┌─────────────────┐
         │      │      │  Intentos >= 5? │         │ Verificar MFA   │
         │      │      └────────┬────────┘         │  habilitado?    │
         │      │               │                  └────────┬────────┘
         │      │        ┌──────┴──────┐                      │
         │      │        │             │              ┌───────┴────────┐
         │      │     [No]         [Sí]            [No]           [Sí]
         │      │        │             │              │                │
         │      │        ▼             ▼              ▼                ▼
         │      │  ┌─────────┐  ┌─────────────┐ ┌──────────┐ ┌─────────────┐
         │      │  │return   │  │ Bloquear    │ │ Generar  │ │ Solicitar   │
         │      │  │401      │  │ cuenta 15min│ │ tokens   │ │ código MFA  │
         │      │  │         │  │             │ │          │ │             │
         │      │  └────┬────┘  └──────┬──────┘ └────┬─────┘ └──────┬──────┘
         │      │       │              │             │              │
         │      │       └──────────────┴─────────────┴──────────────┘
         │      │                              │
         │      │                              ▼
         │      │                     ┌─────────────────┐
         │      │                     │   return 202    │
         │      │                     │ MFA_REQUIRED    │
         │      │                     └────────┬────────┘
         │      │                              │
         │      └──────────────────────────────┘
         │                                     │
         │                        ┌────────────┴────────────┐
         │                        │                         │
         │                    [POST /mfa/verify]       [Skip MFA]
         │                        │                         │
         │                        ▼                         ▼
         │               ┌─────────────┐          ┌─────────────┐
         │               │ Verificar   │          │ Generar     │
         │               │ código TOTP │          │ Access+Refresh│
         │               └──────┬──────┘          └──────┬──────┘
         │                      │                        │
         │              ┌───────┴───────┐                │
         │              │               │                │
         │          [Válido]      [Inválido]             │
         │              │               │                │
         │              ▼               ▼                │
         │      ┌─────────────┐  ┌─────────────┐          │
         │      │ Generar     │  │ return 401  │          │
         │      │ tokens      │  │ MFA inválido│          │
         │      └──────┬──────┘  └─────────────┘          │
         │             │                                   │
         │             └───────────────────────────────────┘
         │                             │
         │                             ▼
         │                  ┌─────────────────┐
         │                  │ Guardar Refresh │
         │                  │ Token en DB     │
         │                  └────────┬────────┘
         │                           │
         │                           ▼
         │                  ┌─────────────────┐
         │         ┌───────│  Auditar Evento │
         │         │       │   (async)       │
         │         │       └────────┬────────┘
         │         │                │
         │         │                ▼
         │         │       ┌─────────────────┐
         │         │       │ return 200 +    │
         └─────────┼──────▶│ {access, refresh}│
                   │       └────────┬────────┘
                   │                │
                   │                ▼
                   │       ┌─────────────────┐
                   │       │     END         │
                   │       └─────────────────┘
                   │
                   └──────────────────────────────────────────────┘
```

#### 3.7.5 Diagrama de Estado (State Machine)

**Máquina de Estados: Refresh Token Lifecycle**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    STATE MACHINE: REFRESH TOKEN LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │   [START]   │
                         └──────┬──────┘
                                │ generate()
                                ▼
                         ┌─────────────┐
                         │   ACTIVE    │
                         │  (fresh)    │
                         └──────┬──────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                │ use()         │ expire()      │ revoke()
                ▼               ▼               ▼
         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │  USED_ONCE  │ │   EXPIRED   │ │  REVOKED    │
         │             │ │             │ │             │
         │ (replaced)  │ │             │ │ (compromised)│
         └──────┬──────┘ └─────────────┘ └─────────────┘
                │ use() again
                │ (reuse detected!)
                ▼
         ┌─────────────┐         ┌─────────────┐
         │ REUSE_DETECT│────────▶│ REVOKE_ALL  │
         │             │         │ (entire     │
         │ (suspicious)│         │  family)    │
         └─────────────┘         └─────────────┘
                │
                │ alertSecurityTeam()
                ▼
         ┌─────────────┐
         │ [END STATE] │
         └─────────────┘

═══════════════════════════════════════════════════════════════════════════════════════
                    STATE MACHINE: USER ACCOUNT
═══════════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────┐
                              │   [START]   │
                              └──────┬──────┘
                                     │ register()
                                     ▼
                              ┌─────────────┐
                              │   PENDING   │
                              │(email not   │
                              │  verified)   │
                              └──────┬──────┘
                                     │ verifyEmail()
                                     ▼
                              ┌─────────────┐
                         ┌───▶│   ACTIVE    │◀───┐
                         │    │             │    │
                         │    └──────┬──────┘    │
                         │           │           │
          ┌─────────────┼───────────┼───────────┼─────────────┐
          │             │           │           │             │
          │suspend()    │block()    │deactivate()│    activate()│
          ▼             ▼           ▼           ▼             │
   ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐│
   │  SUSPENDED  ││   BLOCKED   ││  INACTIVE   ││   LOCKED    │┘
   │             ││  (temporal) ││             ││(failed logins)│
   │             ││             ││             ││             │
   │             ││  │          ││             ││             │
   │             ││  │ auto-unlock│             ││             │
   │             ││  │ after 15min│             ││             │
   │             ││  ▼          ││             ││             │
   │             │└─────────────┘│             │└─────────────┘
   │             │               │             │
   └─────────────┘               └─────────────┘

═══════════════════════════════════════════════════════════════════════════════════════
                    STATE MACHINE: MFA VERIFICATION
═══════════════════════════════════════════════════════════════════════════════════════

                    ┌─────────────┐
                    │ [IDLE] /   │
                    │ MFA_DISABLED│
                    └──────┬──────┘
                           │ enableMfa()
                           ▼
                    ┌─────────────┐
                    │ MFA_SETUP   │
                    │ (secret gen)│
                    └──────┬──────┘
                           │ confirmWithCode()
                           ▼
                    ┌─────────────┐
              ┌────▶│ MFA_ENABLED │◀────┐
              │     │             │     │
              │     └──────┬──────┘     │
              │            │            │
              │    ┌───────┴───────┐    │
              │    │               │    │
              │login()           │disableMfa()
              │    │               │    │
              │    ▼               ▼    │
              │┌──────────┐   ┌─────────┐│
              ││MFA_VERIFY│   │ [IDLE]  ││
              ││(code req)│   │         │┘
              │└────┬─────┘   └─────────┘
              │     │
              │     │ verifyCode()
              │     │
              │   ┌─┴───────────┐
              └───┤ MFA_SUCCESS │
                  │ (logged in) │
                  └─────────────┘
```

#### 3.7.6 Diagrama de Componentes de Despliegue (Deployment Component Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    DIAGRAMA DE COMPONENTES DE DESPLIEGUE                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              «device» Cloud / VPS                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                      «node» Kubernetes Cluster                                   │ │
│  │                                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    «artifact» Ingress Controller (nginx)                     │ │ │
│  │  │                      - TLS termination                                        │ │ │
│  │  │                      - Rate limiting                                        │ │ │
│  │  │                      - Path routing                                         │ │ │
│  │  └────────────────────────────┬────────────────────────────────────────────────┘ │ │
│  │                               │                                                │ │
│  │                               ▼                                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    «node» Service: msseguridad-app                           │ │ │
│  │  │                                                                               │ │ │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │ │ │
│  │  │  │ «component»     │  │ «component»     │  │ «component»     │               │ │ │
│  │  │  │   API REST      │  │   WebSocket     │  │   Health        │               │ │ │
│  │  │  │   (Express)     │  │   (Socket.io)   │  │   (/health)     │               │ │ │
│  │  │  │                 │  │                 │  │                 │               │ │ │
│  │  │  │ - Auth routes   │  │ - Session mgmt  │  │ - Liveness      │               │ │ │
│  │  │  │ - OAuth routes  │  │ - Real-time     │  │ - Readiness     │               │ │ │
│  │  │  │ - Admin routes  │  │   notif         │  │ - Metrics       │               │ │ │
│  │  │  └────────┬────────┘  └─────────────────┘  └─────────────────┘               │ │ │
│  │  │           │                                                                  │ │ │
│  │  │           ▼                                                                  │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ «component» Application Core (Node.js / TypeScript)                    │ │ │ │
│  │  │  │                                                                          │ │ │ │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │ │ │
│  │  │  │  │ Services    │  │ Repositories│  │ Adapters    │  │ Middleware  │   │ │ │ │
│  │  │  │  │             │  │             │  │             │  │             │   │ │ │ │
│  │  │  │  │ AuthService │  │ UserRepo    │  │ Argon2      │  │ Auth        │   │ │ │ │
│  │  │  │  │ TokenService│  │ TokenRepo   │  │ JWT         │  │ RateLimit   │   │ │ │ │
│  │  │  │  │ UserService │  │ SessionRepo │  │ TOTP        │  │ Validator   │   │ │ │ │
│  │  │  │  │ AuditService│  │ AuditRepo   │  │ Email       │  │ Logger      │   │ │ │ │
│  │  │  │  │ MFAService  │  │ OAuthRepo   │  │ Logger      │  │ ErrorHandler│   │ │ │ │
│  │  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │ │ │
│  │  │  └────────────────────────────────────┬──────────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────┼──────────────────────────────────────┘ │ │
│  │                                          │                                          │ │
│  │  ┌───────────────────────────────────────┼──────────────────────────────────────┐ │ │
│  │  │                    «database»         ▼                                      │ │ │
│  │  │                                                                               │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ «database» MySQL 8.0 (StatefulSet)                                       │ │ │ │
│  │  │  │                                                                          │ │ │ │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │ │ │
│  │  │  │  │ users       │  │ roles       │  │ permissions │  │ refresh_tok │       │ │ │ │
│  │  │  │  │             │  │             │  │             │  │             │       │ │ │ │
│  │  │  │  │ user_roles  │  │ role_perm   │  │ audit_logs  │  │ sessions    │       │ │ │ │
│  │  │  │  │             │  │             │  │             │  │             │       │ │ │ │
│  │  │  │  │ oauth_*     │  │ mfa_backup  │  │ pass_hist   │  │ security_ev │       │ │ │ │
│  │  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │ │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────────────┘ │ │ │
│  │  │                                    ▲                                          │ │ │
│  │  │                                    │ replica                                  │ │ │
│  │  │  ┌─────────────────────────────────┴─────────────────────────────────────┐ │ │ │
│  │  │  │ «database» MySQL Replica (Read replicas)                                 │ │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ «database» Redis Cluster (StatefulSet)                                       │ │ │
│  │  │                                                                               │ │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                           │ │ │
│  │  │  │ sessions    │  │ rate_limit  │  │ cache       │                           │ │ │
│  │  │  │ store       │  │ counters    │  │ entries     │                           │ │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                           │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │                    «node» Observability Stack                                    │ │
│  │                                                                                   │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │ │
│  │  │ Prometheus      │  │ Grafana         │  │ Loki/ELK        │  │ Jaeger      │ │ │
│  │  │ (metrics)       │  │ (dashboards)    │  │ (logs)          │  │ (tracing)   │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ network
                                     ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              «device» External Services                                │
│                                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐    │
│  │ SMTP Server     │  │ HashiCorp Vault │  │ SonarQube       │  │ Cloud       │    │
│  │ (Email)         │  │ (Secrets)       │  │ (Code Quality)  │  │ Provider    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. STACK TECNOLÓGICO

### 4.1 Stack Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    STACK TECNOLÓGICO COMPLETO                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME & LENGUAJE                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Node.js 20 │  │  TypeScript  │  │  ts-node / tsx      │     │
│  │  (LTS)      │  │  5.x         │  │  (dev runtime)      │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  FRAMEWORK & MIDDLEWARE                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Express.js │  │  Helmet      │  │  express-rate-limit│     │
│  │  4.x        │  │  (security)  │  │  (throttling)       │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │  CORS       │  │  compression │  │  express-validator  │     │
│  │             │  │              │  │  / Joi              │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  BASE DE DATOS                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  MySQL 8.0  │  │  TypeORM     │  │  Redis 7            │     │
│  │  (Primary)  │  │  0.3.x       │  │  (Cache/Sessions)   │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  SEGURIDAD                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Argon2id   │  │  jsonwebtoken│  │  speakeasy          │     │
│  │  (passwords)│  │  / jose      │  │  (TOTP)             │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │  crypto     │  │  node-rsa    │  │  passport.js        │     │
│  │  (native)   │  │  (keys)      │  │  (oauth strategy)   │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  UTILIDADES                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Winston    │  │  dotenv      │  │  uuid               │     │
│  │  (logging)  │  │  (config)    │  │  (ids)              │     │
│  ├─────────────┤  ├──────────────┤  ├─────────────────────┤     │
│  │  date-fns   │  │  nodemailer  │  │  class-validator    │     │
│  │  (dates)    │  │  (email)     │  │  (DTOs)             │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Justificación del Stack

| Tecnología | Alternativas | Decisión | Justificación |
|------------|--------------|----------|---------------|
| **Node.js** | Deno, Bun | Node.js 20 LTS | Madurez, ecosistema, soporte enterprise |
| **TypeScript** | JavaScript | TypeScript 5.x | Tipado estático, mejor DX, menos bugs |
| **Express** | Fastify, Koa, NestJS | Express 4.x | Maduro, amplia comunidad, familiaridad equipo |
| **MySQL** | PostgreSQL, MongoDB | MySQL 8.0 | Requerimiento del cliente, JSON support, performance |
| **TypeORM** | Prisma, Sequelize, Knex | TypeORM | Decoradores, migrations, relaciones complejas |
| **Redis** | Memcached | Redis 7 | Estructuras de datos, TTL nativo, pub/sub |
| **Argon2id** | bcrypt, scrypt | Argon2id | Ganador Password Hashing Competition, OWASP recomendado |
| **JWT (RS256)** | HS256, ES256 | RS256 | Asimétrico, separación de firmado/verificación |

### 4.3 Dependencias package.json

```json
{
  "name": "msseguridad",
  "version": "1.0.0",
  "description": "Microservicio de seguridad y autenticación",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",
    
    "typeorm": "^0.3.17",
    "mysql2": "^3.6.5",
    "ioredis": "^5.3.2",
    
    "argon2": "^0.31.2",
    "jose": "^5.1.3",
    "jsonwebtoken": "^9.0.2",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "node-rsa": "^1.1.1",
    
    "passport": "^0.6.0",
    "passport-oauth2": "^1.7.0",
    "passport-jwt": "^4.0.1",
    
    "joi": "^17.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "uuid": "^9.0.1",
    "date-fns": "^3.0.0",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1",
    "reflect-metadata": "^0.1.13",
    "config": "^3.3.9"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/uuid": "^9.0.7",
    "@types/passport": "^1.0.16",
    "@types/joi": "^17.9.12",
    "@types/config": "^3.3.3",
    
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "tsx": "^4.6.2",
    "nodemon": "^3.0.2",
    
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "jest-mock-extended": "^3.0.5",
    
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-security": "^2.1.0",
    "eslint-plugin-node": "^11.1.0",
    
    "prettier": "^3.1.1",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3"
  }
}
```

---

## 5. HERRAMIENTAS DE CONSTRUCCIÓN

### 5.1 IDE y Desarrollo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTORNO DE DESARROLLO                        │
└─────────────────────────────────────────────────────────────────┘

Editor: VS Code
├── Extensiones
│   ├── ESLint (linting en tiempo real)
│   ├── Prettier (formateo automático)
│   ├── TypeScript Importer
│   ├── REST Client (testing APIs)
│   ├── Thunder Client (alternativa Postman)
│   ├── Docker (gestión de contenedores)
│   └── Database Client (conexión MySQL/Redis)
│
├── Settings
│   ├── Format on save: true
│   ├── ESLint auto-fix on save: true
│   ├── Tab size: 2
│   └── TypeScript strict mode
│
└── Snippets personalizados para proyectos
```

### 5.2 Control de Calidad de Código

| Herramienta | Propósito | Integración |
|-------------|-----------|-------------|
| **ESLint** | Linting TypeScript/JavaScript | Pre-commit, CI |
| **Prettier** | Formateo consistente | Pre-commit, IDE |
| **TypeScript** | Type checking | Build, CI |
| **Husky** | Git hooks | Pre-commit |
| **lint-staged** | Lint solo archivos staged | Pre-commit |
| **Commitlint** | Conventional commits | Commit-msg hook |

### 5.3 Herramientas de Testing

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIRÁMIDE DE TESTING                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │    E2E Tests        │  ← Supertest + Jest
                    │    (Few)            │     Flujos completos
                    │    ~10 tests        │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  Integration Tests  │  ← TestContainers
                    │  (Some)             │     + Jest
                    │  ~50 tests          │     APIs + DB
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │    Unit Tests       │  ← Jest + mocks
                    │    (Many)           │     Services
                    │    ~200 tests       │     Domain
                    └─────────────────────┘

Cobertura Objetivo:
├── Líneas: 80%
├── Funciones: 80%
├── Branches: 70%
└── Statements: 80%
```

### 5.4 Seguridad en el Desarrollo

| Herramienta | Tipo | Propósito | Fase |
|-------------|------|-----------|------|
| **eslint-plugin-security** | SAST | Detectar patrones inseguros | Desarrollo |
| **npm audit** | SCA | Vulnerabilidades en deps | CI/CD |
| **Snyk** | SCA/SAST | Análisis continuo de seguridad | CI/CD |
| **Semgrep** | SAST | Reglas personalizadas de seguridad | CI/CD |
| **SonarQube** | SAST | Calidad y seguridad de código | CI/CD |
| **Trivy** | SCA/Container | Escaneo de imágenes Docker | CI/CD |
| **OWASP ZAP** | DAST | Testing dinámico | Staging |
| **GitLeaks** | Secrets | Detección de secretos | Pre-commit |
| **TruffleHog** | Secrets | Búsqueda de credenciales | CI/CD |

---

## 6. CICLO DE VIDA DE SOFTWARE

### 6.1 Metodología: Scrum + DevSecOps

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEVSECOPS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  PLAN   │──▶│  CODE   │──▶│  BUILD  │──▶│  TEST   │──▶│  SECURE │
│         │   │         │   │         │   │         │   │         │
│ • Req   │   │ • Dev   │   │ • Lint  │   │ • Unit  │   │ • SAST  │
│ • Arch  │   │ • Peer  │   │ • Comp  │   │ • Int   │   │ • DAST  │
│ • Sprints│  │  review │   │ • Image │   │ • E2E   │   │ • SCA   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │                                                    │
     │         ┌─────────┐   ┌─────────┐   ┌─────────┐   │
     └────────▶│ DEPLOY  │◀──│ RELEASE │◀──│ PACKAGE │◀──┘
               │         │   │         │   │         │
               │ • K8s   │   │ • Tag   │   │ • Image │
               │ • Blue  │   │ • Notes │   │ • SBOM  │
               │   /Green│   │ • Comms │   │         │
               └─────────┘   └─────────┘   └─────────┘
                     │
                     ▼
               ┌─────────┐   ┌─────────┐
               │ OPERATE │──▶│ MONITOR │
               │         │   │         │
               │ • Run   │   │ • Logs  │
               │ • Scale │   │ • Met   │
               │ • Backup│   │ • Alert │
               └─────────┘   └─────────┘
```

### 6.2 Flujo de Trabajo Git

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB FLOW (Simplificado)                   │
└─────────────────────────────────────────────────────────────────┘

main (protegida)
  │
  │  1. Crear feature branch
  ├── feature/REQ-123-login-mfa
  │     │
  │     │ 2. Desarrollo + commits
  │     │ • feat: add MFA service
  │     │ • test: add MFA unit tests
  │     │ • docs: update API spec
  │     │
  │     │ 3. Pre-commit hooks
  │     │ • ESLint ✓
  │     │ • Prettier ✓
  │     │ • Tests staged ✓
  │     │ • Commitlint ✓
  │     │
  │     │ 4. Push + PR
  │     ├──▶ Pull Request
  │           │
  │           │ 5. CI/CD Pipeline
  │           │ • Build ✓
  │           │ • Tests ✓
  │           │ • Security scans ✓
  │           │ • SonarQube ✓
  │           │
  │           │ 6. Code Review
  │           │ • Aprobación required
  │           │ • No security issues
  │           │
  │◀──────────┘ 7. Merge squash
  │
  │ 8. Deploy automático (staging)
  │
  └── tag: v1.2.0 ──▶ Deploy producción
```

### 6.3 Pipeline CI/CD

```yaml
# .github/workflows/cicd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ───────────────────────────────────────────────
  # FASE 1: CODE QUALITY
  # ───────────────────────────────────────────────
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck

  # ───────────────────────────────────────────────
  # FASE 2: SECURITY SCANS (SAST + SCA)
  # ───────────────────────────────────────────────
  security-scan:
    runs-on: ubuntu-latest
    needs: lint-and-format
    steps:
      - uses: actions/checkout@v4
      
      # npm audit
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      # Snyk
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      # Semgrep
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/cwe-top-25
            p/nodejs
            p/typescript
      
      # Secret scanning
      - name: Run GitLeaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ───────────────────────────────────────────────
  # FASE 3: TESTING
  # ───────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    needs: security-scan
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      # Unit tests
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      # Integration tests
      - name: Run integration tests
        run: npm run test:integration
        env:
          DB_HOST: localhost
          DB_PORT: 3306
          REDIS_HOST: localhost
      
      # Upload coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ───────────────────────────────────────────────
  # FASE 4: SONARQUBE ANALYSIS
  # ───────────────────────────────────────────────
  sonarqube:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        with:
          scanMetadataReportFile: .scannerwork/report-task.txt
        timeout-minutes: 5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

  # ───────────────────────────────────────────────
  # FASE 5: BUILD & PACKAGE
  # ───────────────────────────────────────────────
  build:
    runs-on: ubuntu-latest
    needs: [test, sonarqube]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      # Build Docker image
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build image
        run: docker build -t msseguridad:${{ github.sha }} .
      
      # Scan Docker image
      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'msseguridad:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      # Generate SBOM
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: 'msseguridad:${{ github.sha }}'

  # ───────────────────────────────────────────────
  # FASE 6: DEPLOY STAGING
  # ───────────────────────────────────────────────
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to Staging
        run: |
          echo "Deploying to staging..."
          # kubectl apply -f k8s/staging/

  # ───────────────────────────────────────────────
  # FASE 7: DEPLOY PRODUCTION
  # ───────────────────────────────────────────────
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          echo "Deploying to production..."
          # kubectl apply -f k8s/production/
```

### 6.4 Estrategia de Versionado

| Versión | Formato | Ejemplo | Significado |
|---------|---------|---------|-------------|
| **Major** | X.0.0 | 2.0.0 | Cambios breaking (API v2) |
| **Minor** | x.Y.0 | 1.3.0 | Nuevas features, compatible |
| **Patch** | x.y.Z | 1.3.2 | Bug fixes, seguridad |

**Conventional Commits:**
```
feat: add MFA support
fix: resolve token rotation bug
docs: update API documentation
test: add integration tests for OAuth
refactor: improve password validation
security: fix JWT algorithm confusion
chore: update dependencies
```

---

## 7. DEVOPS Y OPERACIONES

### 7.1 Infraestructura como Código

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA (Terraform)                  │
└─────────────────────────────────────────────────────────────────┘

infrastructure/
├── modules/
│   ├── kubernetes/         # GKE/EKS/AKS
│   ├── mysql/              # Cloud SQL
│   ├── redis/              # Memorystore
│   ├── networking/         # VPC, subnets
│   └── monitoring/         # Prometheus/Grafana
│
├── environments/
│   ├── development/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
│
└── global/
    └── dns.tf              # Cloud DNS
```

### 7.2 Orquestación con Kubernetes

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: msseguridad
  labels:
    app: msseguridad
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: msseguridad
  template:
    metadata:
      labels:
        app: msseguridad
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: msseguridad
          image: msseguridad:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: host
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: msseguridad-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: msseguridad
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 7.3 Monitoreo y Observabilidad

```
┌─────────────────────────────────────────────────────────────────┐
│                    STACK DE OBSERVABILIDAD                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌─────────────┐      ┌─────────────────────┐
│  Prometheus │◀────▶│   Grafana   │      │      AlertManager   │
│  (Metrics)  │      │ (Dashboards)│      │    (Notifications)  │
└──────┬──────┘      └─────────────┘      └─────────────────────┘
       │
       │ Pull metrics
       │
┌──────┴──────────────────────────────────────────────────────────┐
│                    APLICACIÓN (msseguridad)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ prom-client │  │  Winston     │  │  OpenTelemetry      │  │
│  │ (custom)    │  │  (logs)      │  │  (tracing)          │  │
│  └─────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
       │                              │
       │ Logs                         │ Traces
       ▼                              ▼
┌─────────────────────┐      ┌─────────────────────┐
│   Loki / ELK        │      │   Jaeger / Zipkin   │
│   (Log aggregation) │      │   (Distributed)     │
└─────────────────────┘      └─────────────────────┘
```

**Dashboards Grafana:**
- Overview de servicio (RPS, latencia, errores)
- Métricas de seguridad (login attempts, bloqueos)
- Métricas de negocio (usuarios activos, tokens emitidos)
- Métricas de infraestructura (CPU, memoria, DB connections)

**Alertas:**
| Condición | Severidad | Acción |
|-----------|-----------|--------|
| Error rate > 5% | Critical | PagerDuty |
| Latencia p99 > 1s | Warning | Slack |
| Failed logins > 100/min | Warning | Email security team |
| DB connections > 80% | Warning | Auto-scale |

### 7.4 Estrategia de Backup

| Componente | Frecuencia | Retención | Método |
|------------|------------|-----------|--------|
| MySQL | Diario | 30 días | mysqldump + binlogs |
| MySQL | Cada 6 horas | 7 días | Snapshots volumen |
| Redis | Continuo | N/A | AOF + RDB |
| Configuración | Cada cambio | Infinito | Git + Vault |

---

## 8. PLAN DE IMPLEMENTACIÓN

### 8.1 Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROADMAP DE IMPLEMENTACIÓN                    │
└─────────────────────────────────────────────────────────────────┘

Q1 2026 (3 meses)          Q2 2026 (3 meses)          Q3 2026 (2 meses)
┌──────────────────┐      ┌──────────────────┐      ┌──────────┐
│ MVP - Core Auth    │      │ Feature Complete │      │ Hardening│
│                    │      │                  │      │          │
│ • Setup proyecto   │─────▶│ • MFA            │─────▶│ • SOC2   │
│ • Arquitectura     │      │ • OAuth2/OIDC    │      │   prep   │
│ • Modelo datos     │      │ • Admin panel    │      │ • Stress │
│ • Registro/Login   │      │ • Audit logs     │      │   tests  │
│ • JWT básico       │      │ • Rate limiting  │      │ • Pen    │
│ • Tests unit       │      │ • Email service  │      │   testing│
│ • CI/CD            │      │ • Docs completos │      │ • DR     │
│ • Deploy staging   │      │ • Deploy prod    │      │   drills │
└──────────────────┘      └──────────────────┘      └──────────┘
     Sprint 1-6               Sprint 7-12             Sprint 13-16
```

### 8.2 Estimación de Esfuerzo

| Fase | Esfuerzo | Equipo |
|------|----------|--------|
| Setup y arquitectura | 2 semanas | Arquitecto + Tech Lead |
| Core authentication | 4 semanas | 2 Backend devs |
| OAuth2/OIDC | 3 semanas | 2 Backend devs |
| MFA y seguridad | 2 semanas | 2 Backend devs |
| Admin panel | 2 semanas | 1 Full-stack + 1 Backend |
| Testing y QA | 2 semanas | QA + Devs |
| DevOps y deploy | 2 semanas | DevOps + Backend |
| Documentación | 1 semana | Tech Writer + Devs |
| **TOTAL** | **18 semanas** | **4-5 personas** |

### 8.3 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad OAuth2 | Media | Alto | Usar librería probada (node-oauth2-server) |
| Performance con escala | Media | Alto | Diseño stateless + cache desde inicio |
| Vulnerabilidad de seguridad | Baja | Crítico | Security by design + pentesting |
| Cambios de requerimientos | Alta | Medio | MVP incremental, feedback temprano |
| Integración con sistemas legacy | Media | Medio | Adaptadores, API gateway |

### 8.4 Checklist de Entrega

**Funcional:**
- [ ] Todas las APIs documentadas (OpenAPI)
- [ ] Tests unitarios > 80% cobertura
- [ ] Tests de integración pasando
- [ ] Tests E2E pasando
- [ ] No vulnerabilities críticas/alta

**Seguridad:**
- [ ] Pentest externo completado
- [ ] Checklist OWASP ASVS completado
- [ ] Secrets management implementado
- [ ] MFA funcional
- [ ] Audit logging completo

**Operaciones:**
- [ ] Monitoreo configurado
- [ ] Alertas funcionando
- [ ] Runbooks documentados
- [ ] DR probado
- [ ] Backups automatizados

---

*Fin de la Propuesta de Implementación*
