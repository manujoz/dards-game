# Cricket

## Visión General

Cricket es un juego estratégico de territorio y control. Los jugadores compiten por "cerrar" números específicos de la diana y acumular puntos en ellos antes que sus oponentes.

## Configuración

### Números Activos

Por defecto: **15, 16, 17, 18, 19, 20 y Bull**

### Modos de Juego

**Cricket Estándar** (por defecto)

- Los puntos son buenos para ti
- Anotas puntos en números que has cerrado si tus oponentes aún no los han cerrado
- Objetivo: Cerrar todos los números y tener la puntuación más alta (o igual)

**Cricket Garganta Cortada** (Cut-Throat)

- Los puntos son malos para tus oponentes
- Los puntos que consigues se suman a la puntuación de los oponentes que no han cerrado ese número
- Objetivo: Cerrar todos los números y tener la puntuación más baja

## Sistema de Puntuación

### Números Válidos

Solo cuentan los impactos en **15, 16, 17, 18, 19, 20 y Bull**. Cualquier otro número no suma marcas ni puntos.

### Sistema de Marcas

Cada número necesita **3 marcas** para cerrarse:

- **Simple**: 1 marca
- **Doble**: 2 marcas
- **Triple**: 3 marcas
- **Bull Exterior**: 1 marca
- **Bull Interior**: 2 marcas

### Estados de un Número

1. **Cerrado para ti**: Has acumulado 3 marcas en ese número
2. **Abierto para anotar**: Lo has cerrado pero tus oponentes no
3. **Muerto**: Todos los jugadores lo han cerrado (no se pueden anotar más puntos)

### Cómo Anotar Puntos

**En modo Estándar:**

- Una vez que cierres un número (3 marcas), cada impacto adicional te da puntos
- Solo anotas si al menos un oponente **no** ha cerrado ese número
- Puntos = Valor del segmento × Multiplicador
- Cuando todos cierran un número, queda "muerto" y no da más puntos

**En modo Garganta Cortada:**

- Los puntos que consigues en números cerrados van a tus **oponentes** que no lo han cerrado
- Es una estrategia de ataque para perjudicar a otros jugadores

## Cómo Ganar

**En modo Estándar:**
Debes cumplir **dos condiciones** simultáneamente:

1. Haber cerrado todos los números (15-20 y Bull)
2. Tener la puntuación más alta o igual que tus oponentes

Si cierras todos los números pero vas perdiendo en puntos, debes seguir jugando para anotar en los números que tus oponentes aún tengan abiertos.

## Casos Especiales

### Sobre-impacto

Si aciertas un triple en un número que ya tiene 2 marcas:

- 1 marca completa el cierre (llegas a 3)
- Las 2 marcas restantes se convierten en puntos (si el número está abierto para anotar)

**Ejemplo**: Tienes 2 marcas en el 20 y aciertas un Triple 20:

- Primera marca: Cierra el 20 (3/3)
- Marcas restantes: 2 × 20 = 40 puntos (si algún oponente no ha cerrado el 20)

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
**Estado**:

- Jugador A: Todos los números cerrados. Puntuación: 100
- Jugador B: Todos cerrados excepto el 20 (B tiene menos de 3 marcas en el 20). Puntuación: 200

**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Triple.
    **Análisis**: A tiene el 20 cerrado. B NO ha cerrado el 20 (tiene < 3 marcas). Por tanto, A puede anotar en el 20.
    **Resultado**: A anota 60 puntos. Puntuación total de A: 160. A aún va por detrás de B (200), por lo que el juego continúa.
