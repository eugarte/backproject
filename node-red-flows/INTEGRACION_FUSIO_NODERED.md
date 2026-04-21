# Integración Fusio + Node-RED - Guía de Configuración

## 📋 Resumen

Esta guía configura **Fusio** como API Gateway frente a tus microservicios, utilizando **Node-RED** como capa de orquestación/intermediario.

## 🎯 Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE PETICIONES                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Cliente ──► Fusio (API Gateway) ──► Node-RED ──► Microservicios      │
│                                                                          │
│  • Rate Limiting    • Routing        • Transformación   • msclientes    │
│  • OAuth2           • Validación     • Orquestación     • msseguridad   │
│  • Analytics        • Caching        • Aggregation      • msproducto  │
│                                                                      │
│                                              • msnotificaciones       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔗 URLs de Servicios

| Servicio | URL |
|----------|-----|
| **Fusio** | https://aiproject.es/public/apps/fusio/ |
| **Node-RED** | https://pdp-transversalnodered.xopaao.easypanel.host/# |
| **msseguridad** | https://www.support.aiproject.es/api/v1 |
| **msclientes** | https://msclientes.xopaao.easypanel.host/api/v1 (ejemplo) |
| **msproducto** | https://msproducto.xopaao.easypanel.host/api/v1 (ejemplo) |
| **msnotificaciones** | https://msnotificaciones.xopaao.easypanel.host/api/v1 (ejemplo) |

---

## 📦 Fase 1: Configurar Conexiones en Fusio

### 1.1 Acceder al Backend de Fusio

1. Ir a: https://aiproject.es/public/apps/fusio/
2. Login con credenciales de administrador
3. Navegar a **Connections** para configurar los backends

### 1.2 Crear Conexiones HTTP (Para Node-RED)

En Fusio, ve a **Connection** → **Create**

#### Conexión a Node-RED
```yaml
Name: nodered_orquestador
Class: Fusio\Adapter\Http\Connection\Http
Config:
  url: https://pdp-transversalnodered.xopaao.easypanel.host
  headers:
    Content-Type: application/json
    Accept: application/json
```

#### Conexión a msseguridad (directa)
```yaml
Name: msseguridad_backend
Class: Fusio\Adapter\Http\Connection\Http
Config:
  url: https://www.support.aiproject.es/api/v1
  headers:
    Content-Type: application/json
```

---

## 🔧 Fase 2: Crear Acciones en Fusio

Las acciones definen la lógica de cada endpoint. Ve a **Action** → **Create**

### Acción: Login (Proxy a msseguridad)

```yaml
Name: action_auth_login
Class: Fusio\Adapter\Http\Action\HttpProxy
Config:
  connection: msseguridad_backend
  url: /auth/login
  method: POST
  headers:
    Content-Type: application/json
```

### Acción: Proxy a Node-RED (Genérico)

```yaml
Name: action_nodered_proxy
Class: Fusio\Adapter\Http\Action\HttpProxy
Config:
  connection: nodered_orquestador
  url: /api/${path}
  method: ${method}
  headers:
    Content-Type: application/json
    X-Forwarded-For: ${remote_ip}
```

---

## 🛤️ Fase 3: Crear Operaciones/Rutas en Fusio

Ve a **Operation** → **Create** para exponer los endpoints.

### 3.1 Autenticación (msseguridad)

| Campo | Valor |
|-------|-------|
| **HTTP Method** | POST |
| **HTTP Path** | /auth/login |
| **Action** | action_auth_login |
| **Public** | ✅ Sí (no requiere auth) |

**Request Schema:**
```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string", "format": "email" },
    "password": { "type": "string", "minLength": 6 }
  },
  "required": ["email", "password"]
}
```

**Response Schema:**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "token": { "type": "string" },
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "email": { "type": "string" },
        "name": { "type": "string" }
      }
    }
  }
}
```

### 3.2 Clientes (Via Node-RED)

| Campo | Valor |
|-------|-------|
| **HTTP Method** | GET |
| **HTTP Path** | /api/v1/clients |
| **Action** | action_nodered_proxy |
| **Scopes** | api, clientes:read |

### 3.3 Productos (Via Node-RED)

| Campo | Valor |
|-------|-------|
| **HTTP Method** | GET |
| **HTTP Path** | /api/v1/products |
| **Action** | action_nodered_proxy |
| **Scopes** | api, productos:read |

---

## 🔴 Fase 4: Flujos Node-RED para Orquestación

Accede a tu Node-RED: https://pdp-transversalnodered.xopaao.easypanel.host/#

### 4.1 Flujo: Proxy a msclientes

```json
[
  {
    "id": "http_in_clients",
    "type": "http in",
    "z": "flow_clients",
    "name": "GET /api/v1/clients",
    "url": "/api/v1/clients",
    "method": "get",
    "swaggerDoc": "",
    "x": 150,
    "y": 100,
    "wires": [["function_add_auth", "http_request_msclientes"]]
  },
  {
    "id": "function_add_auth",
    "type": "function",
    "z": "flow_clients",
    "name": "Add Auth Headers",
    "func": "// Extraer token de headers o query\nvar token = msg.req.headers['authorization'] || msg.req.query.token;\n\nif (token) {\n    msg.headers = {\n        'Authorization': token,\n        'Content-Type': 'application/json'\n    };\n}\n\n// Construir URL del microservicio\nmsg.url = 'https://msclientes.xopaao.easypanel.host/api/v1/clients';\nmsg.method = 'GET';\n\nreturn msg;",
    "outputs": 1,
    "x": 350,
    "y": 100,
    "wires": [["http_request_msclientes"]]
  },
  {
    "id": "http_request_msclientes",
    "type": "http request",
    "z": "flow_clients",
    "name": "Request msclientes",
    "method": "GET",
    "ret": "obj",
    "paytoqs": "ignore",
    "url": "",
    "tls": "",
    "persist": false,
    "proxy": "",
    "insecureHTTPParser": false,
    "authType": "",
    "senderr": false,
    "x": 550,
    "y": 100,
    "wires": [["function_format_response"]]
  },
  {
    "id": "function_format_response",
    "type": "function",
    "z": "flow_clients",
    "name": "Format Response",
    "func": "// Formatear respuesta para Fusio\nif (msg.statusCode >= 400) {\n    msg.payload = {\n        success: false,\n        error: msg.payload.message || 'Error from microservice',\n        statusCode: msg.statusCode\n    };\n    msg.statusCode = msg.statusCode;\n} else {\n    msg.payload = {\n        success: true,\n        data: msg.payload,\n        meta: {\n            source: 'msclientes',\n            timestamp: new Date().toISOString()\n        }\n    };\n}\n\nreturn msg;",
    "outputs": 1,
    "x": 750,
    "y": 100,
    "wires": [["http_out_response"]]
  },
  {
    "id": "http_out_response",
    "type": "http response",
    "z": "flow_clients",
    "name": "Response",
    "statusCode": "",
    "headers": {
        "Content-Type": "application/json"
    },
    "x": 950,
    "y": 100,
    "wires": []
  }
]
```

### 4.2 Flujo: Proxy a msseguridad con Transformación

```json
[
  {
    "id": "http_in_login",
    "type": "http in",
    "z": "flow_auth",
    "name": "POST /api/v1/auth/login",
    "url": "/api/v1/auth/login",
    "method": "post",
    "x": 150,
    "y": 200,
    "wires": [["function_transform_login"]]
  },
  {
    "id": "function_transform_login",
    "type": "function",
    "z": "flow_auth",
    "name": "Transform Login Request",
    "func": "// Transformar payload para msseguridad\nmsg.headers = {\n    'Content-Type': 'application/json'\n};\n\nmsg.url = 'https://www.support.aiproject.es/api/v1/auth/login';\nmsg.method = 'POST';\n\n// El payload ya viene en msg.payload\nreturn msg;",
    "outputs": 1,
    "x": 350,
    "y": 200,
    "wires": [["http_request_msseguridad"]]
  },
  {
    "id": "http_request_msseguridad",
    "type": "http request",
    "z": "flow_auth",
    "name": "Request msseguridad",
    "method": "POST",
    "ret": "obj",
    "url": "",
    "x": 550,
    "y": 200,
    "wires": [["function_handle_response"]]
  },
  {
    "id": "function_handle_response",
    "type": "function",
    "z": "flow_auth",
    "name": "Handle Auth Response",
    "func": "// Manejar respuesta de autenticación\nif (msg.statusCode === 200 && msg.payload.success) {\n    // Guardar en flow context para otros nodos\n    flow.set('last_token', msg.payload.token);\n    flow.set('last_user', msg.payload.user);\n}\n\nmsg.payload = {\n    success: msg.payload.success || false,\n    message: msg.payload.message,\n    token: msg.payload.token || null,\n    user: msg.payload.user || null\n};\n\nreturn msg;",
    "outputs": 1,
    "x": 750,
    "y": 200,
    "wires": [["http_out_auth"]]
  },
  {
    "id": "http_out_auth",
    "type": "http response",
    "z": "flow_auth",
    "name": "Auth Response",
    "x": 950,
    "y": 200,
    "wires": []
  }
]
```

### 4.3 Flujo: Health Check Agregado

```json
[
  {
    "id": "http_in_health",
    "type": "http in",
    "z": "flow_health",
    "name": "GET /health",
    "url": "/health",
    "method": "get",
    "x": 150,
    "y": 300,
    "wires": [["parallel_health_checks"]]
  },
  {
    "id": "parallel_health_checks",
    "type": "split",
    "z": "flow_health",
    "name": "Split Services",
    "func": "// Lista de servicios a verificar\nvar services = [\n    { name: 'msseguridad', url: 'https://www.support.aiproject.es/api/v1/health' },\n    { name: 'msclientes', url: 'https://msclientes.xopaao.easypanel.host/api/v1/health' },\n    { name: 'msproducto', url: 'https://msproducto.xopaao.easypanel.host/api/v1/health' }\n];\n\nmsg.parts = { count: services.length };\nreturn services.map(s => ({ payload: s }));",
    "outputs": 1,
    "x": 300,
    "y": 300,
    "wires": [["http_health_request"]]
  },
  {
    "id": "http_health_request",
    "type": "http request",
    "z": "flow_health",
    "name": "Check Service",
    "method": "GET",
    "ret": "obj",
    "url": "",
    "timeout": "5",
    "x": 450,
    "y": 300,
    "wires": [["join_results"]]
  },
  {
    "id": "join_results",
    "type": "join",
    "z": "flow_health",
    "name": "Join Results",
    "mode": "auto",
    "count": "",
    "timeout": "10",
    "x": 600,
    "y": 300,
    "wires": [["function_health_summary"]]
  },
  {
    "id": "function_health_summary",
    "type": "function",
    "z": "flow_health",
    "name": "Health Summary",
    "func": "// Agregar resultados de health check\nvar results = msg.payload;\nvar summary = {\n    timestamp: new Date().toISOString(),\n    services: {},\n    overall: 'healthy'\n};\n\nvar allHealthy = true;\nresults.forEach(r => {\n    var isHealthy = r.statusCode === 200;\n    summary.services[r.payload.name] = {\n        status: isHealthy ? 'up' : 'down',\n        statusCode: r.statusCode\n    };\n    if (!isHealthy) allHealthy = false;\n});\n\nsummary.overall = allHealthy ? 'healthy' : 'degraded';\nmsg.statusCode = allHealthy ? 200 : 503;\nmsg.payload = summary;\n\nreturn msg;",
    "outputs": 1,
    "x": 800,
    "y": 300,
    "wires": [["http_out_health"]]
  },
  {
    "id": "http_out_health",
    "type": "http response",
    "z": "flow_health",
    "name": "Health Response",
    "x": 1000,
    "y": 300,
    "wires": []
  }
]
```

---

## 🧪 Fase 5: Datos de Prueba (curl)

### 5.1 Probar msseguridad (Login)

```bash
# Login exitoso
curl -X POST https://www.support.aiproject.es/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }'

# Respuesta esperada:
# {"success":true,"token":"eyJhbGci...","user":{"id":"123","email":"usuario@test.com"}}
```

### 5.2 Probar vía Node-RED

```bash
# Health check agregado
curl https://pdp-transversalnodered.xopaao.easypanel.host/health

# Login vía Node-RED
curl -X POST https://pdp-transversalnodered.xopaao.easypanel.host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }'

# Clientes vía Node-RED
curl https://pdp-transversalnodered.xopaao.easypanel.host/api/v1/clients \
  -H "Authorization: Bearer eyJhbGci..."
```

### 5.3 Probar vía Fusio

```bash
# Login vía Fusio
curl -X POST https://aiproject.es/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }'

# Productos vía Fusio (con token)
curl https://aiproject.es/public/api/api/v1/products \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## 📊 Fase 6: Configurar Scopes y Seguridad en Fusio

### 6.1 Crear Scopes

Ve a **Scope** → **Create**:

| Scope | Descripción |
|-------|-------------|
| `api` | Acceso base a la API |
| `clientes:read` | Leer información de clientes |
| `clientes:write` | Modificar clientes |
| `productos:read` | Leer catálogo de productos |
| `productos:write` | Modificar productos |
| `notificaciones:send` | Enviar notificaciones |

### 6.2 Crear App/Consumer en Fusio

Ve a **App** → **Create**:

```yaml
Name: test_app_demo
Url: https://example.com
Scopes: api, clientes:read, productos:read
Status: 1 (Active)
```

**Credenciales generadas:**
- App Key: `test-key-xxxx`
- App Secret: `test-secret-yyyy`

### 6.3 Obtener Token OAuth2

```bash
# Authorization Code flow (para SPAs)
curl -X POST https://aiproject.es/public/api/authorization/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=TEST_KEY" \
  -d "client_secret=TEST_SECRET" \
  -d "scope=api clientes:read"

# Respuesta:
# {"access_token":"eyJ...","token_type":"bearer","expires_in":3600,"scope":"api clientes:read"}
```

---

## 📈 Fase 7: Analytics y Monitoreo

### 7.1 Dashboard en Fusio

Fusio incluye analytics nativos:
- Ve a **Analytics** en el backend
- Visualiza: Requests/min, Error rate, Latency p95
- Filtra por ruta, app, status code

### 7.2 Webhook para Logs

Configurar webhook en Fusio para enviar logs a un endpoint:

```bash
# Endpoint en Node-RED para recibir logs
curl -X POST https://pdp-transversalnodered.xopaao.easypanel.host/webhook/fusio-logs \
  -H "Content-Type: application/json" \
  -d '{
    "event": "request",
    "path": "/api/v1/clients",
    "method": "GET",
    "status": 200,
    "latency_ms": 145,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

---

## 🚀 Checklist de Implementación

- [ ] Configurar conexiones HTTP en Fusio
- [ ] Crear acciones para cada microservicio
- [ ] Crear operaciones/rutas con schemas
- [ ] Importar flujos Node-RED (copy-paste JSON)
- [ ] Configurar scopes y apps en Fusio
- [ ] Probar endpoints con curl
- [ ] Verificar analytics en dashboard
- [ ] Documentar credenciales de prueba

---

## 🔗 Referencias

- Fusio Docs: https://docs.fusio-project.org/
- Node-RED HTTP Nodes: https://nodered.org/docs/user-guide/nodes
- Fusio OpenAPI Spec: https://aiproject.es/public/api/system/generator/spec-openapi
