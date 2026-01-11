[← Volver al Principal](../README.md) | [← Despliegue](./README.md)

---

## Índice

- [Objetivo](#objetivo)
- [Prerequisitos](#prerequisitos)
- [Supabase: URLs correctas](#supabase-urls-correctas)
- [Variables de entorno (local y Netlify)](#variables-de-entorno-local-y-netlify)
- [Migraciones Prisma](#migraciones-prisma)
- [Configurar Netlify con GitHub](#configurar-netlify-con-github)
- [Verificación post-deploy](#verificación-post-deploy)
- [Troubleshooting](#troubleshooting)

---

## Objetivo

Desplegar **Dards Game** (Next.js App Router + Server Actions) en **Netlify** usando **Supabase Postgres** como base de datos.

La app usa Prisma desde Server Actions, por lo que producción necesita una base de datos **persistente** (no SQLite local).

## Prerequisitos

- Un repositorio en GitHub con este proyecto.
- Un proyecto de Supabase para **Dev** y otro para **Prod** (recomendado).
- `DATABASE_URL` (pooler) y `DIRECT_URL` (direct) a mano.

## Supabase: URLs correctas

En tu proyecto de Supabase:

1. Ve a **Project Settings → Database**.
2. Copia:
    - **Transaction pooler (PgBouncer)** → para `DATABASE_URL`
    - **Direct connection** → para `DIRECT_URL`

Recomendación de parámetros:

- `DATABASE_URL`: `?pgbouncer=true&sslmode=require&connection_limit=1&pool_timeout=0`
- `DIRECT_URL`: `?sslmode=require`

## Variables de entorno (local y Netlify)

### Local

- Usa `.env.local` (no se versiona) con las URLs del proyecto **Supabase Dev**.
- Usa `.env.example` como plantilla (sí se versiona).

> Prisma CLI suele cargar variables desde `.env` por defecto. Si usas `.env.local`, exporta variables antes de ejecutar migraciones.

### Netlify

En Netlify: **Site configuration → Environment variables** añade:

- `DATABASE_URL` (Pooler)
- `DIRECT_URL` (Direct)

Usa las URLs del proyecto **Supabase Prod**.

## Migraciones Prisma

1. Apunta tu entorno local a **Supabase Dev** (`DATABASE_URL` y `DIRECT_URL`).
2. Genera la migración inicial (ejemplo):
    - `pnpm prisma:migrate:dev --name init`
3. Asegúrate de commitear:
    - `prisma/migrations/**`
    - `prisma/schema.prisma`

En Netlify, el build ejecuta `prisma migrate deploy` para aplicar migraciones ya versionadas.

## Configurar Netlify con GitHub

1. En Netlify, pulsa **Add new site → Import an existing project**.
2. Conecta tu cuenta de GitHub y elige el repo.
3. Build settings:
    - **Build command**: ya viene de `netlify.toml` (`pnpm build:netlify`).
    - **Publish directory**: lo gestiona el plugin de Next.js.
4. Añade las variables de entorno (sección anterior).
5. Lanza el deploy.

## Verificación post-deploy

- Abre la URL del site.
- Prueba:
    - Crear jugador
    - Iniciar partida
    - Registrar un tiro
    - Ver matches/rankings

Si falla cualquier Server Action con error de DB, revisa primero `DATABASE_URL`/`DIRECT_URL` y los parámetros SSL/PgBouncer.

## Troubleshooting

- **Errores de conexiones** (demasiadas conexiones / timeouts):
    - Usa el pooler en `DATABASE_URL` con `pgbouncer=true`.
    - Mantén `connection_limit=1`.

- **Migraciones no se aplican en Netlify**:
    - Asegura que existe `prisma/migrations/**` en el repo.
    - Revisa que `DIRECT_URL` está configurada (direct, sin pooler).

---
