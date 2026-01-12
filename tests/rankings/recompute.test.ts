import { describe, expect, it, vi } from "vitest";

type TransactionClient = {
    match: {
        findUnique: (args: unknown) => Promise<unknown>;
    };
    matchResult: {
        create: (args: unknown) => Promise<unknown>;
        deleteMany?: (args: unknown) => Promise<unknown>;
        createMany?: (args: unknown) => Promise<unknown>;
    };
    playerModeStats: {
        deleteMany?: (args: unknown) => Promise<unknown>;
        createMany?: (args: unknown) => Promise<unknown>;
        upsert: (args: unknown) => Promise<unknown>;
    };
    playerModeRating: {
        deleteMany?: (args: unknown) => Promise<unknown>;
        createMany?: (args: unknown) => Promise<unknown>;
        findMany: (args: unknown) => Promise<unknown[]>;
        upsert: (args: unknown) => Promise<unknown>;
    };
};

type PrismaMock = {
    match?: {
        findMany?: (args: unknown) => Promise<unknown[]>;
    };
    $transaction: <T>(fn: (tx: TransactionClient) => Promise<T>) => Promise<T>;
};

function createP2002(): Error {
    const error = new Error("Unique constraint violation") as Error & { code?: string };
    error.code = "P2002";
    return error;
}

async function loadRankingsModuleWithPrismaMock(prismaMock: PrismaMock): Promise<{
    finalizeMatchForRankings: (matchId: string) => Promise<unknown>;
    recomputeRankingsGlobalAll: () => Promise<unknown>;
}> {
    vi.resetModules();
    vi.doMock("@/lib/db/prisma", () => ({
        prisma: prismaMock,
    }));

    const mod = await import("@/lib/rankings/recompute");
    return {
        finalizeMatchForRankings: mod.finalizeMatchForRankings,
        recomputeRankingsGlobalAll: mod.recomputeRankingsGlobalAll,
    };
}

describe("rankings/recompute finalizeMatchForRankings", () => {
    it("carrera: si el leader insert falla con P2002, no incrementa stats ni rating", async () => {
        const tx: TransactionClient = {
            match: {
                findUnique: vi.fn(async () => ({
                    id: "m1",
                    gameId: "x01",
                    variant: JSON.stringify({ type: "x01", startScore: 501, inMode: "straight", outMode: "double", teamMode: "single" }),
                    status: "completed",
                    winnerId: "p1",
                    endedAt: new Date("2026-01-12T10:00:00.000Z"),
                    startedAt: new Date("2026-01-12T09:00:00.000Z"),
                    participants: [
                        {
                            id: "mp1",
                            matchId: "m1",
                            teamId: null,
                            playerId: "p1",
                            score: 0,
                            rank: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: "mp2",
                            matchId: "m1",
                            teamId: null,
                            playerId: "p2",
                            score: 0,
                            rank: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ],
                    teams: [],
                    throws: [],
                })),
            },
            matchResult: {
                create: vi.fn(async () => {
                    throw createP2002();
                }),
            },
            playerModeStats: {
                upsert: vi.fn(async () => undefined),
            },
            playerModeRating: {
                findMany: vi.fn(async () => []),
                upsert: vi.fn(async () => undefined),
            },
        };

        const prismaMock: PrismaMock = {
            $transaction: async (fn) => fn(tx),
        };

        const { finalizeMatchForRankings } = await loadRankingsModuleWithPrismaMock(prismaMock);

        const result = await finalizeMatchForRankings("m1");

        expect(result).toEqual({ applied: false, reason: "already_finalized" });
        expect((tx.playerModeStats.upsert as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(0);
        expect((tx.playerModeRating.upsert as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(0);
    });

    it("idempotente: dos llamadas solo aplican una vez (la segunda se corta por P2002)", async () => {
        const winnerParticipantId = "mp1";
        const createdLeaders = new Set<string>();

        const tx: TransactionClient = {
            match: {
                findUnique: vi.fn(async () => ({
                    id: "m1",
                    gameId: "x01",
                    variant: JSON.stringify({ type: "x01", startScore: 501, inMode: "straight", outMode: "double", teamMode: "single" }),
                    status: "completed",
                    winnerId: "p1",
                    endedAt: new Date("2026-01-12T10:00:00.000Z"),
                    startedAt: new Date("2026-01-12T09:00:00.000Z"),
                    participants: [
                        {
                            id: "mp1",
                            matchId: "m1",
                            teamId: null,
                            playerId: "p1",
                            score: 0,
                            rank: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: "mp2",
                            matchId: "m1",
                            teamId: null,
                            playerId: "p2",
                            score: 0,
                            rank: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ],
                    teams: [],
                    throws: [
                        {
                            id: "t1",
                            matchId: "m1",
                            participantId: "mp1",
                            roundIndex: 0,
                            throwIndex: 1,
                            segment: 20,
                            multiplier: 3,
                            points: 60,
                            x: 0,
                            y: 0,
                            isBust: false,
                            isWin: true,
                            isValid: true,
                            timestamp: new Date("2026-01-12T10:00:00.000Z"),
                        },
                    ],
                })),
            },
            matchResult: {
                create: vi.fn(async (args: unknown) => {
                    const participantId = (args as { data?: { participantId?: unknown } }).data?.participantId;
                    if (participantId === winnerParticipantId) {
                        if (createdLeaders.has(winnerParticipantId)) {
                            throw createP2002();
                        }
                        createdLeaders.add(winnerParticipantId);
                    }

                    return undefined;
                }),
            },
            playerModeStats: {
                upsert: vi.fn(async () => undefined),
            },
            playerModeRating: {
                findMany: vi.fn(async () => []),
                upsert: vi.fn(async () => undefined),
            },
        };

        const prismaMock: PrismaMock = {
            $transaction: async (fn) => fn(tx),
        };

        const { finalizeMatchForRankings } = await loadRankingsModuleWithPrismaMock(prismaMock);

        const result1 = await finalizeMatchForRankings("m1");
        const result2 = await finalizeMatchForRankings("m1");

        expect(result1).toEqual({ applied: true });
        expect(result2).toEqual({ applied: false, reason: "already_finalized" });

        // 2 participantes => 2 upserts por scope específico + 2 upserts globales (solo una vez).
        const statsUpsertCalls = (tx.playerModeStats.upsert as unknown as { mock: { calls: unknown[][] } }).mock.calls;
        expect(statsUpsertCalls.length).toBe(4);

        const hasGlobalStatsUpsert = statsUpsertCalls.some((callArgs) => {
            const arg = callArgs[0] as { where?: { playerId_gameId_variantKey?: { gameId?: unknown; variantKey?: unknown } } };
            return arg.where?.playerId_gameId_variantKey?.gameId === "all" && arg.where?.playerId_gameId_variantKey?.variantKey === "__all__";
        });
        expect(hasGlobalStatsUpsert).toBe(true);

        // ELO winner-only devuelve updates para todos los competidores => 2 upserts por scope + 2 globales (solo una vez).
        const ratingUpsertCalls = (tx.playerModeRating.upsert as unknown as { mock: { calls: unknown[][] } }).mock.calls;
        expect(ratingUpsertCalls.length).toBe(4);

        const hasGlobalRatingUpsert = ratingUpsertCalls.some((callArgs) => {
            const arg = callArgs[0] as { where?: { playerId_gameId_variantKey?: { gameId?: unknown; variantKey?: unknown } } };
            return arg.where?.playerId_gameId_variantKey?.gameId === "all" && arg.where?.playerId_gameId_variantKey?.variantKey === "__all__";
        });
        expect(hasGlobalRatingUpsert).toBe(true);
    });
});

describe("rankings/recompute recomputeRankingsGlobalAll", () => {
    it("reescribe solo stats+rating para all/__all__ y no toca match_results", async () => {
        const tx: TransactionClient = {
            match: {
                findUnique: vi.fn(async () => null),
            },
            playerModeStats: {
                upsert: vi.fn(async () => undefined),
                deleteMany: vi.fn(async () => ({ count: 0 })),
                createMany: vi.fn(async () => ({ count: 0 })),
            },
            playerModeRating: {
                findMany: vi.fn(async () => []),
                upsert: vi.fn(async () => undefined),
                deleteMany: vi.fn(async () => ({ count: 0 })),
                createMany: vi.fn(async () => ({ count: 0 })),
            },
            matchResult: {
                create: vi.fn(async () => undefined),
                deleteMany: vi.fn(async () => {
                    throw new Error("No debe tocar match_results en recomputeRankingsGlobalAll");
                }),
                createMany: vi.fn(async () => {
                    throw new Error("No debe tocar match_results en recomputeRankingsGlobalAll");
                }),
            },
        };

        const prismaMock: PrismaMock = {
            match: {
                findMany: vi.fn(async () => [
                    {
                        id: "m1",
                        gameId: "x01",
                        variant: JSON.stringify({ type: "x01", startScore: 501, inMode: "straight", outMode: "double", teamMode: "single" }),
                        status: "completed",
                        winnerId: "p1",
                        endedAt: new Date("2026-01-12T10:00:00.000Z"),
                        startedAt: new Date("2026-01-12T09:00:00.000Z"),
                        participants: [
                            {
                                id: "mp1",
                                matchId: "m1",
                                teamId: null,
                                playerId: "p1",
                                score: 0,
                                rank: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                            {
                                id: "mp2",
                                matchId: "m1",
                                teamId: null,
                                playerId: "p2",
                                score: 0,
                                rank: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        ],
                        teams: [],
                        throws: [],
                    },
                    {
                        id: "m2",
                        gameId: "cricket",
                        variant: JSON.stringify({ type: "cricket" }),
                        status: "completed",
                        winnerId: "p2",
                        endedAt: new Date("2026-01-12T11:00:00.000Z"),
                        startedAt: new Date("2026-01-12T10:30:00.000Z"),
                        participants: [
                            {
                                id: "mp3",
                                matchId: "m2",
                                teamId: null,
                                playerId: "p1",
                                score: 0,
                                rank: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                            {
                                id: "mp4",
                                matchId: "m2",
                                teamId: null,
                                playerId: "p2",
                                score: 0,
                                rank: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        ],
                        teams: [],
                        throws: [],
                    },
                ]),
            },
            $transaction: async (fn) => fn(tx),
        };

        const { recomputeRankingsGlobalAll } = await loadRankingsModuleWithPrismaMock(prismaMock);

        await recomputeRankingsGlobalAll();

        expect((tx.playerModeStats.deleteMany as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(1);
        expect((tx.playerModeRating.deleteMany as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(1);

        const statsCreateArgs = (tx.playerModeStats.createMany as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as
            | { data?: Array<{ gameId?: unknown; variantKey?: unknown; marks?: unknown }> }
            | undefined;

        expect(statsCreateArgs?.data?.length).toBeGreaterThan(0);
        for (const row of statsCreateArgs?.data ?? []) {
            expect(row.gameId).toBe("all");
            expect(row.variantKey).toBe("__all__");
            expect(row.marks).toBe(null);
        }

        expect((tx.matchResult?.deleteMany as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(0);
        expect((tx.matchResult?.createMany as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(0);
    });
});
