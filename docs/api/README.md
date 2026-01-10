[← Volver al Principal](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Principios](#principios)
- [Documentación de API](#documentación-de-api)

---

## Visión General

Dards Game utiliza **Server Actions** de Next.js 16 como capa de API, eliminando la necesidad de endpoints REST tradicionales. Todas las mutaciones de datos ocurren en funciones server-side con validación Zod y transacciones Prisma.

## Principios

### 1. Server Actions Only

No se usan API Routes (`/api/...`). Las mutaciones se ejecutan con funciones marcadas como `"use server"`:

```typescript
// src/app/actions/players.ts
"use server";

export async function createPlayer(data: CreatePlayerInput): Promise<ActionResult<Player>> {
    // Validación + DB operation
}
```

### 2. Validación con Zod

Todos los inputs se validan en el servidor antes de operar sobre la DB:

```typescript
const schema = z.object({
    name: z.string().min(1).max(50),
    avatar: z.string().optional(),
});

const validatedData = schema.parse(data); // Throws si es inválido
```

### 3. Retorno Consistente

Las actions retornan `ActionResult<T>`:

```typescript
type ActionResult<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error: string;
      };
```

### 4. Revalidación de Cache

Tras mutaciones, invalidar cache con `revalidatePath()`:

```typescript
await prisma.player.create({ data });
revalidatePath("/players"); // Refresca Server Components
```

## Documentación de API

- [**Server Actions**](./server-actions.md) - Estructura, validación, manejo de errores

---

**Manu Overa - Investments** © 2025 - Registered team under license protection
