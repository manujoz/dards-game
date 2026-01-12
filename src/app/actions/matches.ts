"use server";

import { type ActionResponse } from "@/types/actions/shared";
import { type Match, type MatchParticipant, type MatchTeam, type Player, type Throw } from "@prisma/client";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { createMatchSchema, type CreateMatchInput } from "@/lib/validation/matches";

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

type PublicPlayer = Omit<Player, "password">;

type WinningThrowInfo = {
    participantId: string;
    timestamp: Date;
    participant: {
        playerId: string;
    };
};

// Extended types for return values including relations (sin exponer password)
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

export async function getMatches(limit = 50): Promise<ActionResponse<MatchListEntry[]>> {
    try {
        await requireAdminSession();

        const matches = await prisma.match.findMany({
            take: limit,
            orderBy: {
                startedAt: "desc",
            },
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
                    status: "ongoing", // or created/pending
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

export async function registerThrow(matchId: string, throwData: RegisterThrowInput): Promise<ActionResponse<Throw>> {
    try {
        await requireAdminSession();

        // Calculate points if missing
        const points = throwData.points ?? throwData.segment * throwData.multiplier;

        const newThrow = await prisma.$transaction(async (tx) => {
            const createdThrow = await tx.throw.create({
                data: {
                    matchId,
                    participantId: throwData.participantId,
                    roundIndex: throwData.roundIndex,
                    throwIndex: throwData.throwIndex,
                    segment: throwData.segment,
                    multiplier: throwData.multiplier,
                    x: throwData.x,
                    y: throwData.y,
                    points: points,
                    isBust: throwData.isBust ?? false,
                    isWin: throwData.isWin ?? false,
                    isValid: throwData.isValid ?? true,
                },
            });

            if (createdThrow.isWin) {
                const participant = await tx.matchParticipant.findUnique({
                    where: {
                        id: createdThrow.participantId,
                    },
                    select: {
                        playerId: true,
                    },
                });

                if (participant) {
                    await tx.match.update({
                        where: {
                            id: matchId,
                        },
                        data: {
                            status: "completed",
                            winnerId: participant.playerId,
                            endedAt: createdThrow.timestamp,
                        },
                    });
                }
            }

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

export type RegisterThrowForPlayerInput = Omit<RegisterThrowInput, "participantId"> & {
    playerId: string;
};

export async function registerThrowForPlayer(matchId: string, throwData: RegisterThrowForPlayerInput): Promise<ActionResponse<Throw>> {
    try {
        await requireAdminSession();

        const participant = await prisma.matchParticipant.findFirst({
            where: {
                matchId,
                playerId: throwData.playerId,
            },
        });

        if (!participant) {
            return {
                success: false,
                message: "No se ha encontrado el participante de esta partida",
            };
        }

        // Calculate points if missing
        const points = throwData.points ?? throwData.segment * throwData.multiplier;

        const newThrow = await prisma.$transaction(async (tx) => {
            const createdThrow = await tx.throw.create({
                data: {
                    matchId,
                    participantId: participant.id,
                    roundIndex: throwData.roundIndex,
                    throwIndex: throwData.throwIndex,
                    segment: throwData.segment,
                    multiplier: throwData.multiplier,
                    x: throwData.x,
                    y: throwData.y,
                    points,
                    isBust: throwData.isBust ?? false,
                    isWin: throwData.isWin ?? false,
                    isValid: throwData.isValid ?? true,
                },
            });

            if (createdThrow.isWin) {
                await tx.match.update({
                    where: {
                        id: matchId,
                    },
                    data: {
                        status: "completed",
                        winnerId: throwData.playerId,
                        endedAt: createdThrow.timestamp,
                    },
                });
            }

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

        console.error("Error al registrar el tiro (por jugador):", error);
        return {
            success: false,
            message: "No se ha podido registrar el tiro",
        };
    }
}
