[← Volver al Proyecto](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura de Documentación](#estructura-de-documentación)
- [Inicio Rápido](#inicio-rápido)

---

## Visión General

**Dards Game** es un videojuego de dardos para pantallas táctiles con soporte multijugador por turnos. El proyecto utiliza un motor de juego puro en TypeScript que gestiona 7 modos de juego distintos con lógica inmutable y validación precisa de puntajes.

### Características Principales

- **7 Modos de Juego**: X01, Cricket, Round the Clock, High Score, Shanghai, Killer, Halve-It
- **Motor Puro TS**: Lógica de juego inmutable sin dependencias de UI
- **Calibración Visual**: Sistema de calibración de pantalla táctil para detección precisa de zonas del tablero
- **Sistema de Rankings**: Persistencia de jugadores, partidas y estadísticas
- **Efectos Audiovisuales**: Sonidos dinámicos y animaciones con canvas-confetti

## Stack Tecnológico

| Capa              | Tecnología              | Propósito                                |
| :---------------- | :---------------------- | :--------------------------------------- |
| **Framework**     | Next.js 16 (App Router) | SSR, Server Actions, Routing             |
| **UI**            | React 19, Shadcn/ui     | Componentes, Radix primitives            |
| **Estilos**       | Tailwind CSS            | Utility-first styling                    |
| **Base de Datos** | Prisma + Supabase       | ORM, migraciones, persistencia           |
| **Validación**    | Zod                     | Runtime validation para Server Actions   |
| **Testing**       | Vitest                  | Unit tests para lógica de juego          |
| **Deploy**        | Netlify                 | Deploy de Next.js + variables de entorno |
| **Audio**         | Web Audio API           | Reproducción de efectos de sonido        |

## Estructura de Documentación

### [📐 Arquitectura](./architecture/README.md)

- [Motor de Juego](./architecture/game-engine.md) - Flujo de turnos, validación, inmutabilidad
- [Multi-dispositivo: device lock](./architecture/multiplayer-device-lock.md) - Control por dispositivo (lease/TTL) y reanudación segura

### [🔌 API](./api/README.md)

- [Server Actions](./api/server-actions.md) - Mutaciones de datos con Prisma

### [🎨 Componentes](./components/README.md)

- [DartboardCanvas](./components/dartboard.md) - Canvas interactivo y calibración táctil

### [🚀 Despliegue](./deployment/README.md)

- [Netlify + Supabase (Postgres)](./deployment/netlify.md) - Deploy en Netlify, variables de entorno y migraciones Prisma

### [📖 Reglas de Juego](./rules/README.md)

- Especificaciones detalladas de cada modo de juego

## Inicio Rápido

```bash
# Instalar dependencias
pnpm install

# Configurar base de datos
pnpm dlx prisma migrate dev
pnpm dlx prisma db seed

# Desarrollo local
pnpm dev
```

**Accesos**:

- **Juego**: http://localhost:3000/game
- **Admin Jugadores**: http://localhost:3000/players
- **Admin Partidas**: http://localhost:3000/matches
- **Rankings**: http://localhost:3000/rankings

---
