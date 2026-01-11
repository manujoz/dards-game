import { RoundTheClockGame } from "@/lib/game/games/round-the-clock";
import { GameState, Player, RoundTheClockConfig, RoundTheClockStats } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("Round The Clock Game Logic", () => {
    let state: GameState;
    let game: RoundTheClockGame;
    const players: Player[] = [mockPlayer("p1"), mockPlayer("p2")];
    const config: RoundTheClockConfig = {
        type: "round_the_clock",
        teamMode: "single",
        mode: "singles",
        startNumber: 1,
        endNumber: 5,
    };

    beforeEach(() => {
        game = new RoundTheClockGame();
        state = createTestState(config, players);
        const partial = game.init(config, players);
        Object.assign(state, { ...partial, playerStates: partial.playerStates });
    });

    it("does not crash when stats are empty (scoreboard)", () => {
        const configWithoutInit: RoundTheClockConfig = {
            ...config,
            startNumber: 3,
            endNumber: 5,
        };

        const stateWithoutInit = createTestState(configWithoutInit, players);
        const scoreboard = game.getScoreboard(stateWithoutInit);

        expect(scoreboard.rows[0].score).toBe("3");
    });

    it("does not crash when stats are empty (processThrow)", () => {
        const configWithoutInit: RoundTheClockConfig = {
            ...config,
            startNumber: 3,
            endNumber: 5,
        };

        const stateWithoutInit = createTestState(configWithoutInit, players);
        const result = game.processThrow(stateWithoutInit, { segment: 3, multiplier: 1 });

        expect(result.isValid).toBe(true);
        const p1Stats = stateWithoutInit.playerStates[0].stats as RoundTheClockStats;
        expect(p1Stats.target).toBe(4);
    });

    it("does not crash when config is incomplete (no start/end)", () => {
        const incompleteConfig = {
            type: "round_the_clock",
            teamMode: "single",
            mode: "singles",
        } as unknown as RoundTheClockConfig;

        const stateWithoutInit = createTestState(incompleteConfig, players);
        const scoreboard = game.getScoreboard(stateWithoutInit);

        expect(scoreboard.rows[0].score).toBe("1");
    });

    it("initializes with target 1", () => {
        const p1Stats = state.playerStates[0].stats as RoundTheClockStats;
        expect(p1Stats.target).toBe(1);
    });

    it("advances target on valid hit", () => {
        const result = game.processThrow(state, { segment: 1, multiplier: 1 });
        expect(result.isValid).toBe(true);
        const p1Stats = state.playerStates[0].stats as RoundTheClockStats;
        expect(p1Stats.target).toBe(2);
    });
});
