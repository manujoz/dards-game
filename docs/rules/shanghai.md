# Shanghai Rules

## Overview

Players score as many points as possible on the active number for the round. There is also an instant-win condition called a "Shanghai".

## Configuration

-   **Rounds**: 1-7 (default) or 1-20.
-   **Numbers**: Round 1 = Number 1, Round 2 = Number 2, ... Round 7 = Number 7.

## Scoring

-   **Active Target**: Only hits on the number corresponding to the current round count.
    -   E.g., Round 3: Only hits on "3" count.
    -   Misses score 0.
-   **Points**: Value \* Multiplier. Added to total score.

## Win Conditions

1.  **High Score**: After all rounds, the player with the highest score wins.
2.  **Shanghai (Instant Win)**: If a player hits a Single, a Double, AND a Triple of the active number in the _same turn_. The game ends immediately, and that player wins regardless of score.

## Edge Cases

-   **Last Round Advantage**: If Player 1 finishes round 7 with 50 points, Player 2 can still win by scoring > 50 points or hitting a Shanghai.
-   **Shanghai Sequence**: Order (S-D-T, T-S-D, etc.) doesn't matter, just need one of each on the specific active number.

## Canonical Scenarios (Golden)

### Scenario 1: Standard Scoring

_Config: 7 Rounds_
**State**: Round 2 (Target: 2). Score: 10.
**Turn**:

1.  **Throw 1**: 2 Triple. (+6)
2.  **Throw 2**: 2 Single. (+2)
3.  **Throw 3**: 19 Single. (Miss/0 points - wrong number).
    **Result**: Score becomes **18**. Advance to Round 3.

### Scenario 2: The Shanghai (Instant Win)

_Config: 7 Rounds_.
**State**: Round 5 (Target: 5). Player is losing 20-100.
**Turn**:

1.  **Throw 1**: 5 Single.
2.  **Throw 2**: 5 Triple.
3.  **Throw 3**: 5 Double.
    **Result**: Player hits Single, Triple, Double of active number. **SHANGHAI WIN**. Game Over.

### Scenario 3: Failed Shanghai

_Config: 7 Rounds_.
**State**: Round 4 (Target: 4).
**Turn**:

1.  **Throw 1**: 4 Single.
2.  **Throw 2**: 4 Double.
3.  **Throw 3**: 4 Single. (Duplicate Single).
    **Result**: Not a Shanghai. Points: 4 + 8 + 4 = 16 points added. Game continues.
