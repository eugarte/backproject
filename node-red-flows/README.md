# Node-RED Flows para BackProject API

## 📁 Archivo de Flujos

**Archivo:** `backproject-flows.json`

## 🚀 Cómo Importar en Node-RED

1. Abre tu Node-RED: https://pdp-transversalnodered.xopaao.easypanel.host/
2. Ve al menú (☰) → **Importar** → **Clipboard**
3. Copia el contenido del archivo `backproject-flows.json`
4. Pégalo en el campo de texto
5. Click en **Importar**
6. Deploy (botón rojo "Deploy" arriba a la derecha)

## 📋 Tabs/Flows Incluidos

| Tab | Descripción | Endpoints |
|-----|-------------|-----------|
| **Health & Utils** | Health check e info general | `/health`, `/` |
| **MS Producto** | Productos, categorías, tipos | `/api/v1/products`, `/categories`, `/product-types` |
| **MS Seguridad** | Auth, usuarios, catálogos | `/api/v1/auth/login`, `/register`, `/catalogs` |
| **MS Clientes** | Gestión de clientes (con auth) | `/api/v1/customers` |
| **MS Sistemas** | Configuraciones y catálogos | `/api/v1/system/catalogs`, `/configs` |

## 🔧 Configuración JWT

Los endpoints que requieren autenticación tienen un nodo **Function** llamado "Add JWT Token". Debes editarlo y reemplazar:

```javascript
// Agrega tu token JWT aquí
msg.headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
};
return msg;
```

Con tu token real obtenido del login.

## 🎯 Endpoints Públicos (No requieren auth)

- ✅ `/health`
- ✅ `/`
- ✅ `/api/v1/products`
- ✅ `/api/v1/categories`
- ✅ `/api/v1/product-types`
- ✅ `/api/v1/auth/catalogs`
- ✅ `/api/v1/auth/login`
- ✅ `/api/v1/auth/register`
- ✅ `/api/v1/system/catalogs`

## 🔐 Endpoints con Autenticación

- 🔒 `/api/v1/customers`
- 🔒 `/api/v1/system/configs`
- 🔒 `/api/v1/auth/users`
- 🔒 `/api/v1/auth/profile`

## 📝 Notas

- Los nodos **Inject** (cuadrado azul) disparan las peticiones cuando haces click en ellos
- Los nodos **Debug** muestran la respuesta en el sidebar de Debug (ícono bug a la derecha)
- Todas las respuestas son en formato JSON
- Los errores se muestran en el debug panel

## 🆘 Solución de Problemas

### Error 401 Unauthorized
El token JWT expiró o es inválido. Obtén uno nuevo haciendo login.

### Error 503 Service Unavailable
La API no está respondiendo. Verifica que https://www.support.aiproject.es/health funcione.

### Error de conexión
Verifica que tu Node-RED tenga acceso a internet para llamar a la API externa.
