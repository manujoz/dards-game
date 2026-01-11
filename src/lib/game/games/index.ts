import { GameId } from "@/types/models/darts";
import { CricketGame } from "./cricket";
import { HalveItGame } from "./halve-it";
import { HighScoreGame } from "./high-score";
import { GameLogic } from "./interface";
import { KillerGame } from "./killer";
import { RoundTheClockGame } from "./round-the-clock";
import { ShanghaiGame } from "./shanghai";
import { X01Game } from "./x01";

export const GAMES: Partial<Record<GameId, new () => GameLogic>> = {
    x01: X01Game,
    cricket: CricketGame,
    round_the_clock: RoundTheClockGame,
    high_score: HighScoreGame,
    shanghai: ShanghaiGame,
    killer: KillerGame,
    halve_it: HalveItGame,
};

export function getGameLogic(id: GameId): GameLogic {
    const GameClass = GAMES[id];
    if (!GameClass) {
        throw new Error(`No hay lógica de juego implementada para ${id}`);
    }
    return new GameClass();
}
