# Reglas de Halve-It

## Visión General

Un juego de alto riesgo donde los jugadores intentan golpear objetivos específicos en cada ronda. No conseguir golpear el objetivo al menos una vez resulta en que la puntuación total del jugador se reduzca a la mitad.

## Configuración

- **Secuencia de Objetivos**: Estándar (Por defecto).
    - Ejemplo de Secuencia: 20, 16, Doble 7, 14, 18, Triple 10, Bull. (Solo un ejemplo, v1 tendrá una lista fija o seleccionable).
    - Por defecto v1: 20, 19, 18, 17, 16, 15, Bull. (¿Simplificado como Cricket pero reglas Halve-it? ¿O mezcla Halve-it clásica?).
    - Definamos el Por defecto v1 basado en clásico: **20, 16, doble 7, 14, 18, triple 10, bull**.

## Puntuación

- **Puntuación Inicial**: 0 (o a veces una base como 40 para evitar 0s tempranos, v1 comienza en 0).
- **Mecánica de turno**:
    - El jugador lanza 3 dardos al Objetivo de la ronda actual.
    - **Éxito**: Si _al menos un_ dardo golpea el Objetivo (coincidiendo con segmento y restricción como Doble/Triple):
        - Los puntos de _todos los impactos válidos_ se suman a la puntuación total.
        - (Puntos = Valor \* Multiplicador).
    - **Fallo**: Si _ninguno_ de los 3 dardos golpea el Objetivo:
        - La Puntuación Total actual es **Dividida a la mitad**.
        - División entera (Piso). Ejemplo: 35 / 2 = 17.

## Condiciones de Victoria

- Puntuación más alta después de completar la secuencia completa de objetivos.

## Casos Especiales

- **Puntuación Cero**: Dividir 0 a la mitad resulta en 0.
- **Objetivo Incorrecto**: Golpear 19 cuando el objetivo es 20 cuenta como 0 puntos y no cuenta como un "Éxito".

## Escenarios Canónicos (Dorados)

### Escenario 1: Éxito

_Config: Estándar. Objetivo: 20._
**Estado**: Puntuación: 100.
**Turno**:

1.  **Dardo 1**: 20 Simple. (Impacto. Puntos acumulados: 20).
2.  **Dardo 2**: 18 Simple. (Objetivo no alcanzado).
3.  **Dardo 3**: 20 Triple. (Impacto. Puntos acumulados: 60).
    **Resultado**: Objetivo golpeado al menos una vez. Puntuación = 100 + 20 + 60 = **180**.

### Escenario 2: Fallo (Dividir a la mitad)

_Config: Estándar. Objetivo: Doble 7._
**Estado**: Puntuación: 50.
**Turno**:

1.  **Dardo 1**: 7 Simple. (Restricción no cumplida - necesita Doble).
2.  **Dardo 2**: 19 Doble. (Objetivo no alcanzado).
3.  **Dardo 3**: 7 Simple. (Restricción no cumplida).
    **Resultado**: Objetivo no alcanzado completamente. Puntuación = piso(50 / 2) = **25**.

### Escenario 3: Manejo de Cero

_Config: Estándar. Objetivo: Bull._
**Estado**: Puntuación: 0.
**Turno**:

1.  **Dardo 1**: 20. (Fallo).
2.  **Dardo 2**: 20. (Fallo).
3.  **Dardo 3**: 20. (Fallo).
    **Resultado**: Puntuación = piso(0 / 2) = **0**.
