# Guía de Despliegue en Hostinger

## 1. Configurar Base de Datos

1. Accede a hPanel → Bases de Datos → MySQL
2. Crea nueva base de datos: `u123456789_msproducto`
3. Crea usuario y asigna contraseña
4. Abre phpMyAdmin e importa `sql/01_schema.sql`

## 2. Configurar Variables de Entorno

En hPanel → Node.js → Variables de Entorno:

```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_msproducto
DB_PASSWORD=tu_password
DB_NAME=u123456789_msproducto
DB_POOL_SIZE=15
APP_NAME=msproducto
APP_VERSION=1.0.0
API_PREFIX=/api/v1
RATE_LIMIT_MAX=100
```

## 3. Desplegar Aplicación

1. En hPanel → Node.js → Create Application
2. Selecciona Node.js 18.x
3. Repository URL: `https://github.com/eugarte/msproducto`
4. Branch: `main`
5. Startup file: `src/app.js`
6. Click "Create"

## 4. Verificar Despliegue

```bash
curl https://tu-dominio.com/health
```

Debe retornar:
```json
{
  "success": true,
  "service": "msproducto",
  "database": { "status": "healthy" }
}
```
