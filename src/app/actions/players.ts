"use server";

import { prisma } from "@/lib/db/prisma";
import { processAvatarFile } from "@/lib/images/avatar";
import { playerSchema, type PlayerInput } from "@/lib/validation/players";
import { type ActionResponse } from "@/types/actions/shared";
import { type Player } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const playerIdSchema = z.string().uuid();

const playerFormSchema = z.object({
    nickname: playerSchema.shape.nickname,
});

const deletePlayerSchema = z.object({
    playerId: z.string().uuid(),
    performedByPlayerId: z.string().uuid(),
});

export async function createPlayer(input: PlayerInput): Promise<ActionResponse<Player>> {
    try {
        const validated = playerSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const existing = await prisma.player.findUnique({
            where: { nickname: validated.data.nickname },
        });

        if (existing) {
            return {
                success: false,
                message: "Ese apodo ya está en uso",
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
        console.error("Error al crear el jugador:", error);
        return {
            success: false,
            message: "No se ha podido crear el jugador",
        };
    }
}

export async function createPlayerWithAvatar(formData: FormData): Promise<ActionResponse<Player>> {
    try {
        const nickname = formData.get("nickname");
        const avatar = formData.get("avatar");

        const validated = playerFormSchema.safeParse({
            nickname: typeof nickname === "string" ? nickname : "",
        });

        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const existing = await prisma.player.findUnique({
            where: { nickname: validated.data.nickname },
        });

        if (existing) {
            return {
                success: false,
                message: "Ese apodo ya está en uso",
            };
        }

        let avatarUrl: string | null = null;
        if (avatar instanceof File && avatar.size > 0) {
            const processed = await processAvatarFile(avatar);
            avatarUrl = processed.dataUrl;
        }

        const player = await prisma.player.create({
            data: {
                nickname: validated.data.nickname,
                avatarUrl,
            },
        });

        revalidatePath("/players");
        revalidatePath("/");

        return {
            success: true,
            data: player,
        };
    } catch (error) {
        console.error("Error al crear el jugador con avatar:", error);
        return {
            success: false,
            message: "No se ha podido crear el jugador",
        };
    }
}

export async function updatePlayerWithAvatar(formData: FormData): Promise<ActionResponse<Player>> {
    try {
        const id = formData.get("id");
        const nickname = formData.get("nickname");
        const avatar = formData.get("avatar");
        const removeAvatar = formData.get("removeAvatar");

        const parsedId = playerIdSchema.safeParse(typeof id === "string" ? id : "");
        if (!parsedId.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: { id: ["ID inválido"] },
            };
        }

        const validated = playerFormSchema.safeParse({
            nickname: typeof nickname === "string" ? nickname : "",
        });

        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const existing = await prisma.player.findUnique({
            where: { id: parsedId.data },
        });

        if (!existing) {
            return {
                success: false,
                message: "No se ha encontrado el jugador",
            };
        }

        const nicknameTaken = await prisma.player.findFirst({
            where: {
                nickname: validated.data.nickname,
                NOT: { id: parsedId.data },
            },
        });

        if (nicknameTaken) {
            return {
                success: false,
                message: "Ese apodo ya está en uso",
            };
        }

        let avatarUrl: string | null | undefined;

        if (removeAvatar === "true") {
            avatarUrl = null;
        } else if (avatar instanceof File && avatar.size > 0) {
            const processed = await processAvatarFile(avatar);
            avatarUrl = processed.dataUrl;
        } else {
            avatarUrl = undefined;
        }

        const updated = await prisma.player.update({
            where: { id: parsedId.data },
            data: {
                nickname: validated.data.nickname,
                ...(avatarUrl !== undefined ? { avatarUrl } : {}),
            },
        });

        revalidatePath("/players");
        revalidatePath("/");

        return {
            success: true,
            data: updated,
        };
    } catch (error) {
        console.error("Error al actualizar el jugador con avatar:", error);
        return {
            success: false,
            message: "No se ha podido actualizar el jugador",
        };
    }
}

export async function deletePlayer(input: { playerId: string; performedByPlayerId: string }): Promise<ActionResponse<void>> {
    try {
        const validated = deletePlayerSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const performer = await prisma.player.findUnique({
            where: { id: validated.data.performedByPlayerId },
            select: { id: true, admin: true },
        });

        if (!performer?.admin) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        const target = await prisma.player.findUnique({
            where: { id: validated.data.playerId },
            select: { id: true, admin: true },
        });

        if (!target) {
            return {
                success: false,
                message: "No se ha encontrado el jugador",
            };
        }

        if (target.admin) {
            return {
                success: false,
                message: "No se pueden eliminar jugadores admin",
            };
        }

        await prisma.player.delete({
            where: { id: validated.data.playerId },
        });

        revalidatePath("/players");
        revalidatePath("/");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error al eliminar el jugador:", error);
        return {
            success: false,
            message: "No se ha podido eliminar el jugador",
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
        console.error("Error al cargar los jugadores:", error);
        return {
            success: false,
            message: "No se han podido cargar los jugadores",
        };
    }
}
