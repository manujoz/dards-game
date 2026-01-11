[← Volver al Principal](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Entornos](#entornos)
- [Documentación de Despliegue](#documentación-de-despliegue)

---

## Visión General

Dards Game utiliza **Docker** para desarrollo y producción, garantizando consistencia entre entornos.

## Entornos

### Desarrollo Local (Sin Docker)

```bash
# Instalar dependencias
pnpm install

# Ejecutar migraciones
pnpm dlx prisma migrate dev

# Seed de datos iniciales
pnpm dlx prisma db seed

# Iniciar dev server
pnpm dev
```

**Acceso**: http://localhost:3000

### Desarrollo con Docker

```bash
# Levantar contenedores (App + SQLite volumen)
pnpm docker:dev

# Rebuild tras cambios en dependencias
pnpm docker:build

# Detener contenedores
pnpm docker:down
```

**Acceso**: http://localhost:3003

### Producción

```bash
# Build optimizado
pnpm build

# Iniciar servidor de producción
pnpm start
```

## Documentación de Despliegue

- [**Docker**](./docker.md) - Configuración de contenedores, volúmenes, troubleshooting
- [**Netlify + Supabase (Postgres)**](./netlify.md) - Deploy en Netlify, variables de entorno y migraciones Prisma

---

**Manu Overa - Investments** © 2025 - Registered team under license protection
