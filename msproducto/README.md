# Microservicio de Productos - msproducto

Microservicio de catálogo de productos dinámico con atributos configurables y relaciones cliente-producto.

## Características

- ✅ Esquema dinámico con atributos JSON
- ✅ Validación de atributos por categoría
- ✅ Relaciones Cliente-Producto: Favoritos, Historial de Vistas, Reseñas
- ✅ Alertas de precio
- ✅ API RESTful completa
- ✅ Optimizado para Hostinger Node.js

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=msproducto
API_PREFIX=/api/v1
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Tests
npm test
```

## API Endpoints

### Productos
- `GET /api/v1/products` - Listar productos
- `POST /api/v1/products` - Crear producto
- `GET /api/v1/products/:id` - Obtener producto
- `PUT /api/v1/products/:id` - Actualizar producto
- `DELETE /api/v1/products/:id` - Eliminar producto

### Categorías
- `GET /api/v1/categories` - Listar categorías
- `POST /api/v1/categories` - Crear categoría

### Cliente-Producto
- `POST /api/v1/products/:id/favorite` - Agregar a favoritos
- `GET /api/v1/clients/:clientId/favorites` - Listar favoritos
- `GET /api/v1/clients/:clientId/views` - Historial de vistas
- `POST /api/v1/products/:id/reviews` - Agregar reseña
- `POST /api/v1/products/:id/price-alert` - Crear alerta de precio

## Estructura de Relaciones

```
client_favorites        → Un cliente puede tener muchos productos favoritos
product_views           → Un cliente puede ver muchos productos
product_reviews         → Un cliente puede reseñar muchos productos
price_alerts            → Un cliente puede alertar sobre muchos productos
```

## Despliegue en Hostinger

Ver [HOSTINGER_DEPLOY.md](HOSTINGER_DEPLOY.md)

## Arquitectura

Ver documentación completa en `docs/`:
- [ARQUITECTURA.md](docs/ARQUITECTURA.md)
- [REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md)
- [PROPUESTA_IMPLEMENTACION.md](docs/PROPUESTA_IMPLEMENTACION.md)

## Licencia

ISC