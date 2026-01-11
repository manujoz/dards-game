# Reglas de Round the Clock

## Visión General

Los jugadores deben golpear los números 1 al 20 (y opcionalmente Bull) en orden secuencial.

## Configuración

- **Número de Inicio**: 1.
- **Número Final**: 20 (por defecto), Bull.
- **Modo**:
    - **Simples**: Cualquier segmento cuenta (Simple, Doble, Triple).
    - **Dobles**: Debe golpear el anillo Doble.
    - **Triples**: Debe golpear el anillo Triple.

## Puntuación

- **Objetivo Activo**: Cada jugador rastrea su número objetivo actual (comienza en 1).
- **Impacto**:
    - Si el dardo golpea el Objetivo Activo (respetando las restricciones de Modo):
        - El marcador avanza al siguiente número.
        - El jugador puede avanzar múltiples pasos en un turno.
    - Si el dardo no golpea el Objetivo Activo:
        - Sin progreso.

## Condiciones de Victoria

- El primer jugador en golpear exitosamente el **Número Final** gana.

## Casos Especiales

- **Saltar**: Golpear "3" cuando se apunta a "2" cuenta como un fallo. Sin progreso.
- **Doble/Triple en Modo Simples**: Cuenta como un impacto válido. Avanza el objetivo.

## Escenarios Canónicos (Dorados)

### Escenario 1: Múltiples Avances

_Config: Simples, Final: 20_
**Estado**: Objetivo: 5
**Turno**:

1.  **Dardo 1**: 5 Simple. (¡Impacto! Objetivo avanza a 6).
2.  **Dardo 2**: 6 Triple. (¡Impacto! Objetivo avanza a 7).
3.  **Dardo 3**: 7 Doble. (¡Impacto! Objetivo avanza a 8).
    **Resultado**: El objetivo del siguiente turno es **8**.

### Escenario 2: Objetivo No Alcanzado

_Config: Simples, Final: 20_
**Estado**: Objetivo: 10
**Turno**:

1.  **Dardo 1**: 12 Simple. (Fallo).
2.  **Dardo 2**: 10 Simple. (¡Impacto! Objetivo avanza a 11).
3.  **Dardo 3**: 12 Simple. (Fallo).
    **Resultado**: El objetivo del siguiente turno es **11**.

### Escenario 3: Turno Ganador

_Config: Simples, Final: 20_
**Estado**: Objetivo: 19
**Turno**:

1.  **Dardo 1**: 19 Simple. (¡Impacto! Objetivo avanza a 20).
2.  **Dardo 2**: 20 Simple. (¡Impacto! Objetivo avanza a Final).
    **Resultado**: **VICTORIA**. Fin del Juego.

### Escenario 4: Rigor del Modo Dobles

_Config: Dobles, Final: 20_
**Estado**: Objetivo: 5
**Turno**:

1.  **Dardo 1**: 5 Simple. (Fallo - necesita Doble).
2.  **Dardo 2**: 5 Triple. (Fallo - necesita Doble).
3.  **Dardo 3**: 5 Doble. (¡Impacto! Objetivo avanza a 6).
    **Resultado**: El objetivo del siguiente turno es **6**.
