"use server";

import type { ChangePasswordInput, LoginAdminInput } from "@/lib/validation/auth";
import type { ActionResponse } from "@/types/actions/shared";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { changePasswordSchema, loginAdminSchema } from "@/lib/validation/auth";

const GENERIC_LOGIN_ERROR_MESSAGE = "Credenciales incorrectas";
const BCRYPT_SALT_ROUNDS = 12;

export async function loginAdmin(input: LoginAdminInput): Promise<ActionResponse<void>> {
    try {
        const validated = loginAdminSchema.safeParse(input);

        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const player = await prisma.player.findFirst({
            where: {
                nickname: {
                    equals: validated.data.nickname,
                    mode: "insensitive",
                },
                admin: true,
            },
            select: {
                id: true,
                nickname: true,
                password: true,
                admin: true,
            },
        });

        if (!player?.admin || !player.password) {
            return {
                success: false,
                message: GENERIC_LOGIN_ERROR_MESSAGE,
            };
        }

        const ok = await bcrypt.compare(validated.data.password, player.password);

        if (!ok) {
            return {
                success: false,
                message: GENERIC_LOGIN_ERROR_MESSAGE,
            };
        }

        const token = await createSessionToken({
            playerId: player.id,
            nickname: player.nickname,
            admin: true,
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

        revalidatePath("/");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error al iniciar sesión de admin:", error);
        return {
            success: false,
            message: "No se ha podido iniciar sesión",
        };
    }
}

export async function logout(): Promise<ActionResponse<void>> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE_NAME);

        revalidatePath("/");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        return {
            success: false,
            message: "No se ha podido cerrar sesión",
        };
    }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResponse<void>> {
    try {
        const session = await requireAdminSession();

        const validated = changePasswordSchema.safeParse(input);

        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const player = await prisma.player.findUnique({
            where: { id: session.playerId },
            select: {
                id: true,
                password: true,
            },
        });

        if (!player) {
            return {
                success: false,
                message: "No se ha encontrado el usuario",
            };
        }

        if (!player.password) {
            return {
                success: false,
                message: "Este usuario no tiene una contraseña configurada",
            };
        }

        const ok = await bcrypt.compare(validated.data.currentPassword, player.password);

        if (!ok) {
            return {
                success: false,
                message: "La contraseña actual no es correcta",
            };
        }

        const nextHash = await bcrypt.hash(validated.data.newPassword, BCRYPT_SALT_ROUNDS);

        await prisma.player.update({
            where: { id: player.id },
            data: { password: nextHash },
        });

        revalidatePath("/");
        revalidatePath("/admin/account");

        return {
            success: true,
            message: "Contraseña actualizada correctamente",
        };
    } catch (error) {
        if (error instanceof Error && error.message === "No autorizado") {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cambiar la contraseña:", error);
        return {
            success: false,
            message: "No se ha podido cambiar la contraseña",
        };
    }
}
