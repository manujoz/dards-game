import { CricketConfig, CricketPlayerStats, GameConfig, GameState, Hit, Player, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class CricketGame implements GameLogic {
    init(config: GameConfig, players: Player[]): Partial<GameState> {
        return {
            playerStates: players.map((p) => ({
                playerId: p.id,
                score: 0,
                stats: {
                    mpr: 0,
                    marks: {}, // segment -> count
                    closedNumbers: [],
                    score: 0,
                } as CricketPlayerStats,
            })),
        };
    }

    processThrow(state: GameState, hit: Hit): Throw {
        const config = state.config as CricketConfig;
        const playerState = state.playerStates.find((p) => p.playerId === state.currentPlayerId);

        if (!playerState) {
            throw new Error(`Player state not found for ${state.currentPlayerId}`);
        }

        const stats = playerState.stats as CricketPlayerStats;

        // 1. Validate Hit (Is it a target number?)
        const targets = config.numbers || [20, 19, 18, 17, 16, 15, 25];
        const isTarget = targets.includes(hit.segment);

        let points = 0;
        let isWin = false;

        if (isTarget) {
            const currentMarks = stats.marks[hit.segment] || 0;
            // Determine marks added.
            // For Bull (25), Multiplier 1 = 1 Mark (Outer), Multiplier 2 = 2 Marks (Inner).
            // For others, Multiplier = Marks.
            const marksAdded = hit.multiplier;

            // Safety for Bull if input is unusual, but usually DBull is mult 2.
            // If someone sends triple bull? Usually impossible on standard board but logical 3 marks.
            // We trust multiplier.

            const totalMarks = currentMarks + marksAdded;

            // Determine Closure
            let marksToScore = 0;
            if (currentMarks >= 3) {
                // Already closed, all hits are scoring candidates
                marksToScore = marksAdded;
            } else if (totalMarks > 3) {
                // Closed this turn with excess
                marksToScore = totalMarks - 3;
                // Update stats to closed
                stats.marks[hit.segment] = 3;
                if (!stats.closedNumbers.includes(hit.segment)) {
                    stats.closedNumbers.push(hit.segment);
                }
            } else {
                // Just adding marks, no score
                stats.marks[hit.segment] = totalMarks;
                if (totalMarks === 3) {
                    if (!stats.closedNumbers.includes(hit.segment)) {
                        stats.closedNumbers.push(hit.segment);
                    }
                }
            }

            // Scoring Logic
            if (marksToScore > 0) {
                // Check if ALL opponents have closed this number
                const opponents = state.playerStates.filter((p) => p.playerId !== state.currentPlayerId);
                const allOpponentsClosed = opponents.every((op) => {
                    const opStats = op.stats as CricketPlayerStats;
                    return (opStats.marks[hit.segment] || 0) >= 3;
                });

                if (!allOpponentsClosed) {
                    // Score is possible
                    // Value is Segment value (Bull=25, others=segment)
                    const val = hit.segment;
                    const score = marksToScore * val;

                    if (config.mode === "cut_throat") {
                        // Point Penalty Mode: Add score to opponents who haven't closed
                        opponents.forEach((op) => {
                            const opStats = op.stats as CricketPlayerStats;
                            if ((opStats.marks[hit.segment] || 0) < 3) {
                                op.score += score;
                            }
                        });
                        // Points tracked as positive generated score by throw
                        points = score;
                    } else {
                        // Standard Mode: Add score to self
                        playerState.score += score;
                        points = score;
                    }
                }
            }

            // Win Condition Check
            // 1. Have I closed all numbers?
            const myClosedCount = stats.closedNumbers.length;
            const totalTargets = targets.length;

            if (myClosedCount >= totalTargets) {
                const allScores = state.playerStates.map((p) => ({ id: p.playerId, score: p.score }));
                const myScore = playerState.score;

                if (config.mode === "cut_throat") {
                    // Win if lowest score
                    const isLowest = allScores.every((s) => s.id === state.currentPlayerId || myScore <= s.score);
                    if (isLowest) isWin = true;
                } else {
                    // Win if highest score
                    const isHighest = allScores.every((s) => s.id === state.currentPlayerId || myScore >= s.score);
                    if (isHighest) isWin = true;
                }
            }
        }

        return {
            hit,
            points,
            isBust: false,
            isWin,
            isValid: true,
            timestamp: Date.now(),
        };
    }

    getScoreboard(state: GameState): Scoreboard {
        return {
            gameType: "cricket",
            roundIndicator: `Round ${state.currentRound}`,
            headers: ["Player", "Score"], // Simplified headers for now
            rows: state.playerStates.map((p) => {
                const stats = p.stats as CricketPlayerStats;
                return {
                    playerId: p.playerId,
                    playerName: state.players.find((pl) => pl.id === p.playerId)?.name || "Unknown",
                    score: p.score,
                    active: p.playerId === state.currentPlayerId,
                    details: [],
                    marks: stats.marks,
                };
            }),
        };
    }
}
