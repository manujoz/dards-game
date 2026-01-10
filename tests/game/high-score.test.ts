import { HighScoreGame } from "@/lib/game/games/high-score";
import { GameState, HighScoreConfig, Player } from "@/types/models/darts";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestState, mockPlayer } from "./test-utils";

describe("High Score Game Logic", () => {
    let state: GameState;
    let game: HighScoreGame;
    const players: Player[] = [mockPlayer("p1")];
    const config: HighScoreConfig = {
        type: "high_score",
        teamMode: "single",
        rounds: 3,
    };

    beforeEach(() => {
        game = new HighScoreGame();
        state = createTestState(config, players);
        const partial = game.init(config, players);
        Object.assign(state, partial);
    });

    it("initializes score to 0", () => {
        expect(state.playerStates[0].score).toBe(0);
    });

    it("accumulates points correctly", () => {
        const result = game.processThrow(state, { segment: 20, multiplier: 3 });
        expect(result.points).toBe(60);
        expect(state.playerStates[0].score).toBe(60);
    });
});
