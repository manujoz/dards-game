[← Volver al Principal](../README.md) | [← API](./README.md) | [Motor de Juego](../architecture/game-engine.md)

---

## Índice

- [Estructura de Actions](#estructura-de-actions)
- [Validación de Datos](#validación-de-datos)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplos por Entidad](#ejemplos-por-entidad)

---

## Estructura de Actions

Las Server Actions están organizadas por entidad en `src/app/actions/`:

```
actions/
  players.ts          # CRUD de jugadores
  matches.ts          # Guardar partidas completadas
  rankings.ts         # Consultas de estadísticas
  device-config.ts    # Configuración de calibración
```

### Patrón Básico

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { createPlayerSchema } from "@/lib/validation/players";
import type { ActionResult } from "@/types/actions/shared";

export async function createPlayer(input: unknown): Promise<ActionResult<Player>> {
    try {
        // 1. Validar input
        const data = createPlayerSchema.parse(input);

        // 2. Operación DB
        const player = await prisma.player.create({ data });

        // 3. Revalidar cache
        revalidatePath("/players");

        // 4. Retornar éxito
        return { success: true, data: player };
    } catch (error) {
        // 5. Capturar errores
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido",
        };
    }
}
```

## Validación de Datos

### Schemas Zod

Definidos en `src/lib/validation/`:

```typescript
// src/lib/validation/players.ts
import { z } from "zod";

export const createPlayerSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(50),
    avatar: z.string().optional(),
    email: z.string().email().optional(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
```

### Validación en Action

```typescript
const data = createPlayerSchema.parse(input); // Lanza ZodError si falla
```

## Manejo de Errores

### Try-Catch Universal

Todas las actions usan try-catch para retornar errores como objetos:

```typescript
try {
    // Operación
    return { success: true, data };
} catch (error) {
    // Zod error: error.message contiene detalles de validación
    // Prisma error: error.message contiene el error de DB
    return { success: false, error: String(error) };
}
```

### Uso en Client Components

```typescript
const result = await createPlayer({ name: "John" });

if (!result.success) {
    toast.error(result.error);
    return;
}

// result.data es de tipo Player
console.log(result.data.id);
```

## Ejemplos por Entidad

### Players

```typescript
// Crear
await createPlayer({ name: "Alice", avatar: "🎯" });

// Listar (Server Component)
const players = await prisma.player.findMany();

// Eliminar
await deletePlayer(playerId);
```

### Matches

```typescript
// Guardar partida completada
await saveMatch({
    gameType: "x01",
    winnerId: "player-1",
    players: ["player-1", "player-2"],
    config: { startScore: 501, doubleOut: true },
    turns: [...historyTurns],
    duration: 1200, // segundos
});
```

### Device Config

```typescript
// Guardar calibración
await saveDeviceConfig({
    screenWidth: 1920,
    screenHeight: 1080,
    calibrationPoints: [
        { x: 960, y: 540, segment: "bull" }, // Centro
        { x: 960, y: 200, segment: "20" }, // Arriba
        { x: 1300, y: 900, segment: "3" }, // Abajo-derecha
    ],
});
```

### Rankings

```typescript
// Obtener top 10 jugadores por victorias
const rankings = await getRankings({
    limit: 10,
    sortBy: "wins",
});
```

---
