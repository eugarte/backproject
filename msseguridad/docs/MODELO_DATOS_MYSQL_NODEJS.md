# 📊 MODELO DE DATOS MYSQL - MICROSERVICIO DE SEGURIDAD (NODE.JS)

## 📋 ÍNDICE
1. [Diseño del Modelo de Datos](#1-diseño-del-modelo-de-datos)
2. [Tablas Principales](#2-tablas-principales)
3. [Tablas de Autenticación y Sesiones](#3-tablas-de-autenticación-y-sesiones)
4. [Tablas de OAuth2/OIDC](#4-tablas-de-oauth2oidc)
5. [Índices y Optimizaciones](#5-índices-y-optimizaciones)
6. [Migraciones TypeORM](#6-migraciones-typeorm)
7. [Herramientas Compatibles con Node.js](#7-herramientas-compatibles-con-nodejs)

---

## 1. DISEÑO DEL MODELO DE DATOS

### 1.1 Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODELO DE DATOS - msseguridad                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   users     │◄──────┤  user_roles │──────►│     roles       │
│             │       │  (junction) │       │                 │
└──────┬──────┘       └─────────────┘       └────────┬────────┘
       │                                             │
       │                                             │
       │                                       ┌─────┴─────┐
       │                                       │ role_permissions
       │                                       │(junction) │
       │                                       └─────┬─────┘
       │                                             │
       │                                       ┌─────┴─────┐
       │                                       │ permissions│
       │                                       └───────────┘
       │
       │        ┌─────────────────┐        ┌─────────────────┐
       │        │  refresh_tokens │        │   audit_logs    │
       └───────►│                 │        │                 │
                └─────────────────┘        └─────────────────┘
                       │
                       │
                ┌──────┴──────────┐        ┌─────────────────┐
                │  mfa_backup_codes │        │ user_sessions   │
                │                 │        │                 │
                └─────────────────┘        └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         TABLAS OAUTH2/OIDC                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│  oauth_clients  │◄────►│oauth_authorization_  │◄────►│   oauth_codes   │
│                 │      │      codes          │      │                 │
└────────┬────────┘      └─────────────────────┘      └────────┬────────┘
         │                                                    │
         │              ┌─────────────────┐                    │
         │              │  oauth_tokens   │                    │
         └─────────────►│                 │◄───────────────────┘
                        └─────────────────┘
                                │
                                │
                        ┌───────┴─────────┐
                        │oauth_token_       │
                        │scopes (junction)  │
                        └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │  oauth_scopes    │
                        └─────────────────┘
```

### 1.2 Consideraciones de Diseño

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
 **PKs** | UUID (CHAR(36)) | No secuenciales = más seguridad, facilita sharding |
| **Passwords** | Argon2id hashes | Algoritmo recomendado OWASP 2023 |
| **Soft Delete** | `deleted_at` TIMESTAMP | Auditoría, recuperación de datos |
| **Timestamps** | created_at / updated_at | Trazabilidad obligatoria en seguridad |
| **JSON** | Campos JSON para flexibilidad | Claims de JWT, metadata variable |
| **Índices** | Por email, tokens, timestamps | Performance en queries frecuentes |

---

## 2. TABLAS PRINCIPALES

### 2.1 Tabla: `users`

```sql
CREATE TABLE `users` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `is_email_verified` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `email_verified_at` TIMESTAMP NULL,
  
  -- MFA (Multi-Factor Authentication)
  `mfa_enabled` BOOLEAN DEFAULT FALSE,
  `mfa_secret` VARCHAR(255) NULL,           -- Encrypted TOTP secret
  `mfa_type` ENUM('totp', 'email', 'sms') DEFAULT 'totp',
  
  -- Seguridad de cuenta
  `failed_login_attempts` INT DEFAULT 0,
  `locked_until` TIMESTAMP NULL,
  `last_login_at` TIMESTAMP NULL,
  `last_login_ip` VARCHAR(45) NULL,         -- IPv6 compatible
  `password_changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `must_change_password` BOOLEAN DEFAULT FALSE,
  
  -- Metadatos
  `avatar_url` VARCHAR(500) NULL,
  `preferred_language` VARCHAR(5) DEFAULT 'es',
  `timezone` VARCHAR(50) DEFAULT 'America/Mexico_City',
  `metadata` JSON NULL,                     -- Datos adicionales flexibles
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  
  -- Constraints
  CONSTRAINT `uk_users_email` UNIQUE KEY (`email`),
  CONSTRAINT `uk_users_email_active` UNIQUE KEY (`email`, `deleted_at`),
  
  -- Índices
  INDEX `idx_users_active` (`is_active`),
  INDEX `idx_users_email_verified` (`is_email_verified`),
  INDEX `idx_users_locked` (`locked_until`),
  INDEX `idx_users_last_login` (`last_login_at`),
  INDEX `idx_users_created` (`created_at`),
  INDEX `idx_users_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios del sistema de autenticación';
```

### 2.2 Tabla: `roles`

```sql
CREATE TABLE `roles` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,              -- URL-friendly name
  `description` VARCHAR(255) NULL,
  `is_default` BOOLEAN DEFAULT FALSE,       -- Auto-asignar a nuevos usuarios
  `is_system` BOOLEAN DEFAULT FALSE,        -- No eliminable (admin, user)
  `hierarchy_level` INT DEFAULT 0,          -- 0=admin, 1=manager, 2=user...
  
  -- Visualización
  `color` VARCHAR(7) NULL,                  -- Hex color para UI
  `icon` VARCHAR(50) NULL,                  -- Icono/UI
  
  -- Metadatos
  `metadata` JSON NULL,
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  
  -- Constraints
  CONSTRAINT `uk_roles_name` UNIQUE KEY (`name`),
  CONSTRAINT `uk_roles_slug` UNIQUE KEY (`slug`),
  
  -- Solo un rol por defecto
  CONSTRAINT `chk_single_default` CHECK (
    NOT EXISTS (SELECT 1 FROM roles WHERE is_default = TRUE AND id != NEW.id)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Roles para RBAC';

-- Insertar roles base
INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `is_default`, `is_system`, `hierarchy_level`) VALUES
(UUID(), 'Super Administrador', 'superadmin', 'Acceso total al sistema', FALSE, TRUE, 0),
(UUID(), 'Administrador', 'admin', 'Gestión de usuarios y configuración', FALSE, TRUE, 1),
(UUID(), 'Usuario', 'user', 'Usuario estándar del sistema', TRUE, TRUE, 2),
(UUID(), 'Invitado', 'guest', 'Acceso limitado de solo lectura', FALSE, TRUE, 3);
```

### 2.3 Tabla: `permissions`

```sql
CREATE TABLE `permissions` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `resource` VARCHAR(50) NOT NULL,          -- 'users', 'roles', 'audit_logs'
  `action` VARCHAR(50) NOT NULL,          -- 'create', 'read', 'update', 'delete'
  `slug` VARCHAR(100) NOT NULL,             -- 'users:create', 'roles:delete'
  `description` VARCHAR(255) NULL,
  `category` VARCHAR(50) NULL,              -- Agrupar por módulo
  `is_system` BOOLEAN DEFAULT FALSE,      -- No eliminable
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT `uk_permissions_slug` UNIQUE KEY (`slug`),
  CONSTRAINT `uk_permissions_resource_action` UNIQUE KEY (`resource`, `action`),
  
  -- Índices
  INDEX `idx_permissions_resource` (`resource`),
  INDEX `idx_permissions_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permisos granulares para ABAC';

-- Insertar permisos base
INSERT INTO `permissions` (`id`, `resource`, `action`, `slug`, `description`, `category`, `is_system`) VALUES
-- Usuarios
(UUID(), 'users', 'create', 'users:create', 'Crear usuarios', 'user_management', TRUE),
(UUID(), 'users', 'read', 'users:read', 'Ver usuarios', 'user_management', TRUE),
(UUID(), 'users', 'update', 'users:update', 'Editar usuarios', 'user_management', TRUE),
(UUID(), 'users', 'delete', 'users:delete', 'Eliminar usuarios', 'user_management', TRUE),
(UUID(), 'users', 'read_own', 'users:read_own', 'Ver perfil propio', 'user_management', TRUE),
(UUID(), 'users', 'update_own', 'users:update_own', 'Editar perfil propio', 'user_management', TRUE),

-- Roles
(UUID(), 'roles', 'create', 'roles:create', 'Crear roles', 'role_management', TRUE),
(UUID(), 'roles', 'read', 'roles:read', 'Ver roles', 'role_management', TRUE),
(UUID(), 'roles', 'update', 'roles:update', 'Editar roles', 'role_management', TRUE),
(UUID(), 'roles', 'delete', 'roles:delete', 'Eliminar roles', 'role_management', TRUE),

-- Auditoría
(UUID(), 'audit_logs', 'read', 'audit_logs:read', 'Ver logs de auditoría', 'security', TRUE),
(UUID(), 'audit_logs', 'export', 'audit_logs:export', 'Exportar logs', 'security', TRUE),

-- Seguridad
(UUID(), 'security', 'manage_mfa', 'security:manage_mfa', 'Gestionar MFA de otros', 'security', TRUE),
(UUID(), 'security', 'view_sessions', 'security:view_sessions', 'Ver sesiones de otros', 'security', TRUE),
(UUID(), 'security', 'revoke_sessions', 'security:revoke_sessions', 'Revocar sesiones de otros', 'security', TRUE);
```

### 2.4 Tabla: `user_roles` (Junction)

```sql
CREATE TABLE `user_roles` (
  `user_id` CHAR(36) NOT NULL,
  `role_id` CHAR(36) NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` CHAR(36) NULL,              -- Quién asignó el rol
  `expires_at` TIMESTAMP NULL,              -- Rol temporal (opcional)
  
  PRIMARY KEY (`user_id`, `role_id`),
  
  -- FK Constraints
  CONSTRAINT `fk_user_roles_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_role` 
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Índices
  INDEX `idx_user_roles_role` (`role_id`),
  INDEX `idx_user_roles_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relación muchos-a-muchos usuarios-roles';
```

### 2.5 Tabla: `role_permissions` (Junction)

```sql
CREATE TABLE `role_permissions` (
  `role_id` CHAR(36) NOT NULL,
  `permission_id` CHAR(36) NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `conditions` JSON NULL,                   -- Condiciones ABAC (opcional)
                                            -- {"department": "IT", "max_amount": 1000}
  
  PRIMARY KEY (`role_id`, `permission_id`),
  
  -- FK Constraints
  CONSTRAINT `fk_role_permissions_role` 
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` 
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Índices
  INDEX `idx_role_permissions_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relación muchos-a-muchos roles-permisos';

-- Asignar permisos a roles base
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.slug = 'superadmin';

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.slug = 'admin' 
AND p.slug IN ('users:read', 'users:update', 'users:read_own', 'users:update_own', 
               'roles:read', 'audit_logs:read', 'security:view_sessions');

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.slug = 'user' 
AND p.slug IN ('users:read_own', 'users:update_own');
```

---

## 3. TABLAS DE AUTENTICACIÓN Y SESIONES

### 3.1 Tabla: `refresh_tokens`

```sql
CREATE TABLE `refresh_tokens` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `token_hash` CHAR(64) NOT NULL,           -- SHA-256 del token (nunca guardar raw)
  `user_id` CHAR(36) NOT NULL,
  `family_id` CHAR(36) NULL,                -- Grupo de tokens relacionados (rotación)
  `replaced_by_token_id` CHAR(36) NULL,   -- Token que lo reemplazó
  
  -- Metadata del token
  `expires_at` TIMESTAMP NOT NULL,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `revoked_at` TIMESTAMP NULL,
  `revoke_reason` ENUM('logout', 'compromised', 'expired', 'rotation', 'user_disabled') NULL,
  
  -- Contexto de emisión
  `issued_ip` VARCHAR(45) NOT NULL,
  `user_agent_hash` CHAR(64) NULL,          -- Hash del user agent
  `device_fingerprint` VARCHAR(255) NULL, -- Identificador de dispositivo
  `metadata` JSON NULL,                   -- Info del dispositivo: OS, browser, etc.
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- FK Constraints
  CONSTRAINT `fk_refresh_tokens_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_refresh_tokens_replaced` 
    FOREIGN KEY (`replaced_by_token_id`) REFERENCES `refresh_tokens`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT `uk_refresh_tokens_hash` UNIQUE KEY (`token_hash`),
  
  -- Índices
  INDEX `idx_refresh_tokens_user` (`user_id`),
  INDEX `idx_refresh_tokens_family` (`family_id`),
  INDEX `idx_refresh_tokens_expires` (`expires_at`),
  INDEX `idx_refresh_tokens_revoked` (`is_revoked`),
  INDEX `idx_refresh_tokens_created` (`created_at`),
  
  -- Para limpieza de tokens expirados
  INDEX `idx_refresh_tokens_cleanup` (`is_revoked`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens de refresco con rotación (family pattern)';
```

### 3.2 Tabla: `user_sessions`

```sql
CREATE TABLE `user_sessions` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `session_token_hash` CHAR(64) NOT NULL,   -- Hash del session cookie/token
  
  -- Estado
  `is_active` BOOLEAN DEFAULT TRUE,
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `ended_at` TIMESTAMP NULL,
  `end_reason` ENUM('logout', 'timeout', 'kicked', 'password_change', 'security_alert') NULL,
  
  -- Contexto
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NULL,
  `user_agent_hash` CHAR(64) NULL,
  `device_fingerprint` VARCHAR(255) NULL,
  `location_country` VARCHAR(2) NULL,       -- ISO code
  `location_city` VARCHAR(100) NULL,
  `location_lat` DECIMAL(10, 8) NULL,       -- Geolocalización aproximada
  `location_lon` DECIMAL(11, 8) NULL,
  
  -- Metadata
  `metadata` JSON NULL,
  
  -- FK Constraints
  CONSTRAINT `fk_user_sessions_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Índices
  INDEX `idx_user_sessions_user` (`user_id`),
  INDEX `idx_user_sessions_active` (`user_id`, `is_active`),
  INDEX `idx_user_sessions_expires` (`expires_at`),
  INDEX `idx_user_sessions_token` (`session_token_hash`),
  INDEX `idx_user_sessions_fingerprint` (`device_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sesiones activas de usuarios';
```

### 3.3 Tabla: `mfa_backup_codes`

```sql
CREATE TABLE `mfa_backup_codes` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `code_hash` CHAR(64) NOT NULL,            -- SHA-256 del código (nunca guardar raw)
  `used_at` TIMESTAMP NULL,
  `used_ip` VARCHAR(45) NULL,
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- FK Constraints
  CONSTRAINT `fk_mfa_backup_codes_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT `uk_mfa_backup_codes_hash` UNIQUE KEY (`code_hash`),
  
  -- Índices
  INDEX `idx_mfa_backup_codes_user` (`user_id`),
  INDEX `idx_mfa_backup_codes_unused` (`user_id`, `used_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Códigos de recuperación MFA (10 por usuario)';
```

---

## 4. TABLAS DE OAUTH2/OIDC

### 4.1 Tabla: `oauth_clients`

```sql
CREATE TABLE `oauth_clients` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `client_id` VARCHAR(100) NOT NULL,
  `client_secret_hash` VARCHAR(255) NULL,   -- NULL para public clients (SPAs)
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  
  -- Tipo de cliente
  `client_type` ENUM('confidential', 'public') NOT NULL DEFAULT 'confidential',
  
  -- URIs
  `redirect_uris` JSON NOT NULL,            -- Array de URIs permitidos
  `allowed_origins` JSON NULL,              -- CORS origins
  
  -- Configuración de flujos OAuth2
  `grant_types` JSON NOT NULL,              -- ["authorization_code", "refresh_token"]
  `response_types` JSON NOT NULL,           -- ["code"]
  `scopes` JSON NOT NULL,                   -- Scopes por defecto permitidos
  
  -- Seguridad
  `require_pkce` BOOLEAN DEFAULT TRUE,    -- Obligatorio para public clients
  `require_consent` BOOLEAN DEFAULT TRUE,   -- Mostrar pantalla de consentimiento
  `token_endpoint_auth_method` ENUM('client_secret_basic', 'client_secret_post', 'none') DEFAULT 'client_secret_basic',
  
  -- Tokens
  `access_token_ttl` INT DEFAULT 900,       -- Segundos (15 min)
  `refresh_token_ttl` INT DEFAULT 604800,   -- Segundos (7 días)
  `id_token_ttl` INT DEFAULT 3600,          -- Segundos (1 hora)
  
  -- Estado
  `is_active` BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  `logo_url` VARCHAR(500) NULL,
  `tos_url` VARCHAR(500) NULL,
  `privacy_policy_url` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` CHAR(36) NULL,
  
  -- Constraints
  CONSTRAINT `uk_oauth_clients_client_id` UNIQUE KEY (`client_id`),
  
  -- Índices
  INDEX `idx_oauth_clients_active` (`is_active`),
  INDEX `idx_oauth_clients_type` (`client_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aplicaciones cliente OAuth2/OIDC';

-- Insertar clientes de ejemplo
INSERT INTO `oauth_clients` (`id`, `client_id`, `name`, `description`, `client_type`, `redirect_uris`, `grant_types`, `response_types`, `scopes`, `require_pkce`, `token_endpoint_auth_method`) VALUES
(UUID(), 'web-app-prod', 'Aplicación Web Producción', 'Cliente principal SPA', 'public', 
 '["https://app.midominio.com/callback"]', '["authorization_code", "refresh_token"]', '["code"]', 
 '["openid", "profile", "email"]', TRUE, 'none'),
 
(UUID(), 'mobile-app', 'Aplicación Móvil', 'Cliente iOS/Android', 'public',
 '["com.midominio.app://callback"]', '["authorization_code", "refresh_token"]', '["code"]',
 '["openid", "profile", "email", "offline_access"]', TRUE, 'none'),
 
(UUID(), 'backend-service', 'Servicio Backend', 'Comunicación server-to-server', 'confidential',
 '["https://api.midominio.com/oauth/callback"]', '["client_credentials"]', '["token"]',
 '["api:read", "api:write"]', FALSE, 'client_secret_basic');
```

### 4.2 Tabla: `oauth_authorization_codes`

```sql
CREATE TABLE `oauth_authorization_codes` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `code_hash` CHAR(64) NOT NULL,            -- SHA-256 del code
  `client_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  
  -- PKCE
  `code_challenge` VARCHAR(255) NULL,
  `code_challenge_method` ENUM('S256', 'plain') DEFAULT 'S256',
  
  -- Scopes solicitados
  `requested_scopes` JSON NOT NULL,
  `granted_scopes` JSON NULL,               -- Scopes aprobados por usuario
  
  -- Estado
  `is_used` BOOLEAN DEFAULT FALSE,
  `used_at` TIMESTAMP NULL,
  `redirect_uri` VARCHAR(500) NOT NULL,
  `state` VARCHAR(255) NULL,                -- State parameter para CSRF
  
  -- Expiración corta (10 minutos max)
  `expires_at` TIMESTAMP NOT NULL,
  
  -- Contexto
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NULL,
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- FK Constraints
  CONSTRAINT `fk_oauth_codes_client` 
    FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_oauth_codes_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT `uk_oauth_codes_hash` UNIQUE KEY (`code_hash`),
  
  -- Índices
  INDEX `idx_oauth_codes_client` (`client_id`),
  INDEX `idx_oauth_codes_user` (`user_id`),
  INDEX `idx_oauth_codes_expires` (`expires_at`),
  INDEX `idx_oauth_codes_unused` (`is_used`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Authorization codes OAuth2 (flujo Authorization Code)';
```

### 4.3 Tabla: `oauth_tokens`

```sql
CREATE TABLE `oauth_tokens` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `token_type` ENUM('access_token', 'refresh_token') NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,                  -- NULL para client_credentials
  
  -- Metadata del token
  `jti` VARCHAR(100) NULL,                  -- JWT ID para revocación
  `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `revoked_at` TIMESTAMP NULL,
  `revoke_reason` VARCHAR(50) NULL,
  
  -- Scopes
  `scopes` JSON NOT NULL,
  
  -- Relaciones
  `authorization_code_id` CHAR(36) NULL,
  `parent_token_id` CHAR(36) NULL,          -- Para refresh token rotation
  
  -- Contexto
  `ip_address` VARCHAR(45) NULL,
  `user_agent_hash` CHAR(64) NULL,
  `device_fingerprint` VARCHAR(255) NULL,
  
  -- FK Constraints
  CONSTRAINT `fk_oauth_tokens_client` 
    FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_oauth_tokens_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_oauth_tokens_code` 
    FOREIGN KEY (`authorization_code_id`) REFERENCES `oauth_authorization_codes`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_oauth_tokens_parent` 
    FOREIGN KEY (`parent_token_id`) REFERENCES `oauth_tokens`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT `uk_oauth_tokens_hash` UNIQUE KEY (`token_hash`),
  
  -- Índices
  INDEX `idx_oauth_tokens_client` (`client_id`),
  INDEX `idx_oauth_tokens_user` (`user_id`),
  INDEX `idx_oauth_tokens_jti` (`jti`),
  INDEX `idx_oauth_tokens_expires` (`expires_at`),
  INDEX `idx_oauth_tokens_cleanup` (`is_revoked`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens OAuth2 emitidos (access y refresh)';
```

### 4.4 Tabla: `oauth_scopes`

```sql
CREATE TABLE `oauth_scopes` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `scope` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_default` BOOLEAN DEFAULT FALSE,       -- Incluir por defecto
  `is_internal` BOOLEAN DEFAULT FALSE,      -- No mostrar en consentimiento
  `requires_consent` BOOLEAN DEFAULT TRUE,
  
  -- OIDC claims asociados
  `oidc_claims` JSON NULL,                  -- ["sub", "email", "profile"]
  
  -- Auditoría
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT `uk_oauth_scopes_scope` UNIQUE KEY (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Scopes OAuth2/OIDC disponibles';

-- Insertar scopes estándar
INSERT INTO `oauth_scopes` (`id`, `scope`, `description`, `is_default`, `is_internal`, `oidc_claims`) VALUES
(UUID(), 'openid', 'OpenID Connect authentication', TRUE, FALSE, '["sub", "iss", "aud", "iat", "exp", "jti"]'),
(UUID(), 'profile', 'Access to profile information', FALSE, FALSE, '["name", "family_name", "given_name", "middle_name", "nickname", "preferred_username", "profile", "picture", "website", "gender", "birthdate", "zoneinfo", "locale", "updated_at"]'),
(UUID(), 'email', 'Access to email address', FALSE, FALSE, '["email", "email_verified"]'),
(UUID(), 'phone', 'Access to phone number', FALSE, FALSE, '["phone_number", "phone_number_verified"]'),
(UUID(), 'address', 'Access to address', FALSE, FALSE, '["address"]'),
(UUID(), 'offline_access', 'Issue refresh token', FALSE, TRUE, '[]'),
(UUID(), 'api:read', 'Read access to API', FALSE, FALSE, '[]'),
(UUID(), 'api:write', 'Write access to API', FALSE, FALSE, '[]'),
(UUID(), 'admin', 'Administrative access', FALSE, FALSE, '[]');
```

---

## 5. ÍNDICES Y OPTIMIZACIONES

### 5.1 Resumen de Índices por Tabla

```sql
-- Índices compuestos para queries comunes

-- Búsqueda de usuarios por email (login)
CREATE INDEX `idx_users_email_lookup` ON `users` (`email`, `is_active`, `deleted_at`);

-- Sesiones activas por usuario
CREATE INDEX `idx_sessions_active_lookup` ON `user_sessions` (`user_id`, `is_active`, `expires_at`);

-- Tokens de refresh válidos
CREATE INDEX `idx_refresh_valid` ON `refresh_tokens` (`token_hash`, `is_revoked`, `expires_at`);

-- Authorization codes pendientes
CREATE INDEX `idx_codes_pending` ON `oauth_authorization_codes` (`code_hash`, `is_used`, `expires_at`);

-- Eventos de auditoría por usuario y tiempo
CREATE INDEX `idx_audit_user_time` ON `audit_logs` (`user_id`, `created_at`);
```

### 5.2 Vistas Útiles

```sql
-- Vista: Usuarios con roles
CREATE VIEW `v_user_roles_expanded` AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_active,
  r.id as role_id,
  r.name as role_name,
  r.slug as role_slug,
  GROUP_CONCAT(p.slug) as permissions
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, r.id;

-- Vista: Sesiones activas con info de usuario
CREATE VIEW `v_active_sessions` AS
SELECT 
  s.id as session_id,
  s.user_id,
  u.email,
  s.ip_address,
  s.started_at,
  s.last_activity_at,
  s.expires_at,
  TIMESTAMPDIFF(MINUTE, s.last_activity_at, NOW()) as idle_minutes
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE 
AND s.expires_at > NOW();
```

### 5.3 Procedimientos de Mantenimiento

```sql
-- Limpiar tokens expirados (ejecutar diariamente)
DELIMITER $$
CREATE PROCEDURE `cleanup_expired_tokens`()
BEGIN
  DELETE FROM refresh_tokens 
  WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
  
  DELETE FROM oauth_tokens 
  WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
  
  DELETE FROM oauth_authorization_codes 
  WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
END$$
DELIMITER ;

-- Revocar todas las sesiones de un usuario
DELIMITER $$
CREATE PROCEDURE `revoke_user_sessions`(IN p_user_id CHAR(36))
BEGIN
  UPDATE user_sessions 
  SET is_active = FALSE, 
      ended_at = NOW(), 
      end_reason = 'kicked'
  WHERE user_id = p_user_id 
  AND is_active = TRUE;
  
  UPDATE refresh_tokens 
  SET is_revoked = TRUE, 
      revoked_at = NOW(), 
      revoke_reason = 'user_disabled'
  WHERE user_id = p_user_id 
  AND is_revoked = FALSE;
END$$
DELIMITER ;
```

---

## 6. MIGRACIONES TYPEORM

### 6.1 Configuración de TypeORM

```typescript
// src/config/database.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'msseguridad',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'msseguridad',
  
  // Entidades
  entities: ['src/infrastructure/database/typeorm/entities/**/*.ts'],
  migrations: ['src/infrastructure/database/typeorm/migrations/**/*.ts'],
  
  // Opciones
  synchronize: false, // SIEMPRE false en producción, usar migraciones
  logging: process.env.NODE_ENV === 'development',
  
  // Pool de conexiones
  extra: {
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
  },
  
  // SSL en producción
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA,
  } : false,
});
```

### 6.2 Entidad User (TypeORM)

```typescript
// src/infrastructure/database/typeorm/entities/User.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, 
  UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToMany, 
  JoinTable, BeforeInsert, Index
} from 'typeorm';
import { Role } from './Role';
import { RefreshToken } from './RefreshToken';
import { AuditLog } from './AuditLog';
import { UserSession } from './UserSession';
import { MfaBackupCode } from './MfaBackupCode';

@Entity('users')
@Index(['email', 'deleted_at'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null;

  // MFA
  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', type: 'varchar', length: 255, nullable: true })
  mfaSecret: string | null;

  @Column({ name: 'mfa_type', type: 'enum', enum: ['totp', 'email', 'sms'], default: 'totp' })
  mfaType: 'totp' | 'email' | 'sms';

  // Seguridad de cuenta
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string | null;

  @Column({ name: 'password_changed_at', type: 'timestamp' })
  passwordChangedAt: Date;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword: boolean;

  // Metadatos
  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'preferred_language', type: 'varchar', length: 5, default: 'es' })
  preferredLanguage: string;

  @Column({ type: 'varchar', length: 50, default: 'America/Mexico_City' })
  timezone: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  // Auditoría
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'char', length: 36, nullable: true })
  updatedBy: string | null;

  // Relaciones
  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => AuditLog, log => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => UserSession, session => session.user)
  sessions: UserSession[];

  @OneToMany(() => MfaBackupCode, code => code.user)
  mfaBackupCodes: MfaBackupCode[];

  // Métodos
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  hasPermission(permissionSlug: string): boolean {
    return this.roles.some(role => 
      role.permissions.some(p => p.slug === permissionSlug)
    );
  }
}
```

### 6.3 Entidad RefreshToken (TypeORM)

```typescript
// src/infrastructure/database/typeorm/entities/RefreshToken.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, 
  ManyToOne, JoinColumn, OneToOne, Index
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
@Index(['isRevoked', 'expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @Column({ name: 'family_id', type: 'char', length: 36, nullable: true })
  familyId: string | null;

  @Column({ name: 'replaced_by_token_id', type: 'char', length: 36, nullable: true })
  replacedByTokenId: string | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoke_reason', type: 'enum', 
    enum: ['logout', 'compromised', 'expired', 'rotation', 'user_disabled'], 
    nullable: true })
  revokeReason: 'logout' | 'compromised' | 'expired' | 'rotation' | 'user_disabled' | null;

  @Column({ name: 'issued_ip', type: 'varchar', length: 45 })
  issuedIp: string;

  @Column({ name: 'user_agent_hash', type: 'char', length: 64, nullable: true })
  userAgentHash: string | null;

  @Column({ name: 'device_fingerprint', type: 'varchar', length: 255, nullable: true })
  deviceFingerprint: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => User, user => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => RefreshToken)
  @JoinColumn({ name: 'replaced_by_token_id' })
  replacedByToken: RefreshToken | null;

  // Métodos
  isValid(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }
}
```

### 6.4 Migración Inicial

```typescript
// src/infrastructure/database/typeorm/migrations/1704067200000-InitialMigration.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1704067200000 implements MigrationInterface {
  name = 'InitialMigration1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tablas en orden de dependencias
    
    // 1. users (no dependencias)
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` char(36) NOT NULL DEFAULT (UUID()),
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`first_name\` varchar(100) NOT NULL,
        \`last_name\` varchar(100) NOT NULL,
        \`is_email_verified\` tinyint NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`email_verified_at\` timestamp NULL,
        \`mfa_enabled\` tinyint NOT NULL DEFAULT 0,
        \`mfa_secret\` varchar(255) NULL,
        \`mfa_type\` enum('totp','email','sms') NOT NULL DEFAULT 'totp',
        \`failed_login_attempts\` int NOT NULL DEFAULT 0,
        \`locked_until\` timestamp NULL,
        \`last_login_at\` timestamp NULL,
        \`last_login_ip\` varchar(45) NULL,
        \`password_changed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`must_change_password\` tinyint NOT NULL DEFAULT 0,
        \`avatar_url\` varchar(500) NULL,
        \`preferred_language\` varchar(5) NOT NULL DEFAULT 'es',
        \`timezone\` varchar(50) NOT NULL DEFAULT 'America/Mexico_City',
        \`metadata\` json NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        \`created_by\` char(36) NULL,
        \`updated_by\` char(36) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_users_email\` (\`email\`),
        KEY \`idx_users_active\` (\`is_active\`),
        KEY \`idx_users_locked\` (\`locked_until\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. roles
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` char(36) NOT NULL DEFAULT (UUID()),
        \`name\` varchar(50) NOT NULL,
        \`slug\` varchar(50) NOT NULL,
        \`description\` varchar(255) NULL,
        \`is_default\` tinyint NOT NULL DEFAULT 0,
        \`is_system\` tinyint NOT NULL DEFAULT 0,
        \`hierarchy_level\` int NOT NULL DEFAULT 0,
        \`color\` varchar(7) NULL,
        \`icon\` varchar(50) NULL,
        \`metadata\` json NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_roles_name\` (\`name\`),
        UNIQUE KEY \`uk_roles_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. permissions
    await queryRunner.query(`
      CREATE TABLE \`permissions\` (
        \`id\` char(36) NOT NULL DEFAULT (UUID()),
        \`resource\` varchar(50) NOT NULL,
        \`action\` varchar(50) NOT NULL,
        \`slug\` varchar(100) NOT NULL,
        \`description\` varchar(255) NULL,
        \`category\` varchar(50) NULL,
        \`is_system\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_permissions_slug\` (\`slug\`),
        UNIQUE KEY \`uk_permissions_resource_action\` (\`resource\`, \`action\`),
        KEY \`idx_permissions_resource\` (\`resource\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. user_roles
    await queryRunner.query(`
      CREATE TABLE \`user_roles\` (
        \`user_id\` char(36) NOT NULL,
        \`role_id\` char(36) NOT NULL,
        \`assigned_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`assigned_by\` char(36) NULL,
        \`expires_at\` timestamp NULL,
        PRIMARY KEY (\`user_id\`, \`role_id\`),
        KEY \`idx_user_roles_role\` (\`role_id\`),
        CONSTRAINT \`fk_user_roles_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_user_roles_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. role_permissions
    await queryRunner.query(`
      CREATE TABLE \`role_permissions\` (
        \`role_id\` char(36) NOT NULL,
        \`permission_id\` char(36) NOT NULL,
        \`assigned_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`conditions\` json NULL,
        PRIMARY KEY (\`role_id\`, \`permission_id\`),
        KEY \`idx_role_permissions_permission\` (\`permission_id\`),
        CONSTRAINT \`fk_role_permissions_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_role_permissions_permission\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. refresh_tokens
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` char(36) NOT NULL DEFAULT (UUID()),
        \`token_hash\` char(64) NOT NULL,
        \`user_id\` char(36) NOT NULL,
        \`family_id\` char(36) NULL,
        \`replaced_by_token_id\` char(36) NULL,
        \`expires_at\` timestamp NOT NULL,
        \`is_revoked\` tinyint NOT NULL DEFAULT 0,
        \`revoked_at\` timestamp NULL,
        \`revoke_reason\` enum('logout','compromised','expired','rotation','user_disabled') NULL,
        \`issued_ip\` varchar(45) NOT NULL,
        \`user_agent_hash\` char(64) NULL,
        \`device_fingerprint\` varchar(255) NULL,
        \`metadata\` json NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_refresh_tokens_hash\` (\`token_hash\`),
        KEY \`idx_refresh_tokens_user\` (\`user_id\`),
        KEY \`idx_refresh_tokens_expires\` (\`expires_at\`),
        CONSTRAINT \`fk_refresh_tokens_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ... continuar con las demás tablas
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables en orden inverso
    await queryRunner.query(`DROP TABLE IF EXISTS \`refresh_tokens\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`role_permissions\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_roles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`permissions\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`roles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
```

### 6.5 Script de Inicialización

```typescript
// src/scripts/init-database.ts
import { AppDataSource } from '../config/database';
import { User } from '../infrastructure/database/typeorm/entities/User';
import { Role } from '../infrastructure/database/typeorm/entities/Role';
import { Permission } from '../infrastructure/database/typeorm/entities/Permission';

async function initializeDatabase() {
  await AppDataSource.initialize();
  
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Crear permisos base
  const permissions = [
    { resource: 'users', action: 'create', slug: 'users:create', description: 'Crear usuarios', category: 'user_management', isSystem: true },
    { resource: 'users', action: 'read', slug: 'users:read', description: 'Ver usuarios', category: 'user_management', isSystem: true },
    { resource: 'users', action: 'update', slug: 'users:update', description: 'Editar usuarios', category: 'user_management', isSystem: true },
    { resource: 'users', action: 'delete', slug: 'users:delete', description: 'Eliminar usuarios', category: 'user_management', isSystem: true },
    { resource: 'audit_logs', action: 'read', slug: 'audit_logs:read', description: 'Ver logs', category: 'security', isSystem: true },
  ];

  for (const permData of permissions) {
    const exists = await permissionRepo.findOne({ where: { slug: permData.slug } });
    if (!exists) {
      const perm = permissionRepo.create(permData);
      await permissionRepo.save(perm);
    }
  }

  // 2. Crear roles base
  const roles = [
    { name: 'Super Administrador', slug: 'superadmin', description: 'Acceso total', isSystem: true, hierarchyLevel: 0 },
    { name: 'Administrador', slug: 'admin', description: 'Gestión de usuarios', isSystem: true, hierarchyLevel: 1 },
    { name: 'Usuario', slug: 'user', description: 'Usuario estándar', isDefault: true, isSystem: true, hierarchyLevel: 2 },
  ];

  for (const roleData of roles) {
    const exists = await roleRepo.findOne({ where: { slug: roleData.slug } });
    if (!exists) {
      const role = roleRepo.create(roleData);
      
      // Asignar todos los permisos al superadmin
      if (roleData.slug === 'superadmin') {
        role.permissions = await permissionRepo.find();
      }
      
      await roleRepo.save(role);
    }
  }

  console.log('✅ Base de datos inicializada correctamente');
  await AppDataSource.destroy();
}

initializeDatabase().catch(console.error);
```

---

## 7. HERRAMIENTAS COMPATIBLES CON NODE.JS

### 7.1 Tabla Comparativa: Seguridad para Node.js

| Herramienta | Tipo | ✅/❌ Node.js | Integración | Uso Principal |
|-------------|------|--------------|-------------|---------------|
| **SonarQube** | SAST | ✅ Nativo | SonarJS plugin | Calidad de código y seguridad |
| **Snyk** | SCA/SAST | ✅ Excelente | `snyk test` en CI | Dependencias vulnerables |
| **npm audit** | SCA | ✅ Nativo | `npm audit` built-in | Auditoría rápida de deps |
| **Semgrep** | SAST | ✅ Nativo | `semgrep --config=p/nodejs` | Reglas personalizadas Node |
| **Trivy** | SCA/Container | ✅ Agnóstico | Escanea `package.json` | Contenedores + Deps |
| **OWASP ZAP** | DAST | ✅ Agnóstico | Proxy hacia Node app | Testing dinámico |
| **Grype** | SCA/Container | ✅ Agnóstico | Anchore | Alternativa a Trivy |
| **Snyk Code** | SAST | ✅ Nativo | GitHub integration | Análisis estático JS/TS |
| **CodeQL** | SAST | ✅ Nativo | GitHub Actions | Análisis semántico GitHub |
| **Node Security Platform** | SCA | ✅ Nativo | NSP (ahora Snyk) | Histórico |
| **Jest + Security Tests** | Testing | ✅ Nativo | Custom tests | Pruebas de seguridad unitarias |
| **eslint-plugin-security** | Linting | ✅ Nativo | ESLint | Detecta patrones inseguros |

### 7.2 Stack Recomendado para Node.js

```yaml
# .github/workflows/nodejs-security.yml
name: Node.js Security Pipeline

on: [push, pull_request]

jobs:
  security-scans:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # 1. Setup Node.js
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      # 2. npm audit (SCA Nativo)
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: false
      
      # 3. ESLint Security Plugin (SAST)
      - name: Run ESLint Security
        run: |
          npm install -D eslint-plugin-security
          npx eslint . --ext .js,.ts
      
      # 4. Snyk Test (SCA + SAST)
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      # 5. Semgrep (SAST)
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/cwe-top-25
            p/nodejs
            p/typescript
      
      # 6. Trivy Filesystem (SCA)
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      # 7. SonarQube (SAST + Quality)
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
      
      # 8. Build Docker Image
      - name: Build Docker Image
        run: docker build -t test-image:latest .
      
      # 9. Trivy Container Scan
      - name: Scan Container
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'test-image:latest'
          format: 'table'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
      
      # 10. OWASP ZAP Baseline Scan (DAST)
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

### 7.3 Configuración ESLint Security

```javascript
// .eslintrc.security.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended-legacy',  // o 'plugin:security/recommended' para v3
    'plugin:node/recommended'
  ],
  plugins: ['security', 'node'],
  rules: {
    // Security
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Node.js specific
    'node/no-deprecated-api': 'error',
    'node/no-unpublished-require': 'error',
    
    // General
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'security/detect-non-literal-fs-filename': 'off'
      }
    }
  ]
};
```

### 7.4 Reglas Semgrep para Node.js

```yaml
# .semgrep/node-security.yml
rules:
  # Detectar eval() en Node.js
  - id: node-dangerous-eval
    pattern: eval(...)
    languages: [javascript, typescript]
    message: "Uso peligroso de eval() - potencial RCE"
    severity: ERROR
    metadata:
      cwe: "CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code ('Eval Injection')"
      owasp: "A03:2021 - Injection"

  # Detectar exec() sin sanitización
  - id: node-exec-injection
    pattern-either:
      - pattern: child_process.exec($X)
      - pattern: child_process.execSync($X)
      - pattern: require("child_process").exec($X)
    pattern-not-inside: |
      $X = "..."
      ...
      child_process.exec($X)
    languages: [javascript, typescript]
    message: "Posible Command Injection - sanitizar input"
    severity: ERROR

  # Detectar jwt.verify sin algoritmo explícito
  - id: node-jwt-none-algorithm
    pattern: |
      jwt.verify($TOKEN, $SECRET)
    pattern-not: |
      jwt.verify($TOKEN, $SECRET, { algorithms: [...] })
    languages: [javascript, typescript]
    message: "jwt.verify sin algoritmo explícito - vulnerable a 'none' algorithm attack"
    severity: ERROR

  # Detectar cookies sin secure flag
  - id: node-insecure-cookie
    pattern: |
      res.cookie(..., { ..., secure: false, ... })
    languages: [javascript, typescript]
    message: "Cookie sin flag secure - vulnerable a MITM"
    severity: WARNING

  # Detectar SQL injection en queries MySQL
  - id: node-sql-injection-mysql
    pattern-either:
      - pattern: |
          connection.query($X + ...)
      - pattern: |
          connection.query(`...${...}...`)
    pattern-not: |
      connection.query("...", [])
    languages: [javascript, typescript]
    message: "Posible SQL Injection - usar parameterized queries"
    severity: ERROR

  # Detectar hardcoded secrets
  - id: node-hardcoded-secret
    pattern-regex: (?:password|passwd|pwd|secret|key|token)\s*[=:]\s*["'][^"']+["']
    languages: [javascript, typescript]
    message: "Posible secreto hardcodeado"
    severity: WARNING
```

### 7.5 Scripts de Seguridad en package.json

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js",
    "lint:security": "eslint . --ext .ts,.js --config .eslintrc.security.js",
    "test": "jest",
    "test:security": "jest --testPathPattern=security",
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "snyk:test": "snyk test",
    "snyk:monitor": "snyk monitor",
    "semgrep:local": "semgrep --config=p/nodejs --config=p/typescript --config=p/security-audit src/",
    "trivy:fs": "trivy filesystem --scanners vuln,secret,misconfig .",
    "security:all": "npm run lint:security && npm run audit && npm run snyk:test && npm run semgrep:local"
  }
}
```

### 7.6 Configuración SonarQube para Node.js

```properties
# sonar-project.properties
sonar.projectKey=msseguridad
sonar.projectName=Microservicio de Seguridad Node.js
sonar.projectVersion=1.0

# Source
sonar.sources=src
sonar.tests=tests
sonar.inclusions=**/*.ts,**/*.js
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts,**/*.spec.ts

# TypeScript/JavaScript
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=coverage/test-report.xml

# Security
sonar.security.hotspots.level=high
sonar.security.hotspots.review.all=true

# Node.js specific rules
sonar.javascript.file.suffixes=.js,.jsx
sonar.typescript.file.suffixes=.ts,.tsx

# Quality Gate
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

### 7.7 Docker Compose Completo con Monitoreo

```yaml
# docker-compose.security-stack.yml
version: '3.8'

services:
  # Aplicación Node.js
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=msseguridad
      - DB_PASSWORD=securepassword
      - DB_NAME=msseguridad
      - REDIS_HOST=redis
      - SONAR_HOST_URL=http://sonarqube:9000
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

  # MySQL 8.0
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: msseguridad
      MYSQL_USER: msseguridad
      MYSQL_PASSWORD: securepassword
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 5s
      retries: 10

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 5s
      retries: 10

  # SonarQube Community
  sonarqube:
    image: sonarqube:community
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    ports:
      - "9000:9000"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions

  # PostgreSQL para SonarQube
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Trivy Server (opcional, para escaneos continuos)
  trivy-server:
    image: aquasec/trivy:latest
    command: server --listen 0.0.0.0:8080
    ports:
      - "8080:8080"
    volumes:
      - trivy_cache:/root/.cache/trivy

  # Prometheus (métricas)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  # Grafana (dashboards)
  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"

volumes:
  mysql_data:
  redis_data:
  sonarqube_data:
  sonarqube_extensions:
  postgres_data:
  trivy_cache:
  prometheus_data:
  grafana_data:
```

---

## 📚 REFERENCIAS

### MySQL Security
- [MySQL 8.0 Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security.html)
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)

### Node.js Security
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP NodeGoat Project](https://owasp.org/www-project-nodegoat/)
- [Snyk Node.js Security](https://snyk.io/learn/nodejs-security/)

### OAuth2/OIDC
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### TypeORM
- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM MySQL Connection](https://typeorm.io/data-source-options#mysql--mariadb-connection-options)

---

*Documento generado para msseguridad - Modelo de datos MySQL + Herramientas Node.js*
