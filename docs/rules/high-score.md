# Reglas de Puntuación Alta

## Visión General

Acumulación simple de puntos. Los jugadores intentan obtener la puntuación total más alta en un número fijo de rondas (o hasta que se alcanza una puntuación objetivo, aunque las rondas fijas es lo por defecto).

## Configuración

- **Rondas**: Número fijo de rondas (por defecto 7).
- **Puntuación Objetivo**: Límite opcional (ej: 1000). (Probablemente no en el por defecto v1 MVP, manteniéndose en Rondas).

## Puntuación

- **Entrada**: Cualquier segmento.
- **Valor**: Segmento \* Multiplicador.
- **Acumulación**: La puntuación comienza en 0 y aumenta.

## Condiciones de Victoria

- **Fin de Rondas**: Después de que se completen las rondas definidas, el jugador con la puntuación más alta gana.
- **Empate**: Si las puntuaciones están empatadas, usualmente se juega un dardo de desempate (más cerca del bull) o una ronda extra. Para v1: Empate o Ronda Extra (1 ronda). _Decisión: Empate._

## Casos Especiales

- **Dardos rechazados**: 0 puntos.

## Escenarios Canónicos (Dorados)

### Escenario 1: Puntuación Estándar

_Config: 7 Rondas_
**Estado**: Puntuación: 100. Ronda 3.
**Turno**:

1.  **Dardo 1**: 20 Triple. (+60)
2.  **Dardo 2**: 20 Simple. (+20)
3.  **Dardo 3**: 1 Simple. (+1)
    **Resultado**: La puntuación se convierte en **181**.

### Escenario 2: Fin del Juego

_Config: 7 Rondas. 2 Jugadores._
**Estado**: - J1: 300 (Completó 7 rondas). - J2: 250 (Inicio de Ronda 7).
**Turno (J2)**:

1.  **Dardo 1**: 20 Triple. (310).
2.  **Dardo 2**: 20 Simple. (330).
3.  **Dardo 3**: 10 Doble. (350).
    **Resultado**: J2 termina con 350. J1 tiene 300. **J2 GANA**.
