# 📋 DOCUMENTO DE REQUERIMIENTOS - Hostinger Managed Node.js
## Microservicio de Gestión de Clientes - msclientes

---

**Versión:** 2.1 - Managed Node.js Edition  
**Fecha:** Abril 2026  
**Proyecto:** msclientes  
**Tipo:** Elicitación de Requerimientos  
**Dependencia:** msseguridad (autenticación/autorización)  
**Hosting Target:** Hostinger Business Plan (Managed Node.js + MariaDB)

---

## 🎯 Cambios para Managed Node.js

### Stack Original vs Hostinger Managed

| Componente | Stack Original | Stack Managed | Motivo |
|------------|---------------|---------------|--------|
| **Base de datos** | PostgreSQL 15 | **MariaDB 10.6+** | Hostinger nativo |
| **Caché** | Redis 7 | **lru-cache (memoria)** | No Redis en managed |
| **Búsqueda** | Elasticsearch 8 | **MySQL FULLTEXT** | No ES en managed |
| **Mensajería** | RabbitMQ 3 | **EventEmitter2** | Proceso local |
| **Colas** | BullMQ 4 | **Node-cron + interval** | Sin Redis |
| **Process Manager** | PM2 | **Hostinger Managed** | Ellos lo manejan |
| **Deploy** | SSH + Git | **Panel/Git/ZIP** | Sin acceso SSH |

---

## 1. INTRODUCCIÓN

### 1.1 Propósito
El microservicio msclientes gestionará información de clientes B2B/B2C en Hostinger Managed Node.js con stack 100% Node.js nativo, aprovechando la infraestructura gestionada de Hostinger.

### 1.2 Alcance
- Gestión completa del ciclo de vida del cliente
- Master Data Management (MDM) con MariaDB
- Búsqueda full-text con MySQL FULLTEXT indexes
- Comunicación inter-servicios vía HTTP REST
- Cumplimiento GDPR/CCPA
- **Sin gestión de servidores** (Hostinger lo maneja)

---

## 2. REQUERIMIENTOS FUNCIONALES

*(Mantener los mismos RF del documento original)*

### 2.1 RF-001 a RF-027: Sin cambios funcionales

La funcionalidad permanece idéntica. Solo cambia la implementación técnica:

| RF | Implementación Original | Implementación Managed |
|----|------------------------|----------------------|
| RF-020 Búsqueda Avanzada | Elasticsearch | **MySQL FULLTEXT** |
| RF-022 Validación Externa | RabbitMQ async | **HTTP sync / EventEmitter** |
| RF-017 Segmentación | Redis cache | **lru-cache en memoria** |

---

## 3. REQUERIMIENTOS NO FUNCIONALES - Managed Node.js

### 3.1 Rendimiento

| Código | Requerimiento | Métrica | Nota Hostinger |
|--------|---------------|---------|----------------|
| RNF-001 | Tiempo de respuesta API | < 300ms (p95) | Shared resources managed |
| RNF-002 | Throughput | 200 req/s | Plan Business limit |
| RNF-003 | Búsqueda full-text | < 600ms | MySQL FULLTEXT más lento |

### 3.2 Disponibilidad (Managed Node.js)

| Código | Requerimiento | Métrica | Implementación |
|--------|---------------|---------|----------------|
| RNF-005 | Uptime | 99.5% | Hostinger managed |
| RNF-006 | RTO | < 15 minutos | Auto-restart de Hostinger |

### 3.3 Stack Tecnológico Managed Node.js

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Hostinger lo configura |
| **Framework** | Express.js | 4.x | Ligero, compatible |
| **Base de Datos** | MariaDB | 10.6+ | Desde panel Hostinger |
| **ORM** | TypeORM | 0.3.x | Soporta MySQL/MariaDB |
| **Caché** | lru-cache | 11.x | Sin dependencias |
| **Búsqueda** | MySQL FULLTEXT | - | Nativo en MariaDB |
| **Mensajería** | EventEmitter2 | 6.x | Proceso local |
| **Jobs** | node-cron | 3.x | Funciona en managed |
| **Testing** | Jest | 29.x | Standard |
| **Logs** | winston | 3.x | Console + files (temp) |
| **Process Manager** | Hostinger Managed | - | Ellos reinician si falla |

---

## 4. CAMBIOS EN REQUERIMIENTOS TÉCNICOS

### 4.1 Base de Datos (PostgreSQL → MariaDB)

**Configuración desde Panel Hostinger:**
1. Entrar a hPanel → Databases → MySQL Databases
2. Crear database: `u123456789_msclientes`
3. Crear usuario con password seguro
4. Anotar: host (generalmente `localhost`), puerto `3306`

**Cambios en tipos de datos:**

| PostgreSQL | MariaDB | Nota |
|------------|---------|------|
| `UUID` | `CHAR(36)` | TypeORM maneja |
| `JSONB` | `JSON` | Soporte MariaDB 10.6+ |
| `TIMESTAMPTZ` | `TIMESTAMP` | Timezone en app |
| `TEXT[]` | `JSON` | Arrays como JSON |
| `CITEXT` | `VARCHAR` + `LOWER()` | Case-insensitive manual |

### 4.2 Caché (Redis → lru-cache)

**Configuración Managed:**
```typescript
// Sin Redis, todo en memoria local
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 5000,           // Max items en memoria
  ttl: 1000 * 60 * 15, // 15 minutos
});
```

**Limitaciones:**
- ⚠️ Caché se pierde al reiniciar (Hostinger reinicia automáticamente)
- ⚠️ No compartida entre instancias (plan Business = single instance)
- ✅ Suficiente para carga moderada

### 4.3 Búsqueda (Elasticsearch → MySQL FULLTEXT)

```typescript
// Query con FULLTEXT
const results = await customerRepository
  .createQueryBuilder('c')
  .where('MATCH(c.company_name, c.first_name, c.last_name) AGAINST (:search IN BOOLEAN MODE)', 
    { search: `${term}*` })
  .getMany();
```

### 4.4 Mensajería (RabbitMQ → EventEmitter2)

```typescript
// En lugar de RabbitMQ
import { EventEmitter2 } from 'eventemitter2';

const emitter = new EventEmitter2();

emitter.emit('customer.created', { customerId: '123' });
emitter.on('customer.created', async (data) => { /* procesar */ });
```

### 4.5 Jobs (BullMQ → node-cron)

```typescript
import { CronJob } from 'cron';

new CronJob('0 */6 * * *', async () => {
  await processPendingJobs();
}, null, true);
```

---

## 5. CONFIGURACIÓN HOSTINGER MANAGED

### 5.1 Variables de Entorno (Panel Hostinger)

En hPanel → Node.js → Environment Variables:

```
NODE_ENV=production
PORT=3001 (o el que te asigne Hostinger)

# MariaDB (datos del panel)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=u123456789_msclientes
DB_PASSWORD=************
DB_DATABASE=u123456789_msclientes
DB_SYNC=false

# Cache
CACHE_MAX_ITEMS=5000
CACHE_TTL_SECONDS=900

# JWT (msseguridad)
MSSEGURIDAD_URL=https://tu-app-msseguridad.hostinger.com

# Email (SMTP externo)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx

# Logs
LOG_LEVEL=info
```

**Nota:** No uses archivos `.env` en producción managed. Configura todo en el panel.

### 5.2 Estructura de Proyecto

```
msclientes/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── interfaces/
├── dist/              # Compilado (no subir a Git)
├── uploads/           # Archivos temporales (si aplica)
├── package.json
├── tsconfig.json
└── README.md
```

**IMPORTANTE:** No incluir `node_modules/`, `dist/`, ni `.env` en Git.

---

## 6. PROCESO DE DEPLOY EN HOSTINGER MANAGED

### 6.1 Paso a Paso

**1. Crear Node.js App en Panel**
- hPanel → Advanced → Node.js
- Click "Create application"
- Seleccionar Node.js version 20.x
- Elegir dominio/subdominio
- Anotar la ruta de la app (ej: `/home/u123456789/node-apps/msclientes`)

**2. Configurar Environment Variables**
- En la misma sección Node.js, agregar todas las variables del punto 5.1

**3. Subir Código (3 opciones)**

**Opción A: Git (recomendado)**
```bash
# En tu local
git push origin main
```
- En panel: seleccionar "Deploy from Git"
- Conectar con GitHub
- Seleccionar repo `eugarte/msclientes`
- Cada push a main hace deploy automático

**Opción B: ZIP Upload**
- En tu local:
```bash
npm run build
zip -r deploy.zip . -x "node_modules/*" ".git/*"
```
- En panel: Upload ZIP file

**Opción C: File Manager**
- Subir archivos vía hPanel File Manager

**4. Configurar Start Command**
En el panel, setear:
```
node dist/main.js
```
(o `npm start` si así lo configuraste)

**5. Instalar Dependencias**
Hostinger lo hace automáticamente al detectar `package.json`, o:
```
npm install
npm run build
```

**6. Ejecutar Migraciones**
Desde el panel o local (conectando a DB de Hostinger):
```bash
npm run db:migrate
```

**7. Iniciar App**
Click "Start" en el panel. Hostinger maneja:
- Auto-restart si crashea
- Logs en el panel
- SSL automático

---

## 7. LIMITACIONES MANAGED NODE.JS

### 7.1 Lo que NO podés hacer

| Feature | Disponible | Alternativa |
|---------|-----------|-------------|
| SSH | ❌ No | File Manager + Git |
| PM2 | ❌ No | Hostinger lo maneja |
| Puertos custom | ⚠️ Limitado | Usar el puerto asignado |
| Redis | ❌ No | lru-cache |
| Elasticsearch | ❌ No | MySQL FULLTEXT |
| Cron jobs | ⚠️ Limitado | node-cron en app |

### 7.2 Límites del Plan Business

| Recurso | Límite |
|---------|--------|
| Node.js apps | 5 |
| Storage | 50 GB NVMe (total) |
| MariaDB | Parte del storage |
| Bandwidth | Ilimitado |
| Backups | Daily automático |

---

## 8. CHECKLIST PRE-DEPLOY

- [ ] Crear database MariaDB en hPanel
- [ ] Configurar variables de entorno en Node.js panel
- [ ] Subir código (Git/ZIP)
- [ ] Configurar start command
- [ ] Ejecutar migraciones TypeORM
- [ ] Verificar logs en panel
- [ ] Probar endpoints críticos
- [ ] Configurar dominio (opcional)

---

**Documento actualizado para Hostinger Managed Node.js**  
**Versión:** 2.1  
**Fecha:** Abril 2026
