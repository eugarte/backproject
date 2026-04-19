# BackProject - Microservicios Backend

Este proyecto contiene todos los microservicios backend para despliegue en Hostinger.

## Estructura

```
backproject/
├── msproducto/        - Microservicio de productos (dinámico)
├── msclientes/        - Microservicio de clientes (8 campos personalizados)
├── msnotificaciones/  - Microservicio de notificaciones
├── msseguridad/       - Microservicio de seguridad y autenticación
└── mssistemas/        - Microservicio de configuración de sistemas
```

## Scripts

- `npm start` - Inicia el microservicio de productos (entry point para Hostinger)
- `npm run build` - Build de todos los servicios
- `npm test` - Ejecuta tests en todos los workspaces

## Despliegue Hostinger

1. Subir este repositorio completo
2. Configurar el entry point: `msproducto/src/server.js`
3. Configurar variables de entorno en cada microservicio

## Workspaces

Este proyecto usa npm workspaces para gestionar los 5 microservicios.
