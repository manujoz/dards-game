/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { GameEngine } from "../../src/lib/game/game-engine";
import { Player, Throw, X01Config } from "../../src/types/models/darts";

describe("GameEngine", () => {
    const mockPlayers: Player[] = [
        { id: "p1", name: "Player 1" },
        { id: "p2", name: "Player 2" },
    ];

    const mockConfig: X01Config = {
        type: "x01",
        startScore: 501,
        inMode: "straight",
        outMode: "double",
        teamMode: "single",
    };

    const mockThrow: Throw = {
        hit: { segment: 20, multiplier: 1 },
        points: 20,
        isBust: false,
        isWin: false,
        isValid: true,
        timestamp: 123456789,
    };

    describe("init", () => {
        it("should initialize game state correctly", () => {
            const state = GameEngine.init(mockPlayers, mockConfig);
            expect(state.status).toBe("active");
            expect(state.players).toHaveLength(2);
            expect(state.playerStates).toHaveLength(2);
            expect(state.playerStates[0].score).toBe(501);
            expect(state.currentRound).toBe(1);
            expect(state.currentPlayerId).toBe("p1");
            expect(state.history).toHaveLength(0);
            expect(state.currentTurn.throws).toHaveLength(0);
        });

        it("should throw error with no players", () => {
            expect(() => GameEngine.init([], mockConfig)).toThrow();
        });
    });

    describe("nextTurn", () => {
        it("should rotate players", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            state = GameEngine.nextTurn(state);

            expect(state.currentPlayerId).toBe("p2");
            expect(state.currentRound).toBe(1);
            expect(state.history).toHaveLength(1);
            expect(state.history[0].playerId).toBe("p1");
        });

        it("should increment round after last player", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            // P1 -> P2
            state = GameEngine.nextTurn(state);
            // P2 -> P1 (Round 2)
            state = GameEngine.nextTurn(state);

            expect(state.currentPlayerId).toBe("p1");
            expect(state.currentRound).toBe(2);
            expect(state.history).toHaveLength(2);
        });
    });

    describe("addThrow", () => {
        it("should add throw to current turn", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            state = GameEngine.addThrow(state, mockThrow);

            expect(state.currentTurn.throws).toHaveLength(1);
            expect(state.currentTurn.throws[0]).toEqual(mockThrow);
        });

        it("should handle bust", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            const bustThrow = { ...mockThrow, isBust: true };
            state = GameEngine.addThrow(state, bustThrow);

            expect(state.currentTurn.isBust).toBe(true);
            expect(state.currentTurn.endScore).toBe(state.currentTurn.startScore);
        });

        it("should handle win", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            const winThrow = { ...mockThrow, isWin: true };
            state = GameEngine.addThrow(state, winThrow);

            expect(state.status).toBe("completed");
            expect(state.winnerId).toBe("p1");
        });
    });

    describe("undo", () => {
        it("should remove last throw in current turn", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            state = GameEngine.addThrow(state, mockThrow);
            state = GameEngine.addThrow(state, { ...mockThrow, points: 60 });

            expect(state.currentTurn.throws).toHaveLength(2);

            state = GameEngine.undo(state);
            expect(state.currentTurn.throws).toHaveLength(1);
            expect(state.currentTurn.throws[0].points).toBe(20);
        });

        it("should go back to previous turn if current is empty", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            // P1 throws one dart
            state = GameEngine.addThrow(state, mockThrow);
            // P1 finishes turn (prematurely for test, or normally)
            state = GameEngine.nextTurn(state);

            // Now P2, Turn 1, Empty
            expect(state.currentPlayerId).toBe("p2");
            expect(state.history).toHaveLength(1);

            state = GameEngine.undo(state);

            // Should be P1 again
            expect(state.currentPlayerId).toBe("p1");
            // History popped
            expect(state.history).toHaveLength(0);
            // Combined Undo: Should have also removed the LAST throw of that turn
            // P1 had 1 throw. Undo should restore P1 and remove that 1 throw -> empty.
            expect(state.currentTurn.throws).toHaveLength(0);
        });

        it("should handle crossing round boundaries", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            // P1 finish
            state = GameEngine.nextTurn(state);
            // P2 finish
            state = GameEngine.nextTurn(state);

            // Now P1, Round 2
            expect(state.currentRound).toBe(2);

            state = GameEngine.undo(state);

            // Back to P2, Round 1
            expect(state.currentPlayerId).toBe("p2");
            expect(state.currentRound).toBe(1);
        });
    });

    describe("isTurnComplete", () => {
        it("should be true on 3 throws", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            state = GameEngine.addThrow(state, mockThrow);
            state = GameEngine.addThrow(state, mockThrow);
            expect(GameEngine.isTurnComplete(state)).toBe(false);

            state = GameEngine.addThrow(state, mockThrow);
            expect(GameEngine.isTurnComplete(state)).toBe(true);
        });

        it("should be true on bust", () => {
            let state = GameEngine.init(mockPlayers, mockConfig);
            state = GameEngine.addThrow(state, { ...mockThrow, isBust: true });
            expect(GameEngine.isTurnComplete(state)).toBe(true);
        });
    });

    describe("reconstructState", () => {
        it("should reconstruct state from history", () => {
            // Turn 1 P1
            const t1: any = {
                playerId: "p1",
                roundIndex: 1,
                throws: [mockThrow, mockThrow, mockThrow],
                startScore: 501,
                endScore: 441, // 501 - 60
                isBust: false,
            };

            // Turn 1 P2
            const t2: any = {
                playerId: "p2",
                roundIndex: 1,
                throws: [mockThrow, mockThrow, mockThrow],
                startScore: 501,
                endScore: 441,
                isBust: false,
            };

            const history = [t1, t2];

            const state = GameEngine.reconstructState(history, mockConfig, mockPlayers);

            // Expect state to be: Round 2, P1 next
            expect(state.currentRound).toBe(2);
            expect(state.currentPlayerId).toBe("p1");
            expect(state.history).toHaveLength(2);
            expect(state.currentTurn.throws).toHaveLength(0);

            // Expect scores to be updated from history
            const p1State = state.playerStates.find((p) => p.playerId === "p1");
            const p2State = state.playerStates.find((p) => p.playerId === "p2");

            expect(p1State?.score).toBe(441);
            expect(p2State?.score).toBe(441);

            // Expect current turn start score to be correct (P1 starts Round 2 with 441)
            expect(state.currentTurn.startScore).toBe(441);
        });

        it("should handle empty history", () => {
            const state = GameEngine.reconstructState([], mockConfig, mockPlayers);
            expect(state.currentRound).toBe(1);
            expect(state.history).toHaveLength(0);
        });
    });
});
