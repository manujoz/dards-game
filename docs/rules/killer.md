# Reglas de Killer

## Visión General

Juego de supervivencia. A los jugadores se les asigna un número único. Primero deben convertirse en un "Killer" golpeando el doble de su número, luego eliminan oponentes golpeando sus números.

## Configuración

- **Vidas**: 3, 5 (por defecto).
- **Modo de Asignación**: Selección Manual o Aleatoria (Números únicos 1-20).
- **Auto-Suicidio**: Desactivado (por defecto).

## Puntuación / Mecánica

1.  **Estado**:
    - **Normal**: No puede herir a otros. Objetivo: Golpear Doble de su número para convertirse en Killer.
    - **Killer**: Puede herir a otros. Objetivo: Golpear números de Oponentes.
2.  **Convertirse en Killer**:
    - Un jugador Normal debe golpear el **Doble** de su número asignado.
    - Una vez Killer, permanece Killer (a menos que las reglas especifiquen reinicio, v1: permanece Killer).
3.  **Atacando**:
    - Un **Killer** lanza a un número de oponente.
    - **Impacto**: Reduce las vidas del oponente.
        - Simple: -1 Vida.
        - Doble: -2 Vidas.
        - Triple: -3 Vidas.
4.  **Eliminación**: Cuando las vidas llegan a 0 o menos, el jugador es eliminado.

## Condiciones de Victoria

- El último jugador (o equipo) con vidas restantes gana.

## Casos Especiales

- **Exceso de daño**: Llevar un oponente de 1 vida a -2 no conlleva penalización/bonificación. Solo eliminado.
- **Golpear su propio número (Killer)**: Sin efecto (a menos que se especifique lo contrario).
- **Golpear su propio número (Normal)**: Sin efecto.
- **Golpear jugador muerto**: Sin efecto.

## Escenarios Canónicos (Dorados)

### Escenario 1: Convirtiéndose en Killer

_Config: Vidas 5. Número del Jugador A: 10._
**Estado**: El Jugador A es Normal.
**Turno**:

1.  **Dardo 1**: 10 Simple. (Sin efecto).
2.  **Dardo 2**: 10 Doble. (Cambio de Estado -> **KILLER**).
3.  **Dardo 3**: 10 Simple. (Auto-impacto como killer -> Sin efecto).
    **Resultado**: A es ahora Killer. Vidas: 5.

### Escenario 2: Atacando

_Config: Vidas 5. Jugador A es Killer (Núm 10). Jugador B (Núm 20) tiene 3 Vidas._
**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Simple. (Impacto en B -> B pierde 1 vida).
2.  **Dardo 2**: 20 Triple. (Impacto en B -> B pierde 3 vidas).
    **Resultado**: Vidas de B: 3 - 1 - 3 = -1 -> **ELIMINADO**.

### Escenario 3: Turno Mixto

_Config: Vidas 5. A (10) Normal, B (20) Normal._
**Turno (Jugador A)**:

1.  **Dardo 1**: 20 Triple. (A no es killer, golpea B -> Sin efecto).
2.  **Dardo 2**: 10 Doble. (A se convierte en **KILLER**).
3.  **Dardo 3**: 20 Simple. (A es killer, golpea B -> B pierde 1 vida).
    **Resultado**: A: Killer. B: 4 Vidas.
