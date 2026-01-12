"use server";

import type { CalibrationConfig } from "@/types/models/darts";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { calibrationConfigSchema, devicePreferencesSchema, storedCalibrationSchema } from "@/lib/validation/device-config";
import type { DevicePreferences, ParsedDeviceConfig } from "@/types/actions/device-config";
import type { ActionResponse } from "@/types/actions/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const deviceIdSchema = z.string().uuid();

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

function parseJsonSafe(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

export async function getDeviceConfig(deviceId: string): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        await requireAdminSession();

        const deviceIdResult = deviceIdSchema.safeParse(deviceId);
        if (!deviceIdResult.success) {
            return {
                success: false,
                message: "deviceId inválido",
            };
        }

        let config = await prisma.deviceConfig.findUnique({
            where: {
                deviceId,
            },
        });

        if (!config) {
            // Create default if none exists
            config = await prisma.deviceConfig.create({
                data: {
                    deviceId,
                    calibration: JSON.stringify(null),
                    preferences: JSON.stringify({}),
                },
            });
        }

        const rawCal = parseJsonSafe(config.calibration);
        const calibrationResult = storedCalibrationSchema.safeParse(rawCal);
        const parsedCalibration = calibrationResult.success ? calibrationResult.data : null;

        const rawPrefs = parseJsonSafe(config.preferences) ?? {};
        const preferencesResult = devicePreferencesSchema.safeParse(rawPrefs);
        const parsedPreferences: DevicePreferences = preferencesResult.success ? preferencesResult.data : devicePreferencesSchema.parse({});

        return {
            success: true,
            data: {
                ...config,
                calibration: parsedCalibration,
                preferences: parsedPreferences,
            },
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al obtener la configuración del dispositivo:", error);
        return {
            success: false,
            message: "No se ha podido cargar la configuración del dispositivo",
        };
    }
}

export async function updateCalibration(deviceId: string, input: CalibrationConfig): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        await requireAdminSession();

        const deviceIdResult = deviceIdSchema.safeParse(deviceId);
        if (!deviceIdResult.success) {
            return {
                success: false,
                message: "deviceId inválido",
            };
        }

        const validated = calibrationConfigSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const dataStr = JSON.stringify(validated.data);

        await prisma.deviceConfig.upsert({
            where: {
                deviceId,
            },
            update: {
                calibration: dataStr,
            },
            create: {
                deviceId,
                calibration: dataStr,
                preferences: JSON.stringify({}),
            },
        });

        revalidatePath("/game");
        revalidatePath("/");

        // Return parsed
        return await getDeviceConfig(deviceId);
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al actualizar la calibración:", error);
        return {
            success: false,
            message: "No se ha podido actualizar la calibración",
        };
    }
}

export async function updatePreferences(deviceId: string, input: DevicePreferences): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        await requireAdminSession();

        const deviceIdResult = deviceIdSchema.safeParse(deviceId);
        if (!deviceIdResult.success) {
            return {
                success: false,
                message: "deviceId inválido",
            };
        }

        const validated = devicePreferencesSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "La validación ha fallado",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const dataStr = JSON.stringify(validated.data);

        await prisma.deviceConfig.upsert({
            where: {
                deviceId,
            },
            update: {
                preferences: dataStr,
            },
            create: {
                deviceId,
                calibration: JSON.stringify(null),
                preferences: dataStr,
            },
        });

        revalidatePath("/game");
        revalidatePath("/");

        return await getDeviceConfig(deviceId);
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al actualizar las preferencias:", error);
        return {
            success: false,
            message: "No se han podido actualizar las preferencias",
        };
    }
}
