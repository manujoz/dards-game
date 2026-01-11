import { CricketGame } from "@/lib/game/games/cricket";
import type { CricketConfig, CricketPlayerStats } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("CricketGame Logic", () => {
    let game: CricketGame;
    const defaultConfig: CricketConfig = {
        type: "cricket",
        mode: "standard", // default
        numbers: [20, 19, 18, 17, 16, 15, 25],
        teamMode: "single",
    };

    beforeEach(() => {
        game = new CricketGame();
    });

    describe("Initialization", () => {
        it("should initialize stats for tracked numbers", () => {
            const players = [mockPlayer("p1")];
            const partialState = game.init(defaultConfig, players);
            const stats = partialState.playerStates?.[0].stats as unknown as CricketPlayerStats;

            expect(stats.score).toBe(0);
            expect(stats.marks).toEqual({});
            expect(stats.closedNumbers).toEqual([]);
        });
    });

    describe("Regression: runtime state without game.init", () => {
        it("should not crash when player stats are empty", () => {
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(defaultConfig, players);

            // GameEngine.init creates playerStates with stats: {}.
            // CricketGame must tolerate this shape (runtime loader path) and normalize it.
            expect(() => game.processThrow(state, { segment: 20, multiplier: 1 })).not.toThrow();

            const psA = state.playerStates[0];
            const statsA = psA.stats as unknown as CricketPlayerStats;

            expect(typeof statsA.marks).toBe("object");
            expect(statsA.marks[20]).toBe(1);
        });

        it("should not crash rendering scoreboard when player stats are empty", () => {
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(defaultConfig, players);

            expect(() => game.getScoreboard(state)).not.toThrow();

            const scoreboard = game.getScoreboard(state);
            expect(scoreboard.rows).toHaveLength(2);
            expect(scoreboard.rows[0].marks).toBeDefined();
        });
    });

    // Docs: Scenario 1: Opening and Scoring
    describe("Scenario 1: Opening and Scoring (Standard)", () => {
        it("should open numbers and score", () => {
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            // A throws T20
            // Marks: 3. Status: 20 Open for A. Points: 0 (since B hasn't closed it? No, points start incrementing AFTER opened)
            // Rule: "Once a player Opens a number, subsequent hits on that number score points"
            // Does the opening hit (Triple) count as score if it exceeds 3?
            // "Over-hitting: If a Triple is hit on a number with 2 marks already: 1 mark completes closure, remaining 2 used for scoring".
            // So T20 on 0 marks: 3 marks exactly. No points.

            let result = game.processThrow(state, { segment: 20, multiplier: 3 });
            const psA = state.playerStates[0];
            const statsA = psA.stats as unknown as CricketPlayerStats;

            expect(statsA.marks[20]).toBe(3);
            expect(statsA.closedNumbers).toContain(20);
            expect(result.points).toBe(0); // Just closed

            // A throws Single 20
            // A has 20 Open. B has 0 marks. B not closed.
            // Points: +20
            result = game.processThrow(state, { segment: 20, multiplier: 1 });
            expect(result.points).toBe(20);
            expect(psA.score).toBe(20);

            // A throws 19 Double
            result = game.processThrow(state, { segment: 19, multiplier: 2 });
            expect(statsA.marks[19]).toBe(2);
            expect(statsA.closedNumbers).not.toContain(19);
            expect(result.points).toBe(0);
        });
    });

    // Docs: Scenario 2: Scoring on Opponent (Standard)
    describe("Scenario 2: Scoring on Opponent (Standard)", () => {
        it("should not score if opponent is closed", () => {
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            // Setup: A Open on 20, B Closed on 20
            const psA = state.playerStates[0];
            const psB = state.playerStates[1];
            const statsA = psA.stats as unknown as CricketPlayerStats;
            const statsB = psB.stats as unknown as CricketPlayerStats;

            statsA.marks[20] = 3;
            statsA.closedNumbers.push(20);

            statsB.marks[20] = 3;
            statsB.closedNumbers.push(20);

            // A throws T20
            // Both closed. Number is dead. 0 Points.
            const result = game.processThrow(state, { segment: 20, multiplier: 3 });
            expect(result.points).toBe(0);
            expect(psA.score).toBe(0); // Score didn't change (assuming 0 start)
        });
    });

    // Docs: Scenario 3: Cut-Throat Scoring
    describe("Scenario 3: Cut-Throat Scoring", () => {
        it("should add points to opponent in Cut-Throat", () => {
            const config: CricketConfig = { ...defaultConfig, mode: "cut_throat" };
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(config, players);
            Object.assign(state, game.init(config, players));

            // A has 20 Open. B has 0 marks.
            const psA = state.playerStates[0];
            const psB = state.playerStates[1];
            const statsA = psA.stats as unknown as CricketPlayerStats;
            statsA.marks[20] = 3;
            statsA.closedNumbers.push(20); // A Closed

            // A throws Single 20
            // Points (20) go to B (since B not closed)
            const result = game.processThrow(state, { segment: 20, multiplier: 1 });

            expect(result.points).toBe(20); // The throw has value 20
            expect(psA.score).toBe(0); // A gets nothing
            expect(psB.score).toBe(20); // B gets points (Bad in Cut-Throat, but score tracks generic points)
            // Wait, Cut-Throat: "Points Scored are added to opponents".
            // So result.points = 20. Logic must update `state` correctly.
        });
    });

    // Docs: Scenario 4: Win Condition
    describe("Scenario 4: Win Condition", () => {
        it("should win if all closed and highest score", () => {
            const players = [mockPlayer("A"), mockPlayer("B")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            const psA = state.playerStates[0];
            const statsA = psA.stats as unknown as CricketPlayerStats;
            psA.score = 200;
            // Close everything except Bull (25)
            [20, 19, 18, 17, 16, 15].forEach((n) => {
                statsA.marks[n] = 3;
                statsA.closedNumbers.push(n);
            });

            const psB = state.playerStates[1];
            psB.score = 180;
            const statsB = psB.stats as unknown as CricketPlayerStats;
            // B fully closed?
            // Docs: "Player B: All numbers closed."
            [20, 19, 18, 17, 16, 15, 25].forEach((n) => {
                statsB.marks[n] = 3;
                statsB.closedNumbers.push(n);
            });

            // A throws Bull Single
            let result = game.processThrow(state, { segment: 25, multiplier: 1 });
            expect(statsA.marks[25]).toBe(1);
            expect(result.isWin).toBe(false);

            // A throws Bull Double
            // Marks 1 -> 3. Bull closed. All closed. Score 200 >= 180. Win.
            result = game.processThrow(state, { segment: 25, multiplier: 2 });
            expect(statsA.marks[25]).toBe(3);
            expect(statsA.closedNumbers).toContain(25);
            expect(result.isWin).toBe(true);
        });
    });
});
