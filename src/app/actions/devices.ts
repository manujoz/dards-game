"use server";

import type { RegisterDeviceInput } from "@/types/actions/devices";
import type { ActionResponse } from "@/types/actions/shared";

import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";

const registerDeviceSchema = z.object({
    deviceId: z.string().uuid(),
    name: z.string().trim().min(1, "El nombre no puede estar vacío").max(80, "El nombre del dispositivo es demasiado largo").optional(),
});

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

export async function registerDevice(input: RegisterDeviceInput): Promise<ActionResponse<{ deviceId: string }>> {
    try {
        await requireAdminSession();

        const validated = registerDeviceSchema.safeParse(input);

        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const now = new Date();

        const device = await prisma.device.upsert({
            where: { id: validated.data.deviceId },
            create: {
                id: validated.data.deviceId,
                name: validated.data.name,
                lastSeenAt: now,
            },
            update: {
                name: validated.data.name ?? undefined,
                lastSeenAt: now,
            },
            select: {
                id: true,
            },
        });

        return {
            success: true,
            message: "Dispositivo registrado correctamente",
            data: { deviceId: device.id },
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al registrar el dispositivo:", error);
        return {
            success: false,
            message: "No se ha podido registrar el dispositivo",
        };
    }
}
