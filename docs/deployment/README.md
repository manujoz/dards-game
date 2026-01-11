[← Volver al Principal](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Entornos](#entornos)
- [Documentación de Despliegue](#documentación-de-despliegue)

---

## Visión General

Dards Game se despliega en **Netlify** usando **Supabase (Postgres)** como base de datos persistente.

## Entornos

### Desarrollo Local

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

### Producción

```bash
# Build optimizado
pnpm build

# Iniciar servidor de producción
pnpm start
```

## Documentación de Despliegue

- [**Netlify + Supabase (Postgres)**](./netlify.md) - Deploy en Netlify, variables de entorno y migraciones Prisma

---
