"use server";

import type { ActionResponse } from "@/types/actions/shared";
import type { Player } from "@prisma/client";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { processAvatarFile } from "@/lib/images/avatar";
import { playerSchema, type PlayerInput } from "@/lib/validation/players";

const BCRYPT_SALT_ROUNDS = 12;

const playerIdSchema = z.string().uuid();

const playerFormSchema = z.object({
    nickname: playerSchema.shape.nickname,
});

const deletePlayerSchema = z.object({
    playerId: z.string().uuid(),
    performedByPlayerId: z.string().uuid().optional(),
});

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

function sanitizePlayer(player: Player): Player {
    return {
        ...player,
        password: null,
    };
}

export async function createPlayer(input: PlayerInput): Promise<ActionResponse<Player>> {
    try {
        await requireAdminSession();

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
            data: sanitizePlayer(player),
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
        await requireAdminSession();

        const nickname = formData.get("nickname");
        const avatar = formData.get("avatar");

        const adminRaw = formData.get("admin");
        const admin = typeof adminRaw === "string" && (adminRaw === "true" || adminRaw === "on" || adminRaw === "1");

        const passwordRaw = formData.get("password");
        const confirmPasswordRaw = formData.get("confirmPassword");

        const password = typeof passwordRaw === "string" ? passwordRaw : undefined;
        const confirmPassword = typeof confirmPasswordRaw === "string" ? confirmPasswordRaw : undefined;

        const createAdminSchema = z
            .object({
                nickname: playerSchema.shape.nickname,
                admin: z.boolean(),
                password: z.string().optional(),
                confirmPassword: z.string().optional(),
            })
            .superRefine((data, ctx) => {
                if (!data.admin) {
                    return;
                }

                if (!data.password || data.password.trim().length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["password"],
                        message: "La contraseña es obligatoria para administradores",
                    });
                    return;
                }

                if (data.password.length < 6) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.too_small,
                        path: ["password"],
                        minimum: 6,
                        type: "string",
                        inclusive: true,
                        message: "La contraseña debe tener al menos 6 caracteres",
                    });
                }

                if (data.password.length > 72) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.too_big,
                        path: ["password"],
                        maximum: 72,
                        type: "string",
                        inclusive: true,
                        message: "La contraseña debe tener como máximo 72 caracteres",
                    });
                }

                if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["confirmPassword"],
                        message: "Confirma la contraseña",
                    });
                    return;
                }

                if (data.password !== data.confirmPassword) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["confirmPassword"],
                        message: "Las contraseñas no coinciden",
                    });
                }
            });

        const validated = createAdminSchema.safeParse({
            nickname: typeof nickname === "string" ? nickname : "",
            admin,
            password,
            confirmPassword,
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

        const hashedPassword =
            validated.data.admin && validated.data.password ? await bcrypt.hash(validated.data.password, BCRYPT_SALT_ROUNDS) : null;

        const player = await prisma.player.create({
            data: {
                nickname: validated.data.nickname,
                avatarUrl,
                admin: validated.data.admin,
                password: validated.data.admin ? hashedPassword : null,
            },
        });

        revalidatePath("/players");
        revalidatePath("/");

        return {
            success: true,
            data: sanitizePlayer(player),
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
        await requireAdminSession();

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
            data: sanitizePlayer(updated),
        };
    } catch (error) {
        console.error("Error al actualizar el jugador con avatar:", error);
        return {
            success: false,
            message: "No se ha podido actualizar el jugador",
        };
    }
}

export async function deletePlayer(input: { playerId: string; performedByPlayerId?: string }): Promise<ActionResponse<void>> {
    try {
        await requireAdminSession();

        const validated = deletePlayerSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
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
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al eliminar el jugador:", error);
        return {
            success: false,
            message: "No se ha podido eliminar el jugador",
        };
    }
}

export async function getPlayers(): Promise<ActionResponse<Player[]>> {
    try {
        await requireAdminSession();

        const players = await prisma.player.findMany({
            orderBy: {
                nickname: "asc",
            },
        });

        return {
            success: true,
            data: players.map(sanitizePlayer),
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar los jugadores:", error);
        return {
            success: false,
            message: "No se han podido cargar los jugadores",
        };
    }
}
