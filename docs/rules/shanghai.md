# Reglas de Shanghai

## Visión General

Los jugadores anotan tantos puntos como sea posible en el número activo de la ronda. También existe una condición de victoria instantánea llamada "Shanghai".

## Configuración

- **Rondas**: 1-7 (por defecto) o 1-20.
- **Números**: Ronda 1 = Número 1, Ronda 2 = Número 2, ... Ronda 7 = Número 7.

## Puntuación

- **Objetivo Activo**: Solo los impactos en el número correspondiente al contador de ronda actual.
    - Ej: Ronda 3: Solo impactos en "3" cuentan.
    - Los fallos anotan 0.
- **Puntos**: Valor \* Multiplicador. Se suma a la puntuación total.

## Condiciones de Victoria

1.  **Puntuación Alta**: Después de todas las rondas, el jugador con la puntuación más alta gana.
2.  **Shanghai (Victoria Instantánea)**: Si un jugador golpea un Simple, un Doble Y un Triple del número activo en el _mismo turno_. El juego termina inmediatamente y ese jugador gana independientemente de la puntuación.

## Casos Especiales

- **Ventaja de Última Ronda**: Si Jugador 1 termina ronda 7 con 50 puntos, Jugador 2 aún puede ganar anotando > 50 puntos o golpeando un Shanghai.
- **Secuencia de Shanghai**: El orden (S-D-T, T-S-D, etc.) no importa, solo necesitas uno de cada en el número activo específico.

## Escenarios Canónicos (Dorados)

### Escenario 1: Puntuación Estándar

_Config: 7 Rondas_
**Estado**: Ronda 2 (Objetivo: 2). Puntuación: 10.
**Turno**:

1.  **Dardo 1**: 2 Triple. (+6)
2.  **Dardo 2**: 2 Simple. (+2)
3.  **Dardo 3**: 19 Simple. (Fallo/0 puntos - número incorrecto).
    **Resultado**: La puntuación se convierte en **18**. Avanza a Ronda 3.

### Escenario 2: El Shanghai (Victoria Instantánea)

_Config: 7 Rondas_.
**Estado**: Ronda 5 (Objetivo: 5). El jugador va perdiendo 20-100.
**Turno**:

1.  **Dardo 1**: 5 Simple.
2.  **Dardo 2**: 5 Triple.
3.  **Dardo 3**: 5 Doble.
    **Resultado**: El jugador golpea Simple, Triple, Doble del número activo. **VICTORIA SHANGHAI**. Fin del Juego.

### Escenario 3: Shanghai Fallido

_Config: 7 Rondas_.
**Estado**: Ronda 4 (Objetivo: 4).
**Turno**:

1.  **Dardo 1**: 4 Simple.
2.  **Dardo 2**: 4 Doble.
3.  **Dardo 3**: 4 Simple. (Simple Duplicado).
    **Resultado**: No es un Shanghai. Puntos: 4 + 8 + 4 = 16 puntos añadidos. El juego continúa.
