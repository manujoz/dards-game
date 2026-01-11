import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, Hit, Player, Scoreboard, ShanghaiConfig, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class ShanghaiGame implements GameLogic {
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
        const config = state.config as ShanghaiConfig;
        const startNum = config.startNumber || 1;

        const target = startNum + (state.currentRound - 1);

        let points = 0;
        let isValid = false;
        let isWin = false;

        if (hit.segment === target) {
            isValid = true;
            points = hit.segment * hit.multiplier;
        }

        if (isValid) {
            playerState.score += points;

            const currentTurnHits = state.currentTurn.throws.map((t) => t.hit).filter((h) => h.segment === target);

            const allMultipliers = new Set(currentTurnHits.map((h) => h.multiplier));
            allMultipliers.add(hit.multiplier);

            if (allMultipliers.has(1) && allMultipliers.has(2) && allMultipliers.has(3)) {
                isWin = true;
                state.winnerId = playerState.playerId;
                state.status = "completed";
            }
        }

        return {
            hit,
            points,
            isBust: false,
            isWin,
            isValid,
            timestamp: Date.now(),
        };
    }

    getScoreboard(state: GameState): Scoreboard {
        const config = state.config as ShanghaiConfig;
        const startNum = config.startNumber || 1;
        const currentTarget = startNum + (state.currentRound - 1);

        return {
            gameType: "shanghai",
            roundIndicator: `Ronda ${state.currentRound}/${config.rounds} (Objetivo: ${currentTarget})`,
            headers: ["Puntos"],
            rows: state.playerStates.map((ps) => {
                const player = state.players.find((p) => p.id === ps.playerId)!;
                const isWinner = state.winnerId === ps.playerId;
                return {
                    playerId: ps.playerId,
                    playerName: player.name,
                    score: isWinner ? "GANÓ" : ps.score,
                    active: state.currentPlayerId === ps.playerId,
                    details: [],
                };
            }),
        };
    }
}
