[← Volver al Principal](../README.md) | [← Arquitectura](./README.md) | [Server Actions](../api/server-actions.md)

---

## Índice

- [Conceptos Clave](#conceptos-clave)
- [Flujo de Turnos](#flujo-de-turnos)
- [Estructura de Estado](#estructura-de-estado)
- [Patrones de Implementación](#patrones-de-implementación)

---

## Conceptos Clave

El motor de juego (`src/lib/game/game-engine.ts`) gestiona el ciclo de vida de una partida de dardos mediante funciones puras e inmutables.

### Entidades Principales

```typescript
GameState {
    players: Player[]           // Jugadores en orden de turnos
    config: GameConfig          // Configuración del juego (tipo, opciones)
    currentPlayerId: string     // ID del jugador activo
    currentRound: number        // Ronda actual
    currentTurn: Turn           // Turno en progreso
    playerStates: PlayerState[] // Puntajes y stats por jugador
    winner: string | null       // ID del ganador (si terminó)
    history: Turn[]             // Histórico de turnos completados
}
```

## Flujo de Turnos

### 1. Inicialización

```typescript
const gameState = GameEngine.init(players, config);
// → Crea PlayerStates con puntajes iniciales según el modo
// → Establece el primer jugador y turno vacío
```

### 2. Procesar Tiro

```typescript
const newState = GameEngine.processThrow(state, throw);
// → Valida que no haya winner
// → Valida que el turno no esté completo (3 dardos)
// → Añade throw al currentTurn.throws
// → Actualiza puntajes según reglas del juego
// → Detecta win conditions
```

### 3. Finalizar Turno

```typescript
const nextState = GameEngine.endTurn(state);
// → Mueve currentTurn a history
// → Avanza al siguiente jugador (circular)
// → Incrementa round si completó el ciclo
// → Crea nuevo Turn vacío
```

## Estructura de Estado

### PlayerState

Cada jugador tiene un estado dinámico que varía según el modo:

```typescript
// X01
{ playerId: "1", score: 301, stats: {} }

// Cricket
{ playerId: "2", score: 45, stats: { marks: { 15: 3, 16: 2, ... } } }

// Killer
{ playerId: "3", score: 5, stats: { assignedNumber: 7, lives: 3 } }
```

### GameConfig

Define el comportamiento del juego:

```typescript
// X01
{ type: "x01", startScore: 501, doubleOut: true }

// Shanghai
{ type: "shanghai", maxRounds: 7, targetNumbers: [1,2,3,4,5,6,7] }
```

## Patrones de Implementación

### Inmutabilidad

Todas las operaciones retornan un **nuevo estado** sin mutar el original:

```typescript
// ❌ Incorrecto
state.currentTurn.throws.push(throw);

// ✅ Correcto
const newState = {
    ...state,
    currentTurn: {
        ...state.currentTurn,
        throws: [...state.currentTurn.throws, throw]
    }
};
```

### Delegación a Game Handlers

El motor delega reglas específicas a handlers (`src/lib/game/games/`):

```typescript
// game-engine.ts
const handler = getGameHandler(state.config.type);
const updatedPlayerStates = handler.calculateScore(state, throw);

// games/x01.ts
export const X01Handler: GameHandler = {
    calculateScore(state, throw) {
        // Lógica específica de X01
    },
    checkWinCondition(state) { ... },
    validateThrow(state, throw) { ... }
};
```

### Validación de Reglas

Cada handler valida throws según sus reglas:

```typescript
// Round the Clock: Solo aceptar el número de la secuencia
validateThrow(state, throw) {
    const ps = getCurrentPlayerState(state);
    const targetNumber = ps.stats.targetNumber || 1;
    return throw.segment === targetNumber ? null : "Debe golpear el número objetivo";
}
```

### Win Conditions

Los handlers definen cuándo termina el juego:

```typescript
// X01: Llegar exactamente a 0
checkWinCondition(state) {
    const ps = getCurrentPlayerState(state);
    return ps.score === 0 ? ps.playerId : null;
}

// High Score: Mayor puntaje tras X rondas
checkWinCondition(state) {
    if (state.currentRound < config.maxRounds) return null;
    return getPlayerWithMaxScore(state.playerStates).playerId;
}
```

---
