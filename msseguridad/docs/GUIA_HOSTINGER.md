# 🚀 Guía de Despliegue en Hostinger - msseguridad

## ✅ Compatibilidad Confirmada

| Tecnología | Hostinger | Estado |
|------------|-----------|--------|
| Node.js 20+ | ✅ Soportado | Versión LTS recomendada |
| MariaDB | ✅ Soportado | MySQL2 driver compatible |
| TypeORM | ✅ Compatible | `type: 'mysql'` funciona para ambos |
| lru-cache | ✅ Compatible | Caché en memoria, sin dependencias externas |

---

## 📋 Checklist Pre-Despliegue

### 1. Generar Claves JWT

```bash
# En tu máquina local
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 2. Preparar Variables de Entorno

Copiar `.env.hostinger` y editar con tus datos de Hostinger:

```bash
cp .env.hostinger .env.production
# Editar con tus credenciales de Hostinger
```

### 3. Crear Base de Datos en Hostinger

1. Ir a **Databases** → **MySQL Databases** en el panel de Hostinger
2. Crear base de datos: `msseguridad`
3. Crear usuario y asignar privilegios
4. Anotar: host, puerto, usuario, password, nombre de BD

### 4. Subir Archivos a Hostinger

**Opción A: Git (recomendado)**

```bash
# En Hostinger, usar Git Clone
# O subir ZIP y extraer
```

**Opción B: FTP/File Manager**

Subir:
- `dist/` (compilado)
- `keys/` (claves JWT)
- `package.json`
- `.env.production`
- `node_modules/` (o instalar en servidor)

---

## 🔧 Configuración en Hostinger

### 1. Configurar Node.js

En el panel de Hostinger:
1. Ir a **Website** → **Node.js**
2. Seleccionar versión: **20.x**
3. Application root: `/public_html` (o tu carpeta)
4. Application startup file: `dist/main.js`
5. Variables de entorno: copiar de `.env.production`

### 2. Configurar SSL (IMPORTANTE)

```typescript
// src/infrastructure/config/database.ts - Modificar para Hostinger
ssl: process.env.NODE_ENV === 'production' ? {
  rejectUnauthorized: false, // Hostinger usa certificados auto-firmados
} : false,
```

### 3. Ejecutar Migraciones

```bash
# SSH en Hostinger
cd ~/tu-carpeta-app
npx typeorm-ts-node-commonjs migration:run -d dist/infrastructure/config/database.js
```

---

## 📁 Estructura de Archivos en Hostinger

```
~/tu-carpeta-app/
├── dist/                    # Código compilado
│   ├── main.js
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── keys/
│   ├── private.pem         # Clave privada JWT
│   └── public.pem          # Clave pública JWT
├── node_modules/           # Dependencias
├── package.json
├── package-lock.json
└── .env.production         # Variables de entorno
```

---

## 🔄 Scripts de Despliegue

### Build Local

```bash
npm run hostinger:build
# Esto compila y deja solo dependencias de producción
```

### Inicio en Producción

```bash
npm run hostinger:start
# o directamente:
NODE_ENV=production node dist/main.js
```

---

## ⚠️ Consideraciones Importantes

### 1. Caché en Memoria (lru-cache)

| Aspecto | Implicación |
|---------|-------------|
| Persistencia | ⚠️ Se pierde al reiniciar el servidor |
| Multi-instancia | ⚠️ Cada instancia tiene su propia caché |
| Sesiones | ⚠️ Usuario puede perder sesión si hay reinicio |
| Rate limiting | ✅ Funciona por instancia |

**Solución para producción:**
- Implementar sticky sessions en Hostinger
- O migrar sesiones a tabla MySQL (futuro)

### 2. Archivos Subidos

**NO subir:**
- `test/` (tests unitarios)
- `coverage/` (reportes de cobertura)
- `.git/` (repositorio)
- `docs/` (documentación)
- `src/` (código fuente, ya está en dist/)

**SÍ subir:**
- `dist/` (obligatorio)
- `keys/` (obligatorio)
- `node_modules/` o instalar en servidor

### 3. Permisos de Archivos

```bash
# SSH en Hostinger
chmod 600 keys/private.pem
chmod 644 keys/public.pem
chmod 644 .env.production
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm ci --production
```

### Error de Conexión a MariaDB

```bash
# Verificar variables de entorno
echo $DB_HOST
echo $DB_USERNAME

# Probar conexión manual
mysql -u tu_usuario -p -h tu_host
```

### Puerto ya en uso

```bash
# Hostinger asigna puerto automáticamente
# Usar process.env.PORT en vez de puerto fijo
```

---

## 📊 Monitoreo en Hostinger

1. Ir a **Advanced** → **Node.js** → **Logs**
2. Revisar errores en tiempo real
3. Configurar uptime monitoring si está disponible

---

## 🎯 Próximos Pasos

1. ✅ Subir código a Hostinger
2. ✅ Configurar variables de entorno
3. ✅ Ejecutar migraciones de BD
4. ✅ Probar endpoints (/health, /auth/login)
5. 🔄 Configurar dominio personalizado
6. 🔄 Activar SSL (Let's Encrypt en Hostinger)

---

## 📞 Links Útiles

- [Hostinger Node.js Docs](https://support.hostinger.com/en/articles/15826674-how-to-deploy-a-node-js-application)
- [TypeORM MySQL/MariaDB](https://typeorm.io/data-source-options#mysql--mariadb-data-source-options)
- [mysql2 npm](https://www.npmjs.com/package/mysql2)
