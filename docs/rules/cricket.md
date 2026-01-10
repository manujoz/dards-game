# Cricket Rules

## Overview

A game of territory and control. Players focus on hitting specific numbers (15, 16, 17, 18, 19, 20, Bull) to "close" them and score points.

## Configuration

-   **Numbers**: 15, 16, 17, 18, 19, 20, Bull (Default).
-   **Mode**:
    -   **Standard** (Default): Points are good. You score on closed numbers if opponents haven't closed them.
    -   **Cut-Throat**: Points are bad. Scored points are added to opponents who haven't closed the number.

## Scoring

-   **Targets**: Only hits on 15, 16, 17, 18, 19, 20, and Bull count. Other hits are misses.
-   **Marks**:
    -   Single: 1 mark
    -   Double: 2 marks
    -   Triple: 3 marks (Inner Bull = 2 marks, Outer Bull = 1 mark)
-   **Closing**: A number is "Open" for a player once they accumulate 3 marks on it.
-   **Points (Standard)**: Once a player Opens a number, subsequent hits on that number score points (Value * Multiplier) *only if\* the number is not yet Closed by all opponents using the scoring/penalty logic.
    -   Once all players have Closed a number, no further points can be scored on it.

## Win Conditions

-   **Standard**: The player who has Closed all numbers AND has the highest (or equal highest) score wins.
    -   If a player closes all numbers but trails in points, they must continue scoring on numbers that are still open for opponents until they catch up in points.

## Edge Cases

-   **Over-hitting**: If a Triple is hit on a number with 2 marks already:
    -   1 mark completes the closure.
    -   The remaining 2 "hits" are used for scoring (if eligible).

## Canonical Scenarios (Golden)

### Scenario 1: Opening and Scoring

_Config: Standard_
**State**: Player A has 0 marks on 20. Opponent B has 0 marks on 20.
**Turn**:

1.  **Throw 1**: 20 Triple. (Marks: 3. Status: 20 Open for A. Points: 0).
2.  **Throw 2**: 20 Single. (Status: A has 20 Open, B not closed. Points: +20).
3.  **Throw 3**: 19 Double. (Marks on 19: 2).
    **Result**: A: 20 (Open), 19 (2 marks), Score: 20.

### Scenario 2: Scoring on Opponent (Standard)

_Config: Standard_
**State**: Player A has 20 Open. Player B has 20 Closed (3 marks).
**Turn (Player A)**:

1.  **Throw 1**: 20 Triple.
    **Analysis**: A has 20 Open. B has 20 Closed. Number is "dead" (closed by all).
    **Result**: 0 Points. No change in state.

### Scenario 3: Cut-Throat Scoring

_Config: Cut-Throat_
**State**: Player A has 20 Open. Player B has 0 marks on 20.
**Turn (Player A)**:

1.  **Throw 1**: 20 Single.
    **Analysis**: A is Open. B is not Closed. Points go to B.
    **Result**: A: No change. B: Score +20.

### Scenario 4: Winning Condition check

_Config: Standard_
**State**: - Player A: All numbers closed except Bull. Score: 200. - Player B: All numbers closed. Score: 180.
**Turn (Player A)**:

1.  **Throw 1**: Bull Single. (Marks: 1).
2.  **Throw 2**: Bull Double. (Marks: 3 -> Bull Closed).
    **Analysis**: A has now closed all numbers. A's score (200) >= B's score (180).
    **Result**: **WIN** for Player A.

### Scenario 5: Point Catch-up

_Config: Standard_
**State**: - Player A: All closed. Score 100. - Player B: All closed except 20 (Open for B). Score 200.
**Turn (Player A)**:

1.  **Throw 1**: 20 Triple.
    **Analysis**: A is closed. B is NOT closed (B needs to close it, but usually if A is done, A wins? No, A needs points). Wait, in standard cricket, if A closes everything but is behind on points, A must score on whatever B has open. - Clarification: If A has closed everything, but B has higher score. A cannot win yet. A must score on numbers B has NOT closed. - In this state, B has 20 OPEN (meaning B has >3 marks? No, "Open for B" means B has 3 marks? Usually "Open" means available to score. "Closed" means 3 marks reached. - Let's clarify terminology: - "Closed for Player": Player has 3 marks. - "Closed for Board": All players have 3 marks. - State correction: - Player A: All "Closed for Player". Score 100. - Player B: All "Closed for Player" EXCEPT 20 (B has < 3 marks). Score 200. - Board status: 20 is NOT "Closed for Board". A can score on it.
    **Turn (Player A)**:
1.  **Throw 1**: 20 Triple.
    **Result**: A scores 60 points. Total 160. Still trailing 200. Game continues.
