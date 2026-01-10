# Killer Rules

## Overview

Survival game. Players are assigned a unique number. They must first become a "Killer" by hitting the double of their number, then eliminate opponents by hitting their numbers.

## Configuration

-   **Lives**: 3, 5 (default).
-   **Assign Mode**: Manual Selection or Random (Unique numbers 1-20).
-   **Self-Suicide**: Off (default).

## Scoring / Mechanics

1.  **Status**:
    -   **Normal**: Cannot hurt others. Aim: Hit Double of own number to become Killer.
    -   **Killer**: Can hurt others. Aim: Hit Opponents' numbers.
2.  **Becoming Killer**:
    -   A Normal player must hit the **Double** of their assigned number.
    -   Once Killer, they stay Killer (unless rules specify resetting, v1: stay Killer).
3.  **Attacking**:
    -   A **Killer** throws at an opponent's number.
    -   **Hit**: Reduces opponent's lives.
        -   Single: -1 Life.
        -   Double: -2 Lives.
        -   Triple: -3 Lives.
4.  **Elimination**: When lives reach 0 or less, the player is out.

## Win Conditions

-   The last player (or team) with lives remaining wins.

## Edge Cases

-   **Overkill**: Bringing an opponent from 1 life to -2 does not carry penalty/bonus. Just eliminated.
-   **Hitting own number (Killer)**: No effect (unless specified otherwise).
-   **Hitting own number (Normal)**: No effect.
-   **Hitting dead player**: No effect.

## Canonical Scenarios (Golden)

### Scenario 1: Becoming Killer

_Config: Lives 5. Player A Number: 10._
**State**: Player A is Normal.
**Turn**:

1.  **Throw 1**: 10 Single. (No effect).
2.  **Throw 2**: 10 Double. (Status Change -> **KILLER**).
3.  **Throw 3**: 10 Single. (Self-hit as killer -> No effect).
    **Result**: A is now Killer. Lives: 5.

### Scenario 2: Attacking

_Config: Lives 5. Player A is Killer (Num 10). Player B (Num 20) has 3 Lives._
**Turn (Player A)**:

1.  **Throw 1**: 20 Single. (Hit B -> B loses 1 life).
2.  **Throw 2**: 20 Triple. (Hit B -> B loses 3 lives).
    **Result**: B Lives: 3 - 1 - 3 = -1 -> **ELIMINATED**.

### Scenario 3: Mixed Turn

_Config: Lives 5. A (10) Normal, B (20) Normal._
**Turn (Player A)**:

1.  **Throw 1**: 20 Triple. (A is not killer, hits B -> No effect).
2.  **Throw 2**: 10 Double. (A becomes **KILLER**).
3.  **Throw 3**: 20 Single. (A is killer, hits B -> B loses 1 life).
    **Result**: A: Killer. B: 4 Lives.
