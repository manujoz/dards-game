import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, HighScoreConfig, Hit, Player, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class HighScoreGame implements GameLogic {
    init(config: GameConfig, players: Player[]): Partial<GameState> {
        return {
            playerStates: players.map((p) => ({
                playerId: p.id,
                score: 0,
                stats: {},
            })),
        };
    }

    processThrow(state: GameState, hit: Hit): Throw {
        const playerState = getCurrentPlayerState(state);

        const points = hit.segment * hit.multiplier;

        playerState.score += points;

        return {
            hit,
            points,
            isBust: false,
            isWin: false,
            isValid: true,
            timestamp: Date.now(),
        };
    }

    getScoreboard(state: GameState): Scoreboard {
        const config = state.config as HighScoreConfig;
        return {
            gameType: "high_score",
            roundIndicator: `Ronda ${state.currentRound}/${config.rounds || "?"}`,
            headers: ["Puntos"],
            rows: state.playerStates.map((ps) => {
                const player = state.players.find((p) => p.id === ps.playerId)!;
                return {
                    playerId: ps.playerId,
                    playerName: player.name,
                    score: ps.score,
                    active: state.currentPlayerId === ps.playerId,
                    details: [],
                };
            }),
        };
    }
}
