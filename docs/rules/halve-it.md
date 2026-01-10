# Halve-It Rules

## Overview

A high-stakes game where players attempt to hit specific targets in each round. Failing to hit the target at least once results in the player's total score being cut in half.

## Configuration

-   **Targets Sequence**: Standard (Default).
    -   Example Sequence: 20, 16, Double 7, 14, 18, Triple 10, Bull. (Just an example, v1 will have a fixed or selectable list).
    -   v1 Default: 20, 19, 18, 17, 16, 15, Bull. (Simplified like Cricket but Halve-it rules? Or classic Halve-it mix?).
    -   Let's define v1 Default based on classic: **20, 16, double 7, 14, 18, triple 10, bull**.

## Scoring

-   **Initial Score**: 0 (or sometimes a base like 40 to avoid early 0s, v1 starts at 0).
-   **Turn mechanics**:
    -   The player throws 3 darts at the current round's Target.
    -   **Success**: If _at least one_ dart hits the Target (matching segment and constraint like Double/Triple):
        -   The points for _all valid hits_ are added to the total score.
        -   (Points = Value \* Multiplier).
    -   **Failure**: If _none_ of the 3 darts hit the Target:
        -   The current Total Score is **Halved**.
        -   Integer division (Floor). Example: 35 / 2 = 17.

## Win Conditions

-   Highest score after completing the full sequence of targets.

## Edge Cases

-   **Zero Score**: Halving 0 results in 0.
-   **Wrong Target**: Hitting 19 when target is 20 counts as 0 points and does not count as a "Success".

## Canonical Scenarios (Golden)

### Scenario 1: Success

_Config: Standard. Target: 20._
**State**: Score: 100.
**Turn**:

1.  **Throw 1**: 20 Single. (Hit. Accum points: 20).
2.  **Throw 2**: 18 Single. (Miss target).
3.  **Throw 3**: 20 Triple. (Hit. Accum points: 60).
    **Result**: Target hit at least once. Score = 100 + 20 + 60 = **180**.

### Scenario 2: Failure (Halve)

_Config: Standard. Target: Double 7._
**State**: Score: 50.
**Turn**:

1.  **Throw 1**: 7 Single. (Miss constraint - needs Double).
2.  **Throw 2**: 19 Double. (Miss target).
3.  **Throw 3**: 7 Single. (Miss constraint).
    **Result**: Target missed completely. Score = floor(50 / 2) = **25**.

### Scenario 3: Zero handling

_Config: Standard. Target: Bull._
**State**: Score: 0.
**Turn**:

1.  **Throw 1**: 20. (Miss).
2.  **Throw 2**: 20. (Miss).
3.  **Throw 3**: 20. (Miss).
    **Result**: Score = floor(0 / 2) = **0**.
