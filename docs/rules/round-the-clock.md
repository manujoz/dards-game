# Round the Clock Rules

## Overview

Players must hit the numbers 1 through 20 (and optionally Bull) in sequential order.

## Configuration

-   **Start Number**: 1.
-   **End Number**: 20 (default), Bull.
-   **Mode**:
    -   **Singles**: Any segment counts (Single, Double, Triple).
    -   **Doubles**: Must hit the Double ring.
    -   **Triples**: Must hit the Triple ring.

## Scoring

-   **Active Target**: Each player tracks their current target number (starts at 1).
-   **Hit**:
    -   If the dart hits the Active Target (respecting the Mode constraints):
        -   The arrow moves to the next number.
        -   The player can advance multiple steps in one turn.
    -   If the dart misses the Active Target:
        -   No progress.

## Win Conditions

-   The first player to successfully hit the **End Number** wins.

## Edge Cases

-   **Skipping**: Hitting "3" when aiming for "2" counts as a miss. No progress.
-   **Double/Triple in Singles Mode**: Counts as a valid hit. Advances target.

## Canonical Scenarios (Golden)

### Scenario 1: Multiple Advances

_Config: Singles, End: 20_
**State**: Target: 5
**Turn**:

1.  **Throw 1**: 5 Single. (Hit! Target advances to 6).
2.  **Throw 2**: 6 Triple. (Hit! Target advances to 7).
3.  **Throw 3**: 7 Double. (Hit! Target advances to 8).
    **Result**: Next turn target is **8**.

### Scenario 2: Missed Target

_Config: Singles, End: 20_
**State**: Target: 10
**Turn**:

1.  **Throw 1**: 12 Single. (Miss).
2.  **Throw 2**: 10 Single. (Hit! Target advances to 11).
3.  **Throw 3**: 12 Single. (Miss).
    **Result**: Next turn target is **11**.

### Scenario 3: Winning Turn

_Config: Singles, End: 20_
**State**: Target: 19
**Turn**:

1.  **Throw 1**: 19 Single. (Hit! Target advances to 20).
2.  **Throw 2**: 20 Single. (Hit! Target advances to End).
    **Result**: **WIN**. Game Over.

### Scenario 4: Doubles Mode Strictness

_Config: Doubles, End: 20_
**State**: Target: 5
**Turn**:

1.  **Throw 1**: 5 Single. (Miss - needs Double).
2.  **Throw 2**: 5 Triple. (Miss - needs Double).
3.  **Throw 3**: 5 Double. (Hit! Target advances to 6).
    **Result**: Next turn target is **6**.
