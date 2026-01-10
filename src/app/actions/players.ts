"use server";

import { prisma } from "@/lib/db/prisma";
import { playerSchema, type PlayerInput } from "@/lib/validation/players";
import { type ActionResponse } from "@/types/actions/shared";
import { type Player } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createPlayer(input: PlayerInput): Promise<ActionResponse<Player>> {
    try {
        const validated = playerSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "Validation failed",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const existing = await prisma.player.findUnique({
            where: { nickname: validated.data.nickname },
        });

        if (existing) {
            return {
                success: false,
                message: "Nickname already taken",
            };
        }

        const player = await prisma.player.create({
            data: {
                nickname: validated.data.nickname,
                avatarUrl: validated.data.avatarUrl || null,
            },
        });

        revalidatePath("/players");
        revalidatePath("/"); // In case players are listed on home or setup

        return {
            success: true,
            data: player,
        };
    } catch (error) {
        console.error("Error creating player:", error);
        return {
            success: false,
            message: "Failed to create player",
        };
    }
}

export async function getPlayers(): Promise<ActionResponse<Player[]>> {
    try {
        const players = await prisma.player.findMany({
            orderBy: {
                nickname: "asc",
            },
        });

        return {
            success: true,
            data: players,
        };
    } catch (error) {
        console.error("Error fetching players:", error);
        return {
            success: false,
            message: "Failed to fetch players",
        };
    }
}
