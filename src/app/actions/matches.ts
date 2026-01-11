"use server";

import { prisma } from "@/lib/db/prisma";
import { createMatchSchema, type CreateMatchInput } from "@/lib/validation/matches";
import { type ActionResponse } from "@/types/actions/shared";
import { type Match, type MatchParticipant, type MatchTeam, type Player, type Throw } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Extended types for return values including relations
export type MatchWithDetails = Match & {
    teams: MatchTeam[];
    participants: (MatchParticipant & { player: Player })[];
    throws: Throw[];
};

export type MatchListEntry = Match & {
    teams: MatchTeam[];
    participants: (MatchParticipant & { player: Player })[];
};

export async function getMatches(limit = 50): Promise<ActionResponse<MatchListEntry[]>> {
    try {
        const matches = await prisma.match.findMany({
            take: limit,
            orderBy: {
                startedAt: "desc",
            },
            include: {
                teams: true,
                participants: {
                    include: {
                        player: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: matches,
        };
    } catch (error) {
        console.error("Error fetching matches:", error);
        return {
            success: false,
            message: "Failed to fetch matches",
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
        const validated = createMatchSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "Validation failed",
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
                name: `Team ${idx + 1}`,
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
                    name: p?.nickname || "Unknown",
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
        console.error("Error creating match:", error);
        return {
            success: false,
            message: "Failed to create match",
        };
    }
}

export async function getMatch(id: string): Promise<ActionResponse<MatchWithDetails>> {
    try {
        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                teams: true,
                participants: {
                    include: {
                        player: true,
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
                message: "Match not found",
            };
        }

        return {
            success: true,
            data: match as MatchWithDetails,
        };
    } catch (error) {
        console.error("Error fetching match:", error);
        return {
            success: false,
            message: "Failed to fetch match",
        };
    }
}

export async function registerThrow(matchId: string, throwData: RegisterThrowInput): Promise<ActionResponse<Throw>> {
    try {
        // Calculate points if missing
        const points = throwData.points ?? throwData.segment * throwData.multiplier;

        const newThrow = await prisma.throw.create({
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

        revalidatePath(`/match/${matchId}`);

        return {
            success: true,
            data: newThrow,
        };
    } catch (error) {
        console.error("Error registering throw:", error);
        return {
            success: false,
            message: "Failed to register throw",
        };
    }
}

export async function undoLastThrow(matchId: string): Promise<ActionResponse<void>> {
    try {
        const lastThrow = await prisma.throw.findFirst({
            where: { matchId },
            orderBy: { timestamp: "desc" },
        });

        if (!lastThrow) {
            return {
                success: false,
                message: "No throws to undo",
            };
        }

        await prisma.throw.delete({
            where: { id: lastThrow.id },
        });

        revalidatePath(`/match/${matchId}`);

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error undoing throw:", error);
        return {
            success: false,
            message: "Failed to undo throw",
        };
    }
}

export type RegisterThrowForPlayerInput = Omit<RegisterThrowInput, "participantId"> & {
    playerId: string;
};

export async function registerThrowForPlayer(matchId: string, throwData: RegisterThrowForPlayerInput): Promise<ActionResponse<Throw>> {
    try {
        const participant = await prisma.matchParticipant.findFirst({
            where: {
                matchId,
                playerId: throwData.playerId,
            },
        });

        if (!participant) {
            return {
                success: false,
                message: "Participant not found for this match",
            };
        }

        // Calculate points if missing
        const points = throwData.points ?? throwData.segment * throwData.multiplier;

        const newThrow = await prisma.throw.create({
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

        revalidatePath("/matches");
        revalidatePath("/game");

        return {
            success: true,
            data: newThrow,
        };
    } catch (error) {
        console.error("Error registering throw (by player):", error);
        return {
            success: false,
            message: "Failed to register throw",
        };
    }
}
