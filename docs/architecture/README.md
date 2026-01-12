[← Volver al Principal](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Principios de Diseño](#principios-de-diseño)
- [Documentación de Arquitectura](#documentación-de-arquitectura)

---

## Visión General

La arquitectura de Dards Game sigue un patrón de **separación de capas** donde la lógica de negocio (motor de juego) es completamente independiente de la UI y del backend de persistencia.

## Principios de Diseño

### 1. Motor Puro TypeScript

El motor de juego (`src/lib/game/`) opera con funciones puras que:

- Reciben `GameState` y `Throw`
- Retornan un nuevo `GameState` (inmutabilidad)
- No acceden a DOM, DB, ni estado global
- Son testeables con Vitest sin mocks

### 2. Server Actions First

Las mutaciones de datos usan Server Actions de Next.js 16:

- Validación con Zod en el servidor
- Transacciones Prisma para consistencia
- Retorno de objetos `ActionResult<T>`
- `revalidatePath()` para invalidar cache

### 3. Componentes Client/Server Híbridos

- **Server Components**: Layout, listados de admin (fetch directo de Prisma)
- **Client Components**: Game UI, modales, canvas interactivo
- Hidratación optimizada con `"use client"` selectivo

### 4. Calibración Geométrica

Sistema de mapping de coordenadas táctiles → segmentos del tablero:

- 3 puntos de calibración (Bull, 20, 3)
- Transformación affine para corrección de perspectiva
- Detección por ángulo y radio normalizado

## Documentación de Arquitectura

- [**Motor de Juego**](./game-engine.md) - Flujo de turnos, validación de reglas, inmutabilidad
- [**Multi-dispositivo: device lock**](./multiplayer-device-lock.md) - Lease/TTL por dispositivo para evitar concurrencia al reanudar partidas

## Secciones relacionadas

- [API](../api/README.md)
- [Componentes](../components/README.md)

---
