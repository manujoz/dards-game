# High Score Rules

## Overview

Simple score accumulation. Players try to get the highest total score over a fixed number of rounds (or until a target score is reached, though fixed rounds is default).

## Configuration

-   **Rounds**: Fixed number of rounds (default 7).
-   **Target Score**: Optional cap (e.g., 1000). (Likely not in v1 MVP default, sticking to Rounds).

## Scoring

-   **Input**: Any segment.
-   **Value**: Segment \* Multiplier.
-   **Accumulation**: Score starts at 0 and increases.

## Win Conditions

-   **End of Rounds**: After the defined number of rounds are completed, the player with the highest score wins.
-   **Tie**: If scores are tied, usually a tie-break throw (closest to bull) or extra round is played. For v1: Draw or Extra Round (1 round). _Decision: Draw._

## Edge Cases

-   **Bounce outs**: 0 points.

## Canonical Scenarios (Golden)

### Scenario 1: Standard Scoring

_Config: 7 Rounds_
**State**: Score: 100. Round 3.
**Turn**:

1.  **Throw 1**: 20 Triple. (+60)
2.  **Throw 2**: 20 Single. (+20)
3.  **Throw 3**: 1 Single. (+1)
    **Result**: Score becomes **181**.

### Scenario 2: End Game

_Config: 7 Rounds. 2 Players._
**State**: - P1: 300 (Finished 7 rounds). - P2: 250 (Start of Round 7).
**Turn (P2)**:

1.  **Throw 1**: 20 Triple. (310).
2.  **Throw 2**: 20 Single. (330).
3.  **Throw 3**: 10 Double. (350).
    **Result**: P2 finishes with 350. P1 has 300. **P2 WINS**.
