import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, Hit, Player, RoundTheClockConfig, RoundTheClockStats, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class RoundTheClockGame implements GameLogic {
    init(config: GameConfig, players: Player[]): Partial<GameState> {
        const rtcConfig = config as RoundTheClockConfig;
        return {
            playerStates: players.map((p) => ({
                playerId: p.id,
                score: rtcConfig.startNumber - 1,
                stats: {
                    target: rtcConfig.startNumber,
                } as RoundTheClockStats,
            })),
        };
    }

    processThrow(state: GameState, hit: Hit): Throw {
        const playerState = getCurrentPlayerState(state);
        const stats = playerState.stats as RoundTheClockStats;
        const config = state.config as RoundTheClockConfig;
        const target = stats.target;

        let isValid = false;
        let isWin = false;

        const isTargetHit = hit.segment === target;

        if (isTargetHit) {
            if (config.mode === "singles" && hit.multiplier >= 1) isValid = true;
            if (config.mode === "doubles" && hit.multiplier === 2) isValid = true;
            if (config.mode === "triples" && hit.multiplier === 3) isValid = true;
        }

        if (isValid) {
            let nextTarget = target + 1;
            const endNumber = config.endNumber;

            if (target === 20 && endNumber === 25) {
                nextTarget = 25;
            }

            if (target === endNumber) {
                isWin = true;
                state.winnerId = playerState.playerId;
                state.status = "completed";
            }

            stats.target = isWin ? target : nextTarget;
            playerState.score = target;
        }

        return {
            hit,
            points: isValid ? 1 : 0,
            isBust: false,
            isWin,
            isValid,
            timestamp: Date.now(),
        };
    }

    getScoreboard(state: GameState): Scoreboard {
        return {
            gameType: "round_the_clock",
            roundIndicator: `Round ${state.currentRound}`,
            headers: ["Target"],
            rows: state.playerStates.map((ps) => {
                const stats = ps.stats as RoundTheClockStats;
                const player = state.players.find((p) => p.id === ps.playerId)!;
                const isWinner = state.winnerId === ps.playerId;

                let displayTarget = isWinner ? "WIN" : stats.target.toString();
                if (stats.target === 25) displayTarget = "BULL";

                return {
                    playerId: ps.playerId,
                    playerName: player.name,
                    score: displayTarget,
                    active: state.currentPlayerId === ps.playerId,
                    details: [],
                };
            }),
        };
    }
}
