# Guía de Despliegue en Hostinger

## Configuración del Entry Point

Para Hostinger Node.js hosting, el entry point debe ser:

```
msproducto/src/server.js
```

## Variables de Entorno

Crear archivo `.env` en cada microservicio con sus configuraciones específicas.

### Base de Datos (MariaDB)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_db
DB_PASSWORD=password_db
DB_NAME=nombre_db
```

### JWT (msseguridad)

```
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=24h
```

### Email (msnotificaciones)

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=tu_email@dominio.com
SMTP_PASS=tu_password
```

## Pasos de Despliegue

1. **Subir código:**
   ```bash
   git add .
   git commit -m "Microservicios consolidados para Hostinger"
   git push origin main
   ```

2. **En Hostinger Panel:**
   - Ir a "Advanced" → "Git"
   - Conectar repositorio
   - Configurar entry point: `msproducto/src/server.js`

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno** en cada microservicio

5. **Iniciar servicio:**
   ```bash
   npm start
   ```

## Estructura de Workspaces

El proyecto usa npm workspaces:

```json
{
  "workspaces": [
    "msproducto",
    "msclientes",
    "msnotificaciones",
    "msseguridad",
    "mssistemas"
  ]
}
```

## URLs de Microservicios

- Productos: `/api/productos`
- Clientes: `/api/clientes`
- Notificaciones: `/api/notificaciones`
- Seguridad: `/api/seguridad`
- Sistemas: `/api/sistemas`
