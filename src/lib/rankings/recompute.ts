import type { Match, MatchParticipant, MatchTeam, Throw } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { computeEloUpdatesWinnerOnly, GAME_ID_ALL, VARIANT_KEY_ALL } from "@/lib/rankings/elo";
import { calculateMatchMetricsByParticipant } from "@/lib/rankings/match-metrics";
import { isCountableMatchStatus } from "@/lib/rankings/match-policy";
import { createVariantKey } from "@/lib/rankings/variant-key";

type MatchWithRankingsDetails = Match & {
    participants: MatchParticipant[];
    teams: MatchTeam[];
    throws: Throw[];
};

type RankingsScope = {
    gameId: string;
    variantKey: string;
};

type FinalizeResult = { applied: true } | { applied: false; reason: "not_found" | "not_completed" | "no_winner" | "already_finalized" };

function isPrismaUniqueConstraintError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    if (!("code" in error)) return false;

    const code = (error as { code?: unknown }).code;
    return code === "P2002";
}

function resolveMatchEndedAt(match: MatchWithRankingsDetails): Date | null {
    if (match.endedAt) return match.endedAt;
    if (match.throws.length === 0) return null;

    let last = match.throws[0]?.timestamp ?? null;
    for (const t of match.throws) {
        if (!last || t.timestamp > last) {
            last = t.timestamp;
        }
    }

    return last;
}

function getWinnerParticipantId(match: MatchWithRankingsDetails): string | null {
    if (!match.winnerId) return null;
    const winnerParticipant = match.participants.find((p) => p.playerId === match.winnerId);
    return winnerParticipant?.id ?? null;
}

function buildMatchMetrics(match: MatchWithRankingsDetails): ReturnType<typeof calculateMatchMetricsByParticipant> {
    return calculateMatchMetricsByParticipant({
        gameId: match.gameId,
        participants: match.participants.map((p) => ({ id: p.id, playerId: p.playerId })),
        throws: match.throws.map((t) => ({
            participantId: t.participantId,
            roundIndex: t.roundIndex,
            segment: t.segment,
            multiplier: t.multiplier,
            points: t.points,
            isBust: t.isBust,
            isValid: t.isValid,
        })),
    });
}

/**
 * Finaliza una partida para rankings:
 * - Inserta resultados (MatchResult) de forma idempotente.
 * - Incrementa stats agregadas (PlayerModeStats) y rating ELO (PlayerModeRating).
 *
 * Idempotencia/concurrencia (opción 1, sin migración):
 * - "Leader insert": intentamos crear el MatchResult del ganador dentro de una transacción.
 * - Si falla con unique (P2002), asumimos que la partida ya fue finalizada y NO incrementamos nada.
 */
export async function finalizeMatchForRankings(matchId: string): Promise<FinalizeResult> {
    try {
        return await prisma.$transaction(async (tx) => {
            const match = (await tx.match.findUnique({
                where: {
                    id: matchId,
                },
                include: {
                    participants: true,
                    teams: true,
                    throws: true,
                },
            })) as MatchWithRankingsDetails | null;

            if (!match) {
                return { applied: false, reason: "not_found" };
            }

            if (!isCountableMatchStatus(match.status)) {
                return { applied: false, reason: "not_completed" };
            }

            const endedAt = resolveMatchEndedAt(match);
            if (!endedAt) {
                return { applied: false, reason: "not_completed" };
            }

            const winnerParticipantId = getWinnerParticipantId(match);
            if (!winnerParticipantId || !match.winnerId) {
                return { applied: false, reason: "no_winner" };
            }

            const variantKey = createVariantKey(match.gameId, match.variant);
            const metrics = buildMatchMetrics(match);
            const metricsByParticipantId = new Map(metrics.map((m) => [m.participantId, m] as const));

            const winnerMetrics = metricsByParticipantId.get(winnerParticipantId);
            if (!winnerMetrics) {
                return { applied: false, reason: "no_winner" };
            }

            try {
                await tx.matchResult.create({
                    data: {
                        matchId: match.id,
                        participantId: winnerParticipantId,
                        playerId: match.winnerId,
                        gameId: match.gameId,
                        variantKey,
                        isWin: true,
                        dartsValid: winnerMetrics.dartsValid,
                        pointsValid: winnerMetrics.pointsValid,
                        marks: typeof winnerMetrics.marks === "number" ? winnerMetrics.marks : null,
                        roundsPlayed: winnerMetrics.roundsPlayed,
                        endedAt,
                    },
                });
            } catch (error) {
                if (isPrismaUniqueConstraintError(error)) {
                    return { applied: false, reason: "already_finalized" };
                }

                throw error;
            }

            for (const p of match.participants) {
                if (p.id === winnerParticipantId) continue;
                const m = metricsByParticipantId.get(p.id);
                if (!m) continue;

                await tx.matchResult.create({
                    data: {
                        matchId: match.id,
                        participantId: p.id,
                        playerId: p.playerId,
                        gameId: match.gameId,
                        variantKey,
                        isWin: p.playerId === match.winnerId,
                        dartsValid: m.dartsValid,
                        pointsValid: m.pointsValid,
                        marks: typeof m.marks === "number" ? m.marks : null,
                        roundsPlayed: m.roundsPlayed,
                        endedAt,
                    },
                });
            }

            const participantPlayerIds = match.participants.map((p) => p.playerId);
            const existingRatings = await tx.playerModeRating.findMany({
                where: {
                    playerId: {
                        in: participantPlayerIds,
                    },
                    gameId: match.gameId,
                    variantKey,
                },
                select: {
                    playerId: true,
                    ratingElo: true,
                    matchesPlayed: true,
                },
            });

            const ratingByPlayerId = new Map(existingRatings.map((r) => [r.playerId, r] as const));

            const competitors = match.participants.map((p) => {
                const existing = ratingByPlayerId.get(p.playerId);
                return {
                    playerId: p.playerId,
                    ratingElo: existing?.ratingElo ?? 1500,
                    matchesPlayed: existing?.matchesPlayed ?? 0,
                    teamId: p.teamId,
                };
            });

            const eloUpdates = computeEloUpdatesWinnerOnly({
                competitors,
                winnerPlayerId: match.winnerId,
            });

            // Global ELO: se basa EXCLUSIVAMENTE en los ratings existentes de all/__all__.
            const existingGlobalRatings = await tx.playerModeRating.findMany({
                where: {
                    playerId: {
                        in: participantPlayerIds,
                    },
                    gameId: GAME_ID_ALL,
                    variantKey: VARIANT_KEY_ALL,
                },
                select: {
                    playerId: true,
                    ratingElo: true,
                    matchesPlayed: true,
                },
            });

            const globalRatingByPlayerId = new Map(existingGlobalRatings.map((r) => [r.playerId, r] as const));
            const globalCompetitors = match.participants.map((p) => {
                const existing = globalRatingByPlayerId.get(p.playerId);
                return {
                    playerId: p.playerId,
                    ratingElo: existing?.ratingElo ?? 1500,
                    matchesPlayed: existing?.matchesPlayed ?? 0,
                    teamId: p.teamId,
                };
            });

            const globalEloUpdates = computeEloUpdatesWinnerOnly({
                competitors: globalCompetitors,
                winnerPlayerId: match.winnerId,
            });

            for (const p of match.participants) {
                const m = metricsByParticipantId.get(p.id);
                if (!m) continue;

                const isWin = p.playerId === match.winnerId;

                const isCricket = match.gameId === "cricket";
                const marksValue = typeof m.marks === "number" ? m.marks : 0;

                await tx.playerModeStats.upsert({
                    where: {
                        playerId_gameId_variantKey: {
                            playerId: p.playerId,
                            gameId: match.gameId,
                            variantKey,
                        },
                    },
                    create: {
                        playerId: p.playerId,
                        gameId: match.gameId,
                        variantKey,
                        matchesPlayed: 1,
                        matchesWon: isWin ? 1 : 0,
                        dartsValid: m.dartsValid,
                        pointsValid: m.pointsValid,
                        marks: isCricket ? marksValue : null,
                        roundsPlayed: m.roundsPlayed,
                        lastMatchAt: endedAt,
                    },
                    update: {
                        matchesPlayed: {
                            increment: 1,
                        },
                        matchesWon: {
                            increment: isWin ? 1 : 0,
                        },
                        dartsValid: {
                            increment: m.dartsValid,
                        },
                        pointsValid: {
                            increment: m.pointsValid,
                        },
                        roundsPlayed: {
                            increment: m.roundsPlayed,
                        },
                        ...(isCricket ? { marks: { increment: marksValue } } : {}),
                        lastMatchAt: endedAt,
                    },
                });

                // Stats globales (gameId="all", variantKey="__all__"):
                // decisión: marks debe mantenerse SIEMPRE null (no sumar ni mezclar unidades).
                await tx.playerModeStats.upsert({
                    where: {
                        playerId_gameId_variantKey: {
                            playerId: p.playerId,
                            gameId: GAME_ID_ALL,
                            variantKey: VARIANT_KEY_ALL,
                        },
                    },
                    create: {
                        playerId: p.playerId,
                        gameId: GAME_ID_ALL,
                        variantKey: VARIANT_KEY_ALL,
                        matchesPlayed: 1,
                        matchesWon: isWin ? 1 : 0,
                        dartsValid: m.dartsValid,
                        pointsValid: m.pointsValid,
                        marks: null,
                        roundsPlayed: m.roundsPlayed,
                        lastMatchAt: endedAt,
                    },
                    update: {
                        matchesPlayed: {
                            increment: 1,
                        },
                        matchesWon: {
                            increment: isWin ? 1 : 0,
                        },
                        dartsValid: {
                            increment: m.dartsValid,
                        },
                        pointsValid: {
                            increment: m.pointsValid,
                        },
                        roundsPlayed: {
                            increment: m.roundsPlayed,
                        },
                        lastMatchAt: endedAt,
                    },
                });
            }

            for (const update of eloUpdates) {
                await tx.playerModeRating.upsert({
                    where: {
                        playerId_gameId_variantKey: {
                            playerId: update.playerId,
                            gameId: match.gameId,
                            variantKey,
                        },
                    },
                    create: {
                        playerId: update.playerId,
                        gameId: match.gameId,
                        variantKey,
                        ratingElo: update.newRatingElo,
                        matchesPlayed: 1,
                        lastMatchAt: endedAt,
                    },
                    update: {
                        ratingElo: update.newRatingElo,
                        matchesPlayed: {
                            increment: 1,
                        },
                        lastMatchAt: endedAt,
                    },
                });
            }

            for (const update of globalEloUpdates) {
                await tx.playerModeRating.upsert({
                    where: {
                        playerId_gameId_variantKey: {
                            playerId: update.playerId,
                            gameId: GAME_ID_ALL,
                            variantKey: VARIANT_KEY_ALL,
                        },
                    },
                    create: {
                        playerId: update.playerId,
                        gameId: GAME_ID_ALL,
                        variantKey: VARIANT_KEY_ALL,
                        ratingElo: update.newRatingElo,
                        matchesPlayed: 1,
                        lastMatchAt: endedAt,
                    },
                    update: {
                        ratingElo: update.newRatingElo,
                        matchesPlayed: {
                            increment: 1,
                        },
                        lastMatchAt: endedAt,
                    },
                });
            }

            return { applied: true };
        });
    } catch (error) {
        // Logueamos para diagnóstico, pero dejamos que el caller decida si romper o no.
        console.error("Error al finalizar rankings de la partida:", error);
        throw error;
    }
}

type RecomputeResult = {
    scope: RankingsScope;
    matchesConsidered: number;
    participantsConsidered: number;
};

function isValidWinnerForMatch(match: MatchWithRankingsDetails): boolean {
    if (!match.winnerId) return false;
    return match.participants.some((p) => p.playerId === match.winnerId);
}

/**
 * Recompute seguro del scope (gameId + variantKey):
 * - Recalcula MatchResult, PlayerModeStats y PlayerModeRating desde cero.
 * - Está pensado para correcciones tras undo/undoAbort o inconsistencias.
 */
export async function recomputeRankingsScope(scope: RankingsScope): Promise<RecomputeResult> {
    const matches = (await prisma.match.findMany({
        where: {
            gameId: scope.gameId,
            status: "completed",
        },
        orderBy: [
            {
                endedAt: {
                    sort: "asc",
                    nulls: "last",
                },
            },
            {
                startedAt: "asc",
            },
        ],
        include: {
            participants: true,
            teams: true,
            throws: true,
        },
    })) as MatchWithRankingsDetails[];

    const selectedMatches = matches
        .filter((m) => isCountableMatchStatus(m.status))
        .filter((m) => createVariantKey(m.gameId, m.variant) === scope.variantKey)
        .filter((m) => resolveMatchEndedAt(m) !== null)
        .filter((m) => isValidWinnerForMatch(m));

    type StatsAgg = {
        playerId: string;
        matchesPlayed: number;
        matchesWon: number;
        dartsValid: number;
        pointsValid: number;
        marks: number | null;
        roundsPlayed: number;
        lastMatchAt: Date | null;
    };

    type RatingAgg = {
        playerId: string;
        ratingElo: number;
        matchesPlayed: number;
        lastMatchAt: Date | null;
    };

    const statsByPlayerId = new Map<string, StatsAgg>();
    const ratingByPlayerId = new Map<string, RatingAgg>();

    const matchResultRows: Array<Prisma.MatchResultCreateManyInput> = [];

    for (const match of selectedMatches) {
        const endedAt = resolveMatchEndedAt(match);
        if (!endedAt) continue;
        if (!match.winnerId) continue;

        const variantKey = scope.variantKey;
        const metrics = buildMatchMetrics(match);
        const metricsByParticipantId = new Map(metrics.map((m) => [m.participantId, m] as const));

        for (const participant of match.participants) {
            const m = metricsByParticipantId.get(participant.id);
            if (!m) continue;

            const isWin = participant.playerId === match.winnerId;
            const isCricket = scope.gameId === "cricket";
            const marksValue = isCricket ? (typeof m.marks === "number" ? m.marks : 0) : null;

            matchResultRows.push({
                matchId: match.id,
                participantId: participant.id,
                playerId: participant.playerId,
                gameId: scope.gameId,
                variantKey,
                isWin,
                dartsValid: m.dartsValid,
                pointsValid: m.pointsValid,
                marks: marksValue,
                roundsPlayed: m.roundsPlayed,
                endedAt,
            });

            const existingStats = statsByPlayerId.get(participant.playerId);
            if (existingStats) {
                existingStats.matchesPlayed += 1;
                existingStats.matchesWon += isWin ? 1 : 0;
                existingStats.dartsValid += m.dartsValid;
                existingStats.pointsValid += m.pointsValid;
                existingStats.roundsPlayed += m.roundsPlayed;
                if (isCricket) {
                    existingStats.marks = (existingStats.marks ?? 0) + (marksValue ?? 0);
                }
                if (!existingStats.lastMatchAt || endedAt > existingStats.lastMatchAt) {
                    existingStats.lastMatchAt = endedAt;
                }
            } else {
                statsByPlayerId.set(participant.playerId, {
                    playerId: participant.playerId,
                    matchesPlayed: 1,
                    matchesWon: isWin ? 1 : 0,
                    dartsValid: m.dartsValid,
                    pointsValid: m.pointsValid,
                    marks: isCricket ? (marksValue ?? 0) : null,
                    roundsPlayed: m.roundsPlayed,
                    lastMatchAt: endedAt,
                });
            }

            const existingRating = ratingByPlayerId.get(participant.playerId);
            if (!existingRating) {
                ratingByPlayerId.set(participant.playerId, {
                    playerId: participant.playerId,
                    ratingElo: 1500,
                    matchesPlayed: 0,
                    lastMatchAt: null,
                });
            }
        }

        const competitors = match.participants.map((p) => {
            const r = ratingByPlayerId.get(p.playerId);
            return {
                playerId: p.playerId,
                ratingElo: r?.ratingElo ?? 1500,
                matchesPlayed: r?.matchesPlayed ?? 0,
                teamId: p.teamId,
            };
        });

        const updates = computeEloUpdatesWinnerOnly({
            competitors,
            winnerPlayerId: match.winnerId,
        });

        for (const update of updates) {
            const r = ratingByPlayerId.get(update.playerId);
            if (!r) continue;

            r.ratingElo = update.newRatingElo;
            r.matchesPlayed += 1;
            r.lastMatchAt = endedAt;
        }
    }

    const statsRows: Array<Prisma.PlayerModeStatsCreateManyInput> = Array.from(statsByPlayerId.values()).map((s) => ({
        playerId: s.playerId,
        gameId: scope.gameId,
        variantKey: scope.variantKey,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        dartsValid: s.dartsValid,
        pointsValid: s.pointsValid,
        marks: s.marks,
        roundsPlayed: s.roundsPlayed,
        lastMatchAt: s.lastMatchAt,
    }));

    const ratingRows: Array<Prisma.PlayerModeRatingCreateManyInput> = Array.from(ratingByPlayerId.values()).map((r) => ({
        playerId: r.playerId,
        gameId: scope.gameId,
        variantKey: scope.variantKey,
        ratingElo: r.ratingElo,
        matchesPlayed: r.matchesPlayed,
        lastMatchAt: r.lastMatchAt,
    }));

    await prisma.$transaction(async (tx) => {
        await tx.matchResult.deleteMany({
            where: {
                gameId: scope.gameId,
                variantKey: scope.variantKey,
            },
        });
        await tx.playerModeStats.deleteMany({
            where: {
                gameId: scope.gameId,
                variantKey: scope.variantKey,
            },
        });
        await tx.playerModeRating.deleteMany({
            where: {
                gameId: scope.gameId,
                variantKey: scope.variantKey,
            },
        });

        if (matchResultRows.length > 0) {
            await tx.matchResult.createMany({
                data: matchResultRows,
            });
        }

        if (statsRows.length > 0) {
            await tx.playerModeStats.createMany({
                data: statsRows,
            });
        }

        if (ratingRows.length > 0) {
            await tx.playerModeRating.createMany({
                data: ratingRows,
            });
        }
    });

    const participantsConsidered = matchResultRows.length;

    return {
        scope,
        matchesConsidered: selectedMatches.length,
        participantsConsidered,
    };
}

export type RecomputeGlobalAllResult = {
    matchesConsidered: number;
    participantsConsidered: number;
};

/**
 * Recompute global (gameId="all", variantKey="__all__"):
 * - Recalcula stats+rating global desde cero leyendo todos los matches completed.
 * - Reescribe SOLO player_mode_stats y player_mode_ratings para all/__all__.
 * - No toca match_results.
 *
 * Decisión: PlayerModeStats.marks debe mantenerse SIEMPRE null en scope global.
 */
export async function recomputeRankingsGlobalAll(): Promise<RecomputeGlobalAllResult> {
    const matches = (await prisma.match.findMany({
        where: {
            status: "completed",
        },
        orderBy: [
            {
                endedAt: {
                    sort: "asc",
                    nulls: "last",
                },
            },
            {
                startedAt: "asc",
            },
        ],
        include: {
            participants: true,
            teams: true,
            throws: true,
        },
    })) as MatchWithRankingsDetails[];

    const selectedMatches = matches
        .filter((m) => isCountableMatchStatus(m.status))
        .filter((m) => resolveMatchEndedAt(m) !== null)
        .filter((m) => isValidWinnerForMatch(m));

    type StatsAgg = {
        playerId: string;
        matchesPlayed: number;
        matchesWon: number;
        dartsValid: number;
        pointsValid: number;
        roundsPlayed: number;
        lastMatchAt: Date | null;
    };

    type RatingAgg = {
        playerId: string;
        ratingElo: number;
        matchesPlayed: number;
        lastMatchAt: Date | null;
    };

    const statsByPlayerId = new Map<string, StatsAgg>();
    const ratingByPlayerId = new Map<string, RatingAgg>();

    for (const match of selectedMatches) {
        const endedAt = resolveMatchEndedAt(match);
        if (!endedAt) continue;
        if (!match.winnerId) continue;

        const metrics = buildMatchMetrics(match);
        const metricsByParticipantId = new Map(metrics.map((m) => [m.participantId, m] as const));

        for (const participant of match.participants) {
            const m = metricsByParticipantId.get(participant.id);
            if (!m) continue;

            const isWin = participant.playerId === match.winnerId;

            const existingStats = statsByPlayerId.get(participant.playerId);
            if (existingStats) {
                existingStats.matchesPlayed += 1;
                existingStats.matchesWon += isWin ? 1 : 0;
                existingStats.dartsValid += m.dartsValid;
                existingStats.pointsValid += m.pointsValid;
                existingStats.roundsPlayed += m.roundsPlayed;

                if (!existingStats.lastMatchAt || endedAt > existingStats.lastMatchAt) {
                    existingStats.lastMatchAt = endedAt;
                }
            } else {
                statsByPlayerId.set(participant.playerId, {
                    playerId: participant.playerId,
                    matchesPlayed: 1,
                    matchesWon: isWin ? 1 : 0,
                    dartsValid: m.dartsValid,
                    pointsValid: m.pointsValid,
                    roundsPlayed: m.roundsPlayed,
                    lastMatchAt: endedAt,
                });
            }

            const existingRating = ratingByPlayerId.get(participant.playerId);
            if (!existingRating) {
                ratingByPlayerId.set(participant.playerId, {
                    playerId: participant.playerId,
                    ratingElo: 1500,
                    matchesPlayed: 0,
                    lastMatchAt: null,
                });
            }
        }

        const competitors = match.participants.map((p) => {
            const r = ratingByPlayerId.get(p.playerId);
            return {
                playerId: p.playerId,
                ratingElo: r?.ratingElo ?? 1500,
                matchesPlayed: r?.matchesPlayed ?? 0,
                teamId: p.teamId,
            };
        });

        const updates = computeEloUpdatesWinnerOnly({
            competitors,
            winnerPlayerId: match.winnerId,
        });

        for (const update of updates) {
            const r = ratingByPlayerId.get(update.playerId);
            if (!r) continue;

            r.ratingElo = update.newRatingElo;
            r.matchesPlayed += 1;
            r.lastMatchAt = endedAt;
        }
    }

    const statsRows: Array<Prisma.PlayerModeStatsCreateManyInput> = Array.from(statsByPlayerId.values()).map((s) => ({
        playerId: s.playerId,
        gameId: GAME_ID_ALL,
        variantKey: VARIANT_KEY_ALL,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        dartsValid: s.dartsValid,
        pointsValid: s.pointsValid,
        marks: null,
        roundsPlayed: s.roundsPlayed,
        lastMatchAt: s.lastMatchAt,
    }));

    const ratingRows: Array<Prisma.PlayerModeRatingCreateManyInput> = Array.from(ratingByPlayerId.values()).map((r) => ({
        playerId: r.playerId,
        gameId: GAME_ID_ALL,
        variantKey: VARIANT_KEY_ALL,
        ratingElo: r.ratingElo,
        matchesPlayed: r.matchesPlayed,
        lastMatchAt: r.lastMatchAt,
    }));

    await prisma.$transaction(async (tx) => {
        await tx.playerModeStats.deleteMany({
            where: {
                gameId: GAME_ID_ALL,
                variantKey: VARIANT_KEY_ALL,
            },
        });

        await tx.playerModeRating.deleteMany({
            where: {
                gameId: GAME_ID_ALL,
                variantKey: VARIANT_KEY_ALL,
            },
        });

        if (statsRows.length > 0) {
            await tx.playerModeStats.createMany({
                data: statsRows,
            });
        }

        if (ratingRows.length > 0) {
            await tx.playerModeRating.createMany({
                data: ratingRows,
            });
        }
    });

    return {
        matchesConsidered: selectedMatches.length,
        participantsConsidered: selectedMatches.reduce((acc, m) => acc + m.participants.length, 0),
    };
}
