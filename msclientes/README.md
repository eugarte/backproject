# msclientes

Microservicio de Gestión de Clientes implementado con **Clean Architecture**, **Node.js**, **TypeScript**, **MySQL** y **TypeORM**.

## Características

- ✅ **Clean Architecture**: Separación clara de Domain, Application, Infrastructure e Interfaces
- ✅ **CRUD completo de Clientes**: Gestión de clientes con direcciones, contactos, documentos y tags
- ✅ **GDPR Compliance**: Anonimización, exportación de datos y tracking de consentimientos
- ✅ **Integración JWT**: Validación de tokens desde msseguridad
- ✅ **Audit Logs**: Registro completo de operaciones con soporte GDPR
- ✅ **Eventos**: EventEmitter2 para eventos de dominio
- ✅ **Tests Unitarios**: Cobertura > 80%
- ✅ **Docker**: Configuración completa con docker-compose
- ✅ **API RESTful**: Endpoints bien documentados

## Tecnologías

- **Runtime**: Node.js 20+
- **Lenguaje**: TypeScript 5.4+
- **Framework**: Express.js
- **ORM**: TypeORM 0.3+
- **Base de Datos**: MySQL 8.0
- **Autenticación**: JWT (integración con msseguridad)
- **Eventos**: EventEmitter2
- **Logging**: Winston
- **Testing**: Jest
- **Documentación**: Swagger/OpenAPI

## Arquitectura

```
src/
├── domain/              # Capa de Dominio
│   ├── entities/        # Entidades de negocio
│   ├── repositories/    # Interfaces de repositorios
│   ├── events/          # Eventos de dominio
│   ├── services/        # Servicios de dominio
│   └── value-objects/   # Objetos de valor
├── application/         # Capa de Aplicación
│   ├── use-cases/       # Casos de uso
│   ├── dtos/            # Data Transfer Objects
│   ├── mappers/         # Mapeadores
│   └── validators/      # Validadores
├── infrastructure/      # Capa de Infraestructura
│   ├── persistence/     # TypeORM, repositorios
│   ├── auth/            # Servicios de autenticación
│   ├── logging/         # Logging
│   ├── events/          # Implementación de eventos
│   └── config/          # Configuración
└── interfaces/          # Capa de Interfaces
    └── http/            # Controllers, routes, middleware
```

## Instalación

### Local Development

```bash
# Clonar repositorio
git clone https://github.com/eugarte/msclientes.git
cd msclientes

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar base de datos (con Docker)
docker-compose up -d mysql redis

# Ejecutar migraciones
npm run migration:run

# Iniciar en modo desarrollo
npm run dev
```

### Docker

```bash
# Construir y levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

## Variables de Entorno

```env
NODE_ENV=development
PORT=3002

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=msclientes

# JWT (from msseguridad)
JWT_SECRET=your-secret
JWT_ISSUER=msseguridad
JWT_AUDIENCE=msclientes

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# msseguridad Integration
MSSEGURIDAD_URL=http://localhost:3001
```

## API Endpoints

### Clientes

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/v1/customers` | Crear cliente | `customers:create` |
| GET | `/api/v1/customers` | Listar clientes | `customers:read` |
| GET | `/api/v1/customers/:id` | Obtener cliente | `customers:read` |
| PATCH | `/api/v1/customers/:id` | Actualizar cliente | `customers:update` |
| DELETE | `/api/v1/customers/:id` | Soft delete | `customers:delete` |

### Direcciones

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/v1/customers/:id/addresses` | Agregar dirección | `customers:update` |
| GET | `/api/v1/customers/:id/addresses` | Listar direcciones | `customers:read` |

### Documentos

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/v1/customers/:id/documents` | Subir documento | `customers:update` |
| GET | `/api/v1/customers/:id/documents` | Listar documentos | `customers:read` |

### GDPR

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/v1/customers/:id/anonymize` | Anonimizar datos | `customers:gdpr` |
| GET | `/api/v1/customers/:id/export` | Exportar datos | `customers:gdpr` |

### Validación

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/v1/customers/validate/tax-id` | Validar ID fiscal | `customers:read` |

## Ejemplos de Uso

### Crear Cliente

```bash
curl -X POST http://localhost:3002/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "taxId": "12345678A",
    "taxIdType": "DNI",
    "nationality": "ES"
  }'
```

### Listar Clientes

```bash
curl "http://localhost:3002/api/v1/customers?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Anonimizar Cliente (GDPR)

```bash
curl -X POST http://localhost:3002/api/v1/customers/:id/anonymize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "Customer requested data deletion"
  }'
```

### Exportar Datos (GDPR)

```bash
curl "http://localhost:3002/api/v1/customers/:id/export?format=json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output customer-export.json
```

### Validar ID Fiscal

```bash
curl -X POST http://localhost:3002/api/v1/customers/validate/tax-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "taxId": "12345678A",
    "taxIdType": "DNI",
    "countryCode": "ES"
  }'
```

## Testing

```bash
# Ejecutar todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests con cobertura
npm run test:coverage

# Tests de integración
npm run test:integration
```

## Migraciones

```bash
# Generar migración
npm run migration:generate -- -n MigrationName

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

## Modelo de Datos

### Tablas Principales

- **customers**: Datos principales del cliente
- **addresses**: Direcciones del cliente
- **contacts**: Información de contacto
- **documents**: Documentos adjuntos
- **customer_tags**: Tags/etiquetas
- **customer_preferences**: Preferencias del cliente
- **credit_history**: Historial crediticio
- **audit_logs**: Registro de auditoría
- **consent_records**: Registro de consentimientos GDPR

## Eventos

Los siguientes eventos son emitidos vía EventEmitter2:

- `customer.created`: Cliente creado
- `customer.updated`: Cliente actualizado
- `customer.deleted`: Cliente eliminado (soft delete)
- `customer.anonymized`: Cliente anonimizado (GDPR)
- `customer.address.added`: Dirección agregada
- `customer.document.uploaded`: Documento subido
- `gdpr.export.requested`: Exportación de datos solicitada

## Seguridad

- Autenticación JWT desde msseguridad
- Autorización basada en permisos
- Rate limiting disponible
- Helmet para headers de seguridad
- CORS configurado
- Validación de inputs
- Sanitización de datos

## Contribuir

1. Fork el repositorio
2. Crear una rama (`git checkout -b feature/amazing-feature`)
3. Commit los cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## Contacto

- **Equipo**: msclientes Team
- **Repositorio**: https://github.com/eugarte/msclientes
- **Issues**: https://github.com/eugarte/msclientes/issues
