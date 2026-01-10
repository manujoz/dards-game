import { HalveItGame } from "@/lib/game/games/halve-it";
import { GameState, HalveItConfig, Player } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("Halve-It Game Logic", () => {
    let state: GameState;
    let game: HalveItGame;
    const players: Player[] = [mockPlayer("p1")];
    const config: HalveItConfig = {
        type: "halve_it",
        teamMode: "single",
        targets: ["20", "D7", "25"],
    };

    beforeEach(() => {
        game = new HalveItGame();
        state = createTestState(config, players);
        const partial = game.init(config, players);
        Object.assign(state, partial);
        state.playerStates[0].score = 40;
    });

    it("adds points on hitting target", () => {
        const result = game.processThrow(state, { segment: 20, multiplier: 1 });
        expect(result.isValid).toBe(true);
        expect(result.points).toBe(20);
        state.currentTurn.throws.push(result);
    });

    it("halves score if all 3 throws miss", () => {
        const res1 = game.processThrow(state, { segment: 1, multiplier: 1 });
        state.currentTurn.throws.push(res1);

        const res2 = game.processThrow(state, { segment: 1, multiplier: 1 });
        state.currentTurn.throws.push(res2);

        const res3 = game.processThrow(state, { segment: 1, multiplier: 1 });

        expect(res3.points).toBe(-20);
    });
});
