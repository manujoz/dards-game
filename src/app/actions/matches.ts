"use server";

import { type MatchActionErrorCode, type MatchActionResponse } from "@/types/actions/matches";
import { type ActionResponse } from "@/types/actions/shared";
import { type Match, type MatchParticipant, type MatchTeam, type Player, type Prisma, type Throw } from "@prisma/client";
import { z } from "zod";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { isLockValid, nextLeaseUntil } from "@/lib/device/device-lock";
import { createMatchSchema, type CreateMatchInput } from "@/lib/validation/matches";

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

const LOCKED_BY_OTHER_DEVICE_MESSAGE = "Partida controlada por otro dispositivo";
const MATCH_ALREADY_FINISHED_MESSAGE = "La partida ya está finalizada";
const LOCKED_BY_OTHER_DEVICE_CODE: MatchActionErrorCode = "LOCKED_BY_OTHER_DEVICE";

function getSafeActionErrorInfo(error: unknown): { message: string; code?: MatchActionErrorCode } | null {
    if (!(error instanceof Error)) return null;

    if (error.message === LOCKED_BY_OTHER_DEVICE_MESSAGE) {
        return {
            message: error.message,
            code: LOCKED_BY_OTHER_DEVICE_CODE,
        };
    }

    if (error.message === MATCH_ALREADY_FINISHED_MESSAGE) {
        return {
            message: error.message,
        };
    }

    if (error.message === "No se ha encontrado la partida") {
        return {
            message: error.message,
        };
    }

    return null;
}

type PublicPlayer = Omit<Player, "password">;

type WinningThrowInfo = {
    participantId: string;
    timestamp: Date;
    participant: {
        playerId: string;
    };
};

export type MatchWithDetails = Match & {
    teams: MatchTeam[];
    participants: (MatchParticipant & { player: PublicPlayer })[];
    throws: Throw[];
};

export type MatchListEntry = Match & {
    teams: MatchTeam[];
    participants: (MatchParticipant & { player: PublicPlayer })[];
    winningThrows: WinningThrowInfo[];
};

type GetMatchesOptions = {
    limit?: number;
    status?: string | string[];
    includeOngoingWithWin?: boolean;
};

export async function getMatches(options: number | GetMatchesOptions = 50): Promise<ActionResponse<MatchListEntry[]>> {
    try {
        await requireAdminSession();

        const resolvedOptions: GetMatchesOptions = typeof options === "number" ? { limit: options } : options;
        const limit = resolvedOptions.limit ?? 50;
        const status = resolvedOptions.status;
        const includeOngoingWithWin = resolvedOptions.includeOngoingWithWin ?? false;

        let where: Prisma.MatchWhereInput | undefined;
        if (status) {
            const or: Prisma.MatchWhereInput[] = [
                {
                    status: Array.isArray(status) ? { in: status } : status,
                },
            ];

            if (includeOngoingWithWin) {
                or.push({
                    status: "ongoing",
                    throws: {
                        some: {
                            isWin: true,
                        },
                    },
                });
            }

            where = {
                OR: or,
            };
        }

        const matches = await prisma.match.findMany({
            take: limit,
            orderBy: [
                {
                    lastActivityAt: {
                        sort: "desc",
                        nulls: "last",
                    },
                },
                {
                    startedAt: "desc",
                },
            ],
            where,
            include: {
                teams: true,
                participants: {
                    include: {
                        player: {
                            select: {
                                id: true,
                                nickname: true,
                                avatarUrl: true,
                                admin: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
                throws: {
                    where: {
                        isWin: true,
                    },
                    take: 1,
                    orderBy: {
                        timestamp: "desc",
                    },
                    select: {
                        participantId: true,
                        timestamp: true,
                        participant: {
                            select: {
                                playerId: true,
                            },
                        },
                    },
                },
            },
        });

        const listEntries: MatchListEntry[] = matches.map(({ throws: winningThrows, ...rest }) => ({
            ...rest,
            winningThrows: winningThrows as WinningThrowInfo[],
        }));

        return {
            success: true,
            data: listEntries,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar las partidas:", error);
        return {
            success: false,
            message: "No se han podido cargar las partidas",
        };
    }
}

export type RegisterThrowInput = {
    deviceId: string;
    participantId: string;
    segment: number;
    multiplier: number; // 1, 2, 3
    x: number;
    y: number;
    points?: number;
    isBust?: boolean;
    isWin?: boolean;
    isValid?: boolean;
    roundIndex: number;
    throwIndex: number;
};

const registerThrowSchema = z.object({
    deviceId: z.string().uuid(),
    participantId: z.string().uuid(),
    segment: z.number().int().min(0).max(25),
    multiplier: z.number().int().min(0).max(3),
    x: z.number(),
    y: z.number(),
    points: z.number().int().nonnegative().optional(),
    isBust: z.boolean().optional(),
    isWin: z.boolean().optional(),
    isValid: z.boolean().optional(),
    roundIndex: z.number().int().min(0),
    throwIndex: z.number().int().min(1).max(3),
});

const registerThrowForPlayerSchema = registerThrowSchema.omit({ participantId: true }).extend({
    playerId: z.string().uuid(),
});

const matchControlSchema = z.object({
    matchId: z.string().uuid(),
    deviceId: z.string().uuid(),
});

const abortMatchSchema = z.object({
    matchId: z.string().uuid(),
});

export async function createMatch(input: CreateMatchInput): Promise<ActionResponse<MatchWithDetails>> {
    try {
        await requireAdminSession();

        const validated = createMatchSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const { gameId, config, playerIds, teams: explicitTeams } = validated.data;

        // Structure teams
        let matchTeamsData: { name: string; memberIds: string[] }[] = [];

        if (explicitTeams && explicitTeams.length > 0) {
            // Use explicit teams
            // We might want to fetch player names to name teams "Player 1 & Player 2" or "Team A"
            // For now, simpler: "Team 1", "Team 2" ...
            matchTeamsData = explicitTeams.map((pIds, idx) => ({
                name: `Equipo ${idx + 1}`,
                memberIds: pIds,
            }));
        } else {
            // Default: Singles, 1 team per player
            // Fetch players to get names
            const players = await prisma.player.findMany({
                where: { id: { in: playerIds } },
            });
            // Map strictly to preserve order of playerIds input? Or just map?
            // Usually order in playerIds implies turn order? preserve it.
            matchTeamsData = playerIds.map((pId) => {
                const p = players.find((pl) => pl.id === pId);
                return {
                    name: p?.nickname || "Desconocido",
                    memberIds: [pId],
                };
            });
        }

        // Transaction to create match + teams + participants
        const match = await prisma.$transaction(async (tx) => {
            const newMatch = await tx.match.create({
                data: {
                    gameId: gameId,
                    variant: JSON.stringify(config), // Storing full config for now
                    format: JSON.stringify({
                        teamMode: explicitTeams ? "team" : "single",
                        playerCount: playerIds.length,
                    }),
                    status: "setup",
                    winnerId: null,
                    endedAt: null,
                    lastActivityAt: null,
                },
            });

            // Create Teams and Participants
            for (const teamData of matchTeamsData) {
                const team = await tx.matchTeam.create({
                    data: {
                        matchId: newMatch.id,
                        name: teamData.name,
                    },
                });

                for (const memberId of teamData.memberIds) {
                    await tx.matchParticipant.create({
                        data: {
                            matchId: newMatch.id,
                            teamId: team.id,
                            playerId: memberId,
                        },
                    });
                }
            }

            return newMatch;
        });

        // Re-fetch with relations
        return await getMatch(match.id);
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al crear la partida:", error);
        return {
            success: false,
            message: "No se ha podido crear la partida",
        };
    }
}

export async function getMatch(id: string): Promise<ActionResponse<MatchWithDetails>> {
    try {
        await requireAdminSession();

        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                teams: true,
                participants: {
                    include: {
                        player: {
                            select: {
                                id: true,
                                nickname: true,
                                avatarUrl: true,
                                admin: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                        throws: true,
                    },
                    orderBy: {
                        createdAt: "asc", // or however we order turns
                    },
                },
                throws: {
                    orderBy: {
                        timestamp: "asc",
                    },
                },
            },
        });

        if (!match) {
            return {
                success: false,
                message: "No se ha encontrado la partida",
            };
        }

        return {
            success: true,
            data: match as MatchWithDetails,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar la partida:", error);
        return {
            success: false,
            message: "No se ha podido cargar la partida",
        };
    }
}

export async function registerThrow(matchId: string, throwData: RegisterThrowInput): Promise<MatchActionResponse<Throw>> {
    try {
        await requireAdminSession();

        const validated = registerThrowSchema.safeParse(throwData);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();
        const leaseUntil = nextLeaseUntil(now);

        // Calculate points if missing
        const points = validated.data.points ?? validated.data.segment * validated.data.multiplier;

        const newThrow = await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: {
                    id: matchId,
                },
                select: {
                    status: true,
                    controllerDeviceId: true,
                    controllerLeaseUntil: true,
                },
            });

            if (!match) {
                throw new Error("No se ha encontrado la partida");
            }

            if (match.status === "completed" || match.status === "aborted") {
                throw new Error(MATCH_ALREADY_FINISHED_MESSAGE);
            }

            if (match.controllerDeviceId && match.controllerDeviceId !== validated.data.deviceId && isLockValid(now, match.controllerLeaseUntil)) {
                throw new Error(LOCKED_BY_OTHER_DEVICE_MESSAGE);
            }

            const lockUpdate = await tx.match.updateMany({
                where: {
                    id: matchId,
                    status: {
                        notIn: ["completed", "aborted"],
                    },
                    OR: [
                        { controllerDeviceId: validated.data.deviceId },
                        { controllerDeviceId: null },
                        { controllerLeaseUntil: null },
                        { controllerLeaseUntil: { lte: now } },
                    ],
                },
                data: {
                    controllerDeviceId: validated.data.deviceId,
                    controllerLeaseUntil: leaseUntil,
                },
            });

            if (lockUpdate.count === 0) {
                throw new Error(LOCKED_BY_OTHER_DEVICE_MESSAGE);
            }

            const createdThrow = await tx.throw.create({
                data: {
                    matchId,
                    participantId: validated.data.participantId,
                    roundIndex: validated.data.roundIndex,
                    throwIndex: validated.data.throwIndex,
                    segment: validated.data.segment,
                    multiplier: validated.data.multiplier,
                    x: validated.data.x,
                    y: validated.data.y,
                    points: points,
                    isBust: validated.data.isBust ?? false,
                    isWin: validated.data.isWin ?? false,
                    isValid: validated.data.isValid ?? true,
                    timestamp: now,
                },
            });

            const shouldPromoteToOngoing = match.status === "setup";
            const nextStatus = createdThrow.isWin ? "completed" : shouldPromoteToOngoing ? "ongoing" : undefined;

            const matchUpdateData: {
                status?: string;
                lastActivityAt: Date;
                winnerId?: string | null;
                endedAt?: Date | null;
                controllerLeaseUntil: Date;
            } = {
                lastActivityAt: createdThrow.timestamp,
                controllerLeaseUntil: leaseUntil,
            };

            if (nextStatus) {
                matchUpdateData.status = nextStatus;
            }

            if (createdThrow.isWin) {
                const participant = await tx.matchParticipant.findUnique({
                    where: {
                        id: createdThrow.participantId,
                    },
                    select: {
                        playerId: true,
                    },
                });

                if (!participant) {
                    throw new Error("No se ha encontrado el participante ganador");
                }

                matchUpdateData.winnerId = participant.playerId;
                matchUpdateData.endedAt = createdThrow.timestamp;
            }

            await tx.match.update({
                where: {
                    id: matchId,
                },
                data: matchUpdateData,
            });

            return createdThrow;
        });

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
            data: newThrow,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        const safeError = getSafeActionErrorInfo(error);
        if (safeError) {
            return {
                success: false,
                message: safeError.message,
                code: safeError.code,
            };
        }

        console.error("Error al registrar el tiro:", error);
        return {
            success: false,
            message: "No se ha podido registrar el tiro",
        };
    }
}

export async function undoLastThrow(matchId: string): Promise<ActionResponse<void>> {
    try {
        await requireAdminSession();

        const deletedThrow = await prisma.$transaction(async (tx) => {
            const lastThrow = await tx.throw.findFirst({
                where: { matchId },
                orderBy: { timestamp: "desc" },
            });

            if (!lastThrow) {
                return null;
            }

            const removed = await tx.throw.delete({
                where: { id: lastThrow.id },
            });

            if (removed.isWin) {
                const lastWinningThrow = await tx.throw.findFirst({
                    where: {
                        matchId,
                        isWin: true,
                    },
                    orderBy: {
                        timestamp: "desc",
                    },
                    include: {
                        participant: {
                            select: {
                                playerId: true,
                            },
                        },
                    },
                });

                if (lastWinningThrow?.participant?.playerId) {
                    await tx.match.update({
                        where: {
                            id: matchId,
                        },
                        data: {
                            status: "completed",
                            winnerId: lastWinningThrow.participant.playerId,
                            endedAt: lastWinningThrow.timestamp,
                        },
                    });
                } else {
                    await tx.match.update({
                        where: {
                            id: matchId,
                        },
                        data: {
                            status: "ongoing",
                            winnerId: null,
                            endedAt: null,
                        },
                    });
                }
            }

            return removed;
        });

        if (!deletedThrow) {
            return {
                success: false,
                message: "No hay tiros para deshacer",
            };
        }

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al deshacer el tiro:", error);
        return {
            success: false,
            message: "No se ha podido deshacer el tiro",
        };
    }
}

export async function abortMatch(matchId: string): Promise<ActionResponse<void>> {
    try {
        await requireAdminSession();

        const validated = abortMatchSchema.safeParse({ matchId });
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();

        const updated = await prisma.match.updateMany({
            where: {
                id: validated.data.matchId,
                status: {
                    not: "completed",
                },
            },
            data: {
                status: "aborted",
                endedAt: now,
                winnerId: null,
                controllerDeviceId: null,
                controllerLeaseUntil: null,
                lastActivityAt: now,
            },
        });

        if (updated.count === 0) {
            return {
                success: false,
                message: "No se ha podido abortar la partida",
            };
        }

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al abortar la partida:", error);
        return {
            success: false,
            message: "No se ha podido abortar la partida",
        };
    }
}

export type RegisterThrowForPlayerInput = Omit<RegisterThrowInput, "participantId"> & {
    playerId: string;
};

export async function registerThrowForPlayer(matchId: string, throwData: RegisterThrowForPlayerInput): Promise<MatchActionResponse<Throw>> {
    try {
        await requireAdminSession();

        const validated = registerThrowForPlayerSchema.safeParse(throwData);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();
        const leaseUntil = nextLeaseUntil(now);

        const participant = await prisma.matchParticipant.findFirst({
            where: {
                matchId,
                playerId: validated.data.playerId,
            },
        });

        if (!participant) {
            return {
                success: false,
                message: "No se ha encontrado el participante de esta partida",
            };
        }

        // Calculate points if missing
        const points = validated.data.points ?? validated.data.segment * validated.data.multiplier;

        const newThrow = await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: {
                    id: matchId,
                },
                select: {
                    status: true,
                    controllerDeviceId: true,
                    controllerLeaseUntil: true,
                },
            });

            if (!match) {
                throw new Error("No se ha encontrado la partida");
            }

            if (match.status === "completed" || match.status === "aborted") {
                throw new Error(MATCH_ALREADY_FINISHED_MESSAGE);
            }

            if (match.controllerDeviceId && match.controllerDeviceId !== validated.data.deviceId && isLockValid(now, match.controllerLeaseUntil)) {
                throw new Error(LOCKED_BY_OTHER_DEVICE_MESSAGE);
            }

            const lockUpdate = await tx.match.updateMany({
                where: {
                    id: matchId,
                    status: {
                        notIn: ["completed", "aborted"],
                    },
                    OR: [
                        { controllerDeviceId: validated.data.deviceId },
                        { controllerDeviceId: null },
                        { controllerLeaseUntil: null },
                        { controllerLeaseUntil: { lte: now } },
                    ],
                },
                data: {
                    controllerDeviceId: validated.data.deviceId,
                    controllerLeaseUntil: leaseUntil,
                },
            });

            if (lockUpdate.count === 0) {
                throw new Error(LOCKED_BY_OTHER_DEVICE_MESSAGE);
            }

            const createdThrow = await tx.throw.create({
                data: {
                    matchId,
                    participantId: participant.id,
                    roundIndex: validated.data.roundIndex,
                    throwIndex: validated.data.throwIndex,
                    segment: validated.data.segment,
                    multiplier: validated.data.multiplier,
                    x: validated.data.x,
                    y: validated.data.y,
                    points,
                    isBust: validated.data.isBust ?? false,
                    isWin: validated.data.isWin ?? false,
                    isValid: validated.data.isValid ?? true,
                    timestamp: now,
                },
            });

            const shouldPromoteToOngoing = match.status === "setup";
            const nextStatus = createdThrow.isWin ? "completed" : shouldPromoteToOngoing ? "ongoing" : undefined;

            const matchUpdateData: {
                status?: string;
                lastActivityAt: Date;
                winnerId?: string | null;
                endedAt?: Date | null;
                controllerLeaseUntil: Date;
            } = {
                lastActivityAt: createdThrow.timestamp,
                controllerLeaseUntil: leaseUntil,
            };

            if (nextStatus) {
                matchUpdateData.status = nextStatus;
            }

            if (createdThrow.isWin) {
                matchUpdateData.winnerId = validated.data.playerId;
                matchUpdateData.endedAt = createdThrow.timestamp;
            }

            await tx.match.update({
                where: {
                    id: matchId,
                },
                data: matchUpdateData,
            });

            return createdThrow;
        });

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
            data: newThrow,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        const safeError = getSafeActionErrorInfo(error);
        if (safeError) {
            return {
                success: false,
                message: safeError.message,
                code: safeError.code,
            };
        }

        console.error("Error al registrar el tiro (por jugador):", error);
        return {
            success: false,
            message: "No se ha podido registrar el tiro",
        };
    }
}

export async function claimMatchControl(input: { matchId: string; deviceId: string }): Promise<MatchActionResponse<void>> {
    try {
        await requireAdminSession();

        const validated = matchControlSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();
        const leaseUntil = nextLeaseUntil(now);

        const match = await prisma.match.findUnique({
            where: {
                id: validated.data.matchId,
            },
            select: {
                status: true,
                controllerDeviceId: true,
                controllerLeaseUntil: true,
            },
        });

        if (!match) {
            return {
                success: false,
                message: "No se ha encontrado la partida",
            };
        }

        if (match.status === "completed" || match.status === "aborted") {
            return {
                success: false,
                message: MATCH_ALREADY_FINISHED_MESSAGE,
            };
        }

        if (match.controllerDeviceId && match.controllerDeviceId !== validated.data.deviceId && isLockValid(now, match.controllerLeaseUntil)) {
            return {
                success: false,
                message: LOCKED_BY_OTHER_DEVICE_MESSAGE,
                code: LOCKED_BY_OTHER_DEVICE_CODE,
            };
        }

        const updated = await prisma.match.updateMany({
            where: {
                id: validated.data.matchId,
                status: {
                    notIn: ["completed", "aborted"],
                },
                OR: [
                    { controllerDeviceId: validated.data.deviceId },
                    { controllerDeviceId: null },
                    { controllerLeaseUntil: null },
                    { controllerLeaseUntil: { lte: now } },
                ],
            },
            data: {
                controllerDeviceId: validated.data.deviceId,
                controllerLeaseUntil: leaseUntil,
            },
        });

        if (updated.count === 0) {
            return {
                success: false,
                message: LOCKED_BY_OTHER_DEVICE_MESSAGE,
                code: LOCKED_BY_OTHER_DEVICE_CODE,
            };
        }

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al reclamar el control de la partida:", error);
        return {
            success: false,
            message: "No se ha podido reclamar el control de la partida",
        };
    }
}

export async function releaseMatchControl(input: { matchId: string; deviceId: string }): Promise<ActionResponse<void>> {
    try {
        await requireAdminSession();

        const validated = matchControlSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const updated = await prisma.match.updateMany({
            where: {
                id: validated.data.matchId,
                controllerDeviceId: validated.data.deviceId,
            },
            data: {
                controllerDeviceId: null,
                controllerLeaseUntil: null,
            },
        });

        if (updated.count === 0) {
            return {
                success: false,
                message: "No se ha podido liberar el control de la partida",
            };
        }

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al liberar el control de la partida:", error);
        return {
            success: false,
            message: "No se ha podido liberar el control de la partida",
        };
    }
}

export async function forceTakeoverMatch(input: { matchId: string; deviceId: string }): Promise<ActionResponse<void>> {
    try {
        await requireAdminSession();

        const validated = matchControlSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();
        const leaseUntil = nextLeaseUntil(now);

        const match = await prisma.match.findUnique({
            where: {
                id: validated.data.matchId,
            },
            select: {
                status: true,
            },
        });

        if (!match) {
            return {
                success: false,
                message: "No se ha encontrado la partida",
            };
        }

        if (match.status === "completed" || match.status === "aborted") {
            return {
                success: false,
                message: MATCH_ALREADY_FINISHED_MESSAGE,
            };
        }

        await prisma.match.update({
            where: {
                id: validated.data.matchId,
            },
            data: {
                controllerDeviceId: validated.data.deviceId,
                controllerLeaseUntil: leaseUntil,
                lastActivityAt: now,
            },
        });

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al tomar el control de la partida:", error);
        return {
            success: false,
            message: "No se ha podido tomar el control de la partida",
        };
    }
}
