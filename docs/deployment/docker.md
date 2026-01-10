[← Volver al Principal](../README.md) | [← Despliegue](./README.md) | [API](../api/README.md)

---

## Índice

- [Configuración de Docker](#configuración-de-docker)
- [Comandos Útiles](#comandos-útiles)
- [Volúmenes y Persistencia](#volúmenes-y-persistencia)
- [Troubleshooting](#troubleshooting)

---

## Configuración de Docker

### Archivos

```
docker/
  Dockerfile          # Imagen de producción
  Dockerfile.dev      # Imagen de desarrollo con hot-reload

docker-compose.yml      # Producción
docker-compose.dev.yml  # Desarrollo (usado por scripts)
```

### Dockerfile.dev

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN pnpm dlx prisma generate

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["pnpm", "dev"]
```

### docker-compose.dev.yml

```yaml
version: "3.8"

services:
    app:
        build:
            context: .
            dockerfile: docker/Dockerfile.dev
        ports:
            - "3003:3000"
        volumes:
            - .:/app
            - /app/node_modules
            - sqlite_data:/app/prisma
        environment:
            - DATABASE_URL=file:./dev.db
            - NODE_ENV=development

volumes:
    sqlite_data:
```

## Comandos Útiles

### Scripts NPM

```bash
# Levantar contenedores en background
pnpm docker:dev

# Rebuild de imágenes (tras cambios en package.json)
pnpm docker:build

# Detener y eliminar contenedores
pnpm docker:down
```

### Comandos Docker Directos

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f app

# Ejecutar comando dentro del contenedor
docker-compose -f docker-compose.dev.yml exec app pnpm dlx prisma studio

# Reiniciar servicio
docker-compose -f docker-compose.dev.yml restart app

# Ver estado de contenedores
docker-compose -f docker-compose.dev.yml ps
```

## Volúmenes y Persistencia

### Volúmenes Configurados

```yaml
volumes:
    - .:/app # Código fuente (hot-reload)
    - /app/node_modules # node_modules aislado (evita conflictos)
    - sqlite_data:/app/prisma # Base de datos persistente
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen de SQLite
docker volume inspect dards_sqlite_data

# Eliminar volumen (⚠️ Pierde datos)
docker volume rm dards_sqlite_data
```

### Reset Completo

```bash
# Script personalizado (si existe)
pnpm docker:reset

# O manualmente
docker-compose -f docker-compose.dev.yml down -v  # Elimina volúmenes
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

## Troubleshooting

### Puerto 3003 ya en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :3003

# Matar proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.dev.yml
ports:
  - "3004:3000"
```

### Cambios no se reflejan (hot-reload roto)

```bash
# Verificar que el volumen de código está montado
docker-compose -f docker-compose.dev.yml exec app ls -la /app

# Reiniciar contenedor
docker-compose -f docker-compose.dev.yml restart app
```

### Error de Prisma Client

```bash
# Regenerar Prisma Client dentro del contenedor
docker-compose -f docker-compose.dev.yml exec app pnpm dlx prisma generate

# O rebuild completo
pnpm docker:build
```

### Base de datos corrupta

```bash
# Eliminar volumen de SQLite
docker-compose -f docker-compose.dev.yml down -v

# Levantar de nuevo (crea DB limpia)
pnpm docker:dev

# Ejecutar migraciones
docker-compose -f docker-compose.dev.yml exec app pnpm dlx prisma migrate dev

# Seed de datos
docker-compose -f docker-compose.dev.yml exec app pnpm dlx prisma db seed
```

### Ver logs de errores

```bash
# Logs completos
docker-compose -f docker-compose.dev.yml logs app

# Solo errores (últimas 50 líneas)
docker-compose -f docker-compose.dev.yml logs --tail=50 app | grep -i error
```

---

**Manu Overa - Investments** © 2025 - Registered team under license protection
