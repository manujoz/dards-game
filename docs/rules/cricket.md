# Reglas de Cricket

## Visión General

Un juego de territorio y control. Los jugadores se enfocan en golpear números específicos (15, 16, 17, 18, 19, 20, Bull) para "cerrarlos" y anotar puntos.

## Configuración

- **Números**: 15, 16, 17, 18, 19, 20, Bull (Por defecto).
- **Modo**:
    - **Estándar** (Por defecto): Los puntos son buenos. Anotas en números cerrados si los oponentes no los han cerrado.
    - **Garganta Cortada**: Los puntos son malos. Los puntos anotados se suman a los oponentes que no han cerrado el número.

## Puntuación

- **Objetivos**: Solo los impactos en 15, 16, 17, 18, 19, 20 y Bull cuentan. Los demás impactos son fallos.
- **Marcas**:
    - Simple: 1 marca
    - Doble: 2 marcas
    - Triple: 3 marcas (Bull Interior = 2 marcas, Bull Exterior = 1 marca)
- **Cierre**: Un número está "Abierto" para un jugador una vez que acumula 3 marcas en él.
- **Puntos (Estándar)**: Una vez que un jugador Abre un número, los impactos posteriores en ese número anotan puntos (Valor * Multiplicador) *solo si\* el número aún no está Cerrado por todos los oponentes usando la lógica de puntuación/penalización.
    - Una vez que todos los jugadores han Cerrado un número, no se pueden anotar más puntos en él.

## Condiciones de Victoria

- **Estándar**: El jugador que ha Cerrado todos los números Y tiene la puntuación más alta (o igual) gana.
    - Si un jugador cierra todos los números pero va por detrás en puntos, debe continuar anotando en números que aún están abiertos para los oponentes hasta ponerse al día.

## Casos Especiales

- **Sobre-impacto**: Si se golpea un Triple en un número que ya tiene 2 marcas:
    - 1 marca completa el cierre.
    - Los 2 "impactos" restantes se utilizan para anotar (si es elegible).

## Escenarios Canónicos (Dorados)

### Escenario 1: Abriendo y Anotando

_Config: Estándar_
**Estado**: El Jugador A tiene 0 marcas en 20. El Oponente B tiene 0 marcas en 20.
**Turno**:

1.  **Dardo 1**: 20 Triple. (Marcas: 3. Estado: 20 Abierto para A. Puntos: 0).
2.  **Dardo 2**: 20 Simple. (Estado: A tiene 20 Abierto, B no cerrado. Puntos: +20).
3.  **Dardo 3**: 19 Doble. (Marcas en 19: 2).
    **Resultado**: A: 20 (Abierto), 19 (2 marcas), Puntuación: 20.

### Escenario 2: Anotando sobre el Oponente (Estándar)

_Config: Estándar_
**Estado**: El Jugador A tiene 20 Abierto. El Jugador B tiene 20 Cerrado (3 marcas).
**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Triple.
    **Análisis**: A tiene 20 Abierto. B tiene 20 Cerrado. El número está "muerto" (cerrado por todos).
    **Resultado**: 0 Puntos. Sin cambio de estado.

### Escenario 3: Puntuación Garganta Cortada

_Config: Garganta Cortada_
**Estado**: El Jugador A tiene 20 Abierto. El Jugador B tiene 0 marcas en 20.
**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Simple.
    **Análisis**: A está Abierto. B no está Cerrado. Los puntos van a B.
    **Resultado**: A: Sin cambio. B: Puntuación +20.

### Escenario 4: Verificación de Condición de Victoria

_Config: Estándar_
**Estado**: - Jugador A: Todos los números cerrados excepto Bull. Puntuación: 200. - Jugador B: Todos los números cerrados. Puntuación: 180.
**Turno (Jugador A)**:

1.  **Dardo 1**: Bull Simple. (Marcas: 1).
2.  **Dardo 2**: Bull Doble. (Marcas: 3 -> Bull Cerrado).
    **Análisis**: A ha cerrado todos los números. La puntuación de A (200) >= la puntuación de B (180).
    **Resultado**: **VICTORIA** para el Jugador A.

### Escenario 5: Ponerse al Día en Puntos

_Config: Estándar_
**Estado**: - Jugador A: Todos cerrados. Puntuación 100. - Jugador B: Todos cerrados excepto 20 (Abierto para B). Puntuación 200.
**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Triple.
    **Análisis**: A está cerrado. B NO está cerrado (B necesita cerrarlo, pero usualmente si A está hecho, ¿A gana? No, A necesita puntos). Espera, en cricket estándar, si A cierra todo pero va por detrás en puntos, A debe anotar en lo que sea que B tenga abierto. - Aclaración: Si A ha cerrado todo, pero B tiene puntuación más alta. A aún no puede ganar. A debe anotar en números que B NO ha cerrado. - En este estado, B tiene 20 ABIERTO (¿significando que B tiene >3 marcas? No, "Abierto para B" ¿significa que B tiene 3 marcas? Usualmente "Abierto" significa disponible para anotar. "Cerrado" significa 3 marcas alcanzadas. - Aclaremos terminología: - "Cerrado para Jugador": Jugador tiene 3 marcas. - "Cerrado para Tablero": Todos los jugadores tienen 3 marcas. - Corrección de estado: - Jugador A: Todos "Cerrados para Jugador". Puntuación 100. - Jugador B: Todos "Cerrados para Jugador" EXCEPTO 20 (B tiene < 3 marcas). Puntuación 200. - Estado del tablero: 20 NO está "Cerrado para Tablero". A puede anotar en él.
    **Turno (Jugador A)**:
1.  **Dardo 1**: 20 Triple.
    **Resultado**: A anota 60 puntos. Total 160. Aún va por detrás de 200. El juego continúa.
