import { KillerGame } from "@/lib/game/games/killer";
import { GameState, KillerConfig, KillerStats, Player } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("Killer Game Logic", () => {
    let state: GameState;
    let game: KillerGame;
    const players: Player[] = [mockPlayer("p1"), mockPlayer("p2")];
    const config: KillerConfig = {
        type: "killer",
        teamMode: "single",
        lives: 3,
        perPlayerLives: true,
        selfSuicide: false,
    };

    beforeEach(() => {
        game = new KillerGame();
        state = createTestState(config, players);
        const partial = game.init(config, players);
        Object.assign(state, { ...partial, playerStates: partial.playerStates });
    });

    it("assigns unique numbers on init", () => {
        const p1Stats = state.playerStates[0].stats as KillerStats;
        expect(p1Stats.assignedNumber).toBeDefined();
    });

    it("becomes killer by hitting own double", () => {
        const p1Stats = state.playerStates[0].stats as KillerStats;
        const num = p1Stats.assignedNumber;

        const result = game.processThrow(state, { segment: num, multiplier: 2 });
        expect(result.isValid).toBe(true);
        expect(p1Stats.isKiller).toBe(true);
    });
});
