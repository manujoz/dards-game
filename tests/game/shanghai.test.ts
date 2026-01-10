import { ShanghaiGame } from "@/lib/game/games/shanghai";
import { GameState, Hit, Player, ShanghaiConfig } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("Shanghai Game Logic", () => {
    let state: GameState;
    let game: ShanghaiGame;
    const players: Player[] = [mockPlayer("p1")];
    const config: ShanghaiConfig = {
        type: "shanghai",
        teamMode: "single",
        rounds: 7,
        startNumber: 1,
    };

    beforeEach(() => {
        game = new ShanghaiGame();
        state = createTestState(config, players);
        const partial = game.init(config, players);
        Object.assign(state, partial);
    });

    it("scores points only on valid target", () => {
        const result = game.processThrow(state, { segment: 1, multiplier: 3 });
        expect(result.points).toBe(3);
    });

    it("detects Shanghai instant win", () => {
        const hit1: Hit = { segment: 1, multiplier: 1 };
        const t1 = game.processThrow(state, hit1);
        state.currentTurn.throws.push(t1);

        const hit2: Hit = { segment: 1, multiplier: 2 };
        const t2 = game.processThrow(state, hit2);
        state.currentTurn.throws.push(t2);

        const hit3: Hit = { segment: 1, multiplier: 3 };
        const t3 = game.processThrow(state, hit3);

        expect(t3.isWin).toBe(true);
    });
});
