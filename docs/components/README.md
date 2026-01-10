[← Volver al Principal](../README.md)

---

## Índice

- [Visión General](#visión-general)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Documentación de Componentes](#documentación-de-componentes)

---

## Visión General

Los componentes de Dards Game están divididos en tres categorías:

1. **UI Base** (`src/components/ui/`) - Primitivos de Shadcn/ui (button, dialog, input)
2. **Admin Components** (`src/components/admin/`) - Gestión de jugadores y datos
3. **Game Components** (`src/components/game/`) - Interfaz de juego, canvas, modales

## Arquitectura de Componentes

### Client vs Server Components

```typescript
// ✅ Server Component (default en App Router)
// src/app/(admin)/players/page.tsx
export default async function PlayersPage() {
    const players = await prisma.player.findMany();
    return <PlayerList players={players} />;
}

// ✅ Client Component (interactividad)
// src/components/admin/PlayerList.tsx
"use client";
export function PlayerList({ players }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // ...
}
```

### Composición

Los componentes grandes se dividen en subcomponentes cohesivos:

```
GameController.tsx         # Orquestador principal
├─ TurnHud.tsx            # HUD de turnos y puntajes
├─ DartboardCanvas.tsx    # Canvas interactivo
├─ GameEffects.tsx        # Sonidos y confetti
└─ modals/
   ├─ NewGameModal.tsx    # Configuración de partida
   └─ CalibrationModal.tsx # Calibración táctil
```

## Documentación de Componentes

- [**DartboardCanvas**](./dartboard.md) - Canvas HTML5, calibración táctil, detección de zonas

---

**Manu Overa - Investments** © 2025 - Registered team under license protection
