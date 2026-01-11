import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, Hit, Player, RoundTheClockConfig, RoundTheClockStats, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

function ensureRoundTheClockStats(state: GameState, playerState: { score: number; stats: unknown }): RoundTheClockStats {
    const config = state.config as Partial<RoundTheClockConfig>;
    const startNumber = typeof config.startNumber === "number" ? config.startNumber : 1;
    const endNumber = typeof config.endNumber === "number" ? config.endNumber : 25;

    const rawStats = (playerState.stats ?? {}) as Partial<RoundTheClockStats>;
    const existingTarget = typeof rawStats.target === "number" ? rawStats.target : undefined;

    let target = existingTarget;
    if (target === undefined) {
        // Prefer config default when we don't have game-specific init applied.
        target = startNumber;

        // If score seems meaningful, try to infer the next target from it.
        if (typeof playerState.score === "number" && playerState.score > 0) {
            target = playerState.score + 1;
        }

        // Special case: after 20, some configs go to Bull (25).
        if (playerState.score === 20 && endNumber === 25) {
            target = 25;
        }

        // Clamp to endNumber to avoid weird UI values if the persisted state is inconsistent.
        target = Math.min(target, endNumber);
    }

    const normalized: RoundTheClockStats = {
        ...rawStats,
        target,
    };

    playerState.stats = normalized;
    return normalized;
}

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
        const stats = ensureRoundTheClockStats(state, playerState);
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
            roundIndicator: `Ronda ${state.currentRound}`,
            headers: ["Objetivo"],
            rows: state.playerStates.map((ps) => {
                const stats = ensureRoundTheClockStats(state, ps);
                const player = state.players.find((p) => p.id === ps.playerId)!;
                const isWinner = state.winnerId === ps.playerId;

                let displayTarget = isWinner ? "GANÓ" : stats.target.toString();
                if (stats.target === 25) displayTarget = "CENTRO";

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
