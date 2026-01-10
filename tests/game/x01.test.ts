// tests/game/x01.test.ts
import { beforeEach, describe, expect, it } from "vitest";

import { X01Game } from "@/lib/game/games/x01";
import { X01Config } from "@/types/models/darts";
import { createHits, createTestState, mockPlayer } from "./test-utils";

describe("X01Game Logic", () => {
    let game: X01Game;
    const defaultConfig: X01Config = {
        type: "x01",
        startScore: 501,
        inMode: "straight",
        outMode: "double",
        teamMode: "single",
    };

    beforeEach(() => {
        game = new X01Game();
    });

    describe("Initialization", () => {
        it("should initialize scores to startScore", () => {
            const config = { ...defaultConfig, startScore: 301 as const };
            const players = [mockPlayer("p1")];
            const partialState = game.init(config, players);

            expect(partialState.playerStates?.[0].score).toBe(301);
            expect(partialState.playerStates?.[0].stats).toEqual(
                expect.objectContaining({
                    ppd: 0,
                }),
            );
        });
    });

    describe("Scoring (Straight In)", () => {
        it("should subtract points from score", () => {
            const players = [mockPlayer("p1")];
            const state = createTestState(defaultConfig, players);
            // Manually set init state (GameEngine does this typically, but for unit test simulation we rely on init logic or pre-set)
            Object.assign(state, game.init(defaultConfig, players));

            // Throw T20 (60)
            const hits = createHits([[20, 3]]);
            const hit = hits[0];
            const throwResult = game.processThrow(state, hit);

            expect(throwResult.points).toBe(60);
            expect(throwResult.isBust).toBe(false);

            // Note: processThrow doesn't apply the score to state, GameEngine does.
            // But we can check internal logic via return
        });
    });

    // Docs: Scenario 1: Standard Win (Double Out)
    describe("Scenario 1: Standard Win (Double Out)", () => {
        it("should win on exact zero with double", () => {
            const players = [mockPlayer("p1")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            // Set score to 40
            state.playerStates[0].score = 40;

            // 1. Throw 20 Single -> Score 20
            let result = game.processThrow(state, { segment: 20, multiplier: 1 });
            expect(result.points).toBe(20);
            expect(result.isBust).toBe(false);
            expect(result.isWin).toBe(false);

            // 2. Throw 10 Double -> Score 0
            result = game.processThrow(state, { segment: 10, multiplier: 2 });
            expect(result.points).toBe(20);
            expect(result.isBust).toBe(false);
            expect(result.isWin).toBe(true);
        });
    });

    // Docs: Scenario 2: Bust (Score < 0)
    describe("Scenario 2: Bust (Score < 0)", () => {
        it("should bust if score goes negative", () => {
            const players = [mockPlayer("p1")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            // Start Score: 20
            state.playerStates[0].score = 20;

            // Throw 1: 20 Double (40). Score -20 -> BUST
            const result = game.processThrow(state, { segment: 20, multiplier: 2 });

            expect(result.isBust).toBe(true);
            expect(result.points).toBe(40); // Usually return points, engine handles revert? Yes, or points 0?
            // "The GameLogic calculates the result of that throw"
            // If isBust, points don't matter much for score, but for stats (PPD) they might count as 0 or full?
            // Usually bust throw counts as 0 points for the turn score effectively.
            // But let's assume it returns what happened.
        });
    });

    // Docs: Scenario 3: Bust (Score 1 in Double Out)
    describe("Scenario 3: Bust (Score 1 in Double Out)", () => {
        it("should bust if score becomes 1", () => {
            const players = [mockPlayer("p1")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            state.playerStates[0].score = 19;

            // Throw 1: 18 Single -> Score 1 -> BUST
            const result = game.processThrow(state, { segment: 18, multiplier: 1 });

            expect(result.isBust).toBe(true);
            expect(result.isWin).toBe(false);
        });
    });

    // Docs: Scenario 4: Invalid Finish (Single on Double Out)
    describe("Scenario 4: Invalid Finish (Single on Double Out)", () => {
        it("should bust if hitting 0 with Single", () => {
            const players = [mockPlayer("p1")];
            const state = createTestState(defaultConfig, players);
            Object.assign(state, game.init(defaultConfig, players));

            state.playerStates[0].score = 16;

            // Throw 1: 16 Single -> Score 0 -> BUST because not Double
            const result = game.processThrow(state, { segment: 16, multiplier: 1 });

            expect(result.isBust).toBe(true);
            expect(result.isWin).toBe(false);
        });
    });

    // Docs: Scenario 5: Double In (Valid Start)
    describe("Scenario 5: Double In", () => {
        it("should not score until double is hit", () => {
            const config = { ...defaultConfig, inMode: "double" as const, startScore: 301 as const };
            const players = [mockPlayer("p1")];
            const state = createTestState(config, players);
            Object.assign(state, game.init(config, players));

            // Throw 1: 20 Single (Invalid start)
            let result = game.processThrow(state, { segment: 20, multiplier: 1 });
            expect(result.points).toBe(0); // Should be 0 effective points?
            // Strictly speaking, X01 double in means score doesn't decrease.
            // So logic should return points 0 or handle state logic?
            // processThrow returns Throw. If points are 20 but score doesn't change,
            // logic needs to know if "doubled in" has happened.
            // We might need extra state in stats? Or just check if score == startScore?
            expect(result.isValid).toBe(false);

            // Throw 2: 20 Double (Valid start)
            result = game.processThrow(state, { segment: 20, multiplier: 2 });
            expect(result.points).toBe(40);
            expect(result.isValid).toBe(true);

            // Throw 3: 20 Single (Valid now)
            result = game.processThrow(state, { segment: 20, multiplier: 1 });
            expect(result.points).toBe(20);
            expect(result.isValid).toBe(true);
        });
    });
});
