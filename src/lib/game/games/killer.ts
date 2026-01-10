import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, Hit, KillerConfig, KillerStats, Player, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class KillerGame implements GameLogic {
    init(config: GameConfig, players: Player[]): Partial<GameState> {
        const kConfig = config as KillerConfig;
        const assignedNumbers = new Set<number>();
        const generateUnique = (): number => {
            let n: number;
            do {
                n = Math.floor(Math.random() * 20) + 1;
            } while (assignedNumbers.has(n));
            assignedNumbers.add(n);
            return n;
        };

        return {
            playerStates: players.map((p) => ({
                playerId: p.id,
                score: kConfig.lives,
                stats: {
                    lives: kConfig.lives,
                    isKiller: false,
                    assignedNumber: generateUnique(),
                } as KillerStats,
            })),
        };
    }

    processThrow(state: GameState, hit: Hit): Throw {
        const playerState = getCurrentPlayerState(state);
        const stats = playerState.stats as KillerStats;
        const config = state.config as KillerConfig;

        const points = 0;
        let isValid = false;
        let isWin = false;

        if (!stats.isKiller) {
            if (hit.segment === stats.assignedNumber && hit.multiplier === 2) {
                stats.isKiller = true;
                isValid = true;
            }
        } else {
            const victims = state.playerStates.filter((ps) => {
                const psStats = ps.stats as KillerStats;
                return psStats.assignedNumber === hit.segment && ps.playerId !== playerState.playerId;
            });

            if (victims.length > 0) {
                isValid = true;
                const damage = hit.multiplier;

                victims.forEach((victim) => {
                    const vStats = victim.stats as KillerStats;
                    if (vStats.lives > 0) {
                        vStats.lives -= damage;
                        victim.score = vStats.lives;
                    }
                });
            } else if (hit.segment === stats.assignedNumber && config.selfSuicide) {
                stats.lives -= hit.multiplier;
                playerState.score = stats.lives;
                isValid = true;
            }
        }

        const survivors = state.playerStates.filter((ps) => {
            return (ps.stats as KillerStats).lives > 0;
        });

        if (survivors.length === 1 && state.playerStates.length > 1) {
            isWin = true;
            state.winnerId = survivors[0].playerId;
            state.status = "completed";
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
        return {
            gameType: "killer",
            roundIndicator: `Round ${state.currentRound}`,
            headers: ["Number", "Lives", "Status"],
            rows: state.playerStates.map((ps) => {
                const stats = ps.stats as KillerStats;
                const player = state.players.find((p) => p.id === ps.playerId)!;
                const isDead = stats.lives <= 0;

                return {
                    playerId: ps.playerId,
                    playerName: player.name,
                    score: isDead ? "OUT" : stats.lives,
                    active: state.currentPlayerId === ps.playerId && !isDead,
                    details: [{ value: stats.assignedNumber }, { value: stats.lives }, { value: stats.isKiller ? "Killer" : "-" }],
                };
            }),
        };
    }
}
