"use server";

import type { GetRankingsRequest, RankingEntry, RankingGameType, RankingVariantGameType, RankingVariantOption } from "@/types/actions/rankings";
import type { ActionResponse } from "@/types/actions/shared";

import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { getVariantLabel } from "@/lib/rankings/variant-key";

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

const PROVISIONAL_MATCHES_THRESHOLD = 10;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const rankingVariantGameTypes = ["x01", "cricket", "round_the_clock", "high_score", "shanghai", "killer", "halve_it"] as const;
const rankingGameTypes = ["all", ...rankingVariantGameTypes] as const;

const rankingGameTypeSchema = z.enum(rankingGameTypes);

const getRankingsRequestSchema = z.object({
    gameType: rankingGameTypeSchema.default("all"),
    variantKey: z.string().trim().min(1).optional(),
    limit: z.number().int().positive().max(MAX_LIMIT).optional(),
});

const rankingVariantGameTypeSchema = z.enum(rankingVariantGameTypes);

function toIsoOrNull(value: Date | null | undefined): string | null {
    if (!value) return null;
    return value.toISOString();
}

function maxDate(a: Date | null | undefined, b: Date | null | undefined): Date | null {
    if (!a && !b) return null;
    if (a && !b) return a;
    if (!a && b) return b;
    return (a as Date).getTime() >= (b as Date).getTime() ? (a as Date) : (b as Date);
}

async function chooseMostPlayedVariantKey(gameId: RankingVariantGameType): Promise<string | null> {
    // Decisión cerrada: usar MatchResult con distinct: ["matchId"] y conteo por variantKey.
    const rows = await prisma.matchResult.findMany({
        where: {
            gameId,
        },
        select: {
            matchId: true,
            variantKey: true,
        },
        distinct: ["matchId"],
    });

    if (rows.length === 0) return null;

    const counts = new Map<string, number>();
    for (const r of rows) {
        counts.set(r.variantKey, (counts.get(r.variantKey) ?? 0) + 1);
    }

    let best: { variantKey: string; count: number } | null = null;
    for (const [variantKey, count] of counts.entries()) {
        if (!best || count > best.count) {
            best = { variantKey, count };
        }
    }

    return best?.variantKey ?? null;
}

function normalizeGetRankingsInput(input?: GetRankingsRequest | RankingGameType): unknown {
    if (typeof input === "string") {
        return {
            gameType: input,
        };
    }

    if (!input) {
        return {
            gameType: "all",
        };
    }

    return input;
}

function getSafeLimit(limit: number | undefined): number {
    if (!limit) return DEFAULT_LIMIT;
    return Math.min(Math.max(1, limit), MAX_LIMIT);
}

export async function getRankings(input?: GetRankingsRequest | RankingGameType): Promise<ActionResponse<RankingEntry[]>> {
    try {
        await requireAdminSession();

        const validated = getRankingsRequestSchema.safeParse(normalizeGetRankingsInput(input));
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const limit = getSafeLimit(validated.data.limit);
        const gameType = validated.data.gameType;

        // Decisión cerrada: gameType="all" intenta (all, __all__). Si no hay filas, no inventar ranking.
        if (gameType === "all") {
            const allGameId = "all";
            const allVariantKey = "__all__";

            const ratings = await prisma.playerModeRating.findMany({
                where: {
                    gameId: allGameId,
                    variantKey: allVariantKey,
                },
                orderBy: [{ ratingElo: "desc" }, { matchesPlayed: "desc" }],
                take: limit,
                select: {
                    playerId: true,
                    ratingElo: true,
                    matchesPlayed: true,
                    lastMatchAt: true,
                    variantKey: true,
                    player: {
                        select: {
                            id: true,
                            nickname: true,
                            avatarUrl: true,
                        },
                    },
                },
            });

            if (ratings.length === 0) {
                return {
                    success: true,
                    data: [],
                    message: "El ranking global (Todos) todavía no tiene datos. Termina alguna partida o ejecuta el recompute de rankings.",
                };
            }

            const playerIds = ratings.map((r) => r.playerId);

            const statsRows = await prisma.playerModeStats.findMany({
                where: {
                    gameId: allGameId,
                    variantKey: allVariantKey,
                    playerId: {
                        in: playerIds,
                    },
                },
                select: {
                    playerId: true,
                    matchesPlayed: true,
                    matchesWon: true,
                    dartsValid: true,
                    pointsValid: true,
                    marks: true,
                    roundsPlayed: true,
                    lastMatchAt: true,
                },
            });

            const statsByPlayerId = new Map<string, (typeof statsRows)[number]>();
            for (const s of statsRows) {
                statsByPlayerId.set(s.playerId, s);
            }

            const data: RankingEntry[] = ratings.map((r, index) => {
                const stats = statsByPlayerId.get(r.playerId);

                const matchesPlayed = stats?.matchesPlayed ?? r.matchesPlayed;
                const matchesWon = stats?.matchesWon ?? 0;
                const dartsValid = stats?.dartsValid ?? 0;
                const pointsValid = stats?.pointsValid ?? 0;
                const roundsPlayed = stats?.roundsPlayed ?? 0;
                const marks = typeof stats?.marks === "number" ? stats.marks : null;

                const ppd = dartsValid > 0 ? pointsValid / dartsValid : null;
                const mpr = roundsPlayed > 0 && marks !== null ? marks / roundsPlayed : null;

                const lastMatchAt = maxDate(stats?.lastMatchAt, r.lastMatchAt);

                return {
                    rank: index + 1,
                    player: {
                        id: r.player.id,
                        name: r.player.nickname,
                        avatarUrl: r.player.avatarUrl ?? undefined,
                    },
                    variantKey: r.variantKey,
                    ratingElo: r.ratingElo,
                    isProvisional: matchesPlayed < PROVISIONAL_MATCHES_THRESHOLD,
                    matchesPlayed,
                    matchesWon,
                    pointsAggregated: pointsValid,
                    marksAggregated: marks,
                    ppd,
                    mpr,
                    lastMatchAt: toIsoOrNull(lastMatchAt),
                };
            });

            return {
                success: true,
                data,
            };
        }

        // Modos específicos (x01/cricket/round_the_clock/high_score/shanghai/killer/halve_it)
        const gameId = gameType;

        const variantKey = validated.data.variantKey ?? (await chooseMostPlayedVariantKey(gameId));
        if (!variantKey) {
            return {
                success: true,
                data: [],
                message: "Aún no hay datos suficientes para mostrar rankings de este modo.",
            };
        }

        const ratings = await prisma.playerModeRating.findMany({
            where: {
                gameId,
                variantKey,
            },
            orderBy: [{ ratingElo: "desc" }, { matchesPlayed: "desc" }],
            take: limit,
            select: {
                playerId: true,
                ratingElo: true,
                matchesPlayed: true,
                lastMatchAt: true,
                variantKey: true,
                player: {
                    select: {
                        id: true,
                        nickname: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (ratings.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        const playerIds = ratings.map((r) => r.playerId);

        const statsRows = await prisma.playerModeStats.findMany({
            where: {
                gameId,
                variantKey,
                playerId: {
                    in: playerIds,
                },
            },
            select: {
                playerId: true,
                matchesPlayed: true,
                matchesWon: true,
                dartsValid: true,
                pointsValid: true,
                marks: true,
                roundsPlayed: true,
                lastMatchAt: true,
            },
        });

        const statsByPlayerId = new Map<string, (typeof statsRows)[number]>();
        for (const s of statsRows) {
            statsByPlayerId.set(s.playerId, s);
        }

        const data: RankingEntry[] = ratings.map((r, index) => {
            const stats = statsByPlayerId.get(r.playerId);

            const matchesPlayed = stats?.matchesPlayed ?? r.matchesPlayed;
            const matchesWon = stats?.matchesWon ?? 0;
            const dartsValid = stats?.dartsValid ?? 0;
            const pointsValid = stats?.pointsValid ?? 0;
            const roundsPlayed = stats?.roundsPlayed ?? 0;
            const marks = typeof stats?.marks === "number" ? stats.marks : null;

            const ppd = dartsValid > 0 ? pointsValid / dartsValid : null;
            const mpr = roundsPlayed > 0 && marks !== null ? marks / roundsPlayed : null;

            const lastMatchAt = maxDate(stats?.lastMatchAt, r.lastMatchAt);

            return {
                rank: index + 1,
                player: {
                    id: r.player.id,
                    name: r.player.nickname,
                    avatarUrl: r.player.avatarUrl ?? undefined,
                },
                variantKey: r.variantKey,
                ratingElo: r.ratingElo,
                isProvisional: matchesPlayed < PROVISIONAL_MATCHES_THRESHOLD,
                matchesPlayed,
                matchesWon,
                pointsAggregated: pointsValid,
                marksAggregated: marks,
                ppd,
                mpr,
                lastMatchAt: toIsoOrNull(lastMatchAt),
            };
        });

        return {
            success: true,
            data,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar la clasificación:", error);
        return {
            success: false,
            message: "No se han podido cargar los rankings",
        };
    }
}

export async function getRankingVariants(gameType: RankingVariantGameType): Promise<ActionResponse<RankingVariantOption[]>> {
    try {
        await requireAdminSession();

        const validated = rankingVariantGameTypeSchema.safeParse(gameType);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: {
                    gameType: validated.error.flatten().formErrors,
                },
            };
        }

        const gameId = validated.data;

        const rows = await prisma.matchResult.findMany({
            where: {
                gameId,
            },
            select: {
                matchId: true,
                variantKey: true,
            },
            distinct: ["matchId"],
        });

        const counts = new Map<string, number>();
        for (const r of rows) {
            counts.set(r.variantKey, (counts.get(r.variantKey) ?? 0) + 1);
        }

        const options: RankingVariantOption[] = Array.from(counts.entries()).map(([variantKey, matchCount]) => {
            return {
                variantKey,
                matchCount,
                label: getVariantLabel(gameId, variantKey),
            };
        });

        options.sort((a, b) => {
            if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
            return a.label.localeCompare(b.label, "es");
        });

        return {
            success: true,
            data: options,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar las variantes de ranking:", error);
        return {
            success: false,
            message: "No se han podido cargar las variantes del ranking",
        };
    }
}
