"use server";

import { prisma } from "@/lib/db/prisma";
import { deviceCalibrationSchema, devicePreferencesSchema } from "@/lib/validation/device-config";
import { type ActionResponse } from "@/types/actions/shared";
import { type DeviceConfig } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type DeviceCalibration = z.infer<typeof deviceCalibrationSchema>;
type DevicePreferences = z.infer<typeof devicePreferencesSchema>;

export interface ParsedDeviceConfig extends Omit<DeviceConfig, "calibration" | "preferences"> {
    calibration: DeviceCalibration;
    preferences: DevicePreferences;
}

export async function getDeviceConfig(): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        let config = await prisma.deviceConfig.findFirst();

        if (!config) {
            // Create default if none exists
            config = await prisma.deviceConfig.create({
                data: {
                    calibration: JSON.stringify({}),
                    preferences: JSON.stringify({}),
                },
            });
        }

        // Parse JSON fields
        // We use safe parsing or default to empty objects if parsing fails/schema mismatch precaution
        // However data should be valid if created via app.
        // For new default, JSON.stringify({}) might fail validation if schema requires fields.
        // But schema has defaults.

        let parsedCalibration: DeviceCalibration;
        let parsedPreferences: DevicePreferences;

        try {
            const rawCal = JSON.parse(config.calibration) || {};
            const result = deviceCalibrationSchema.safeParse(rawCal);
            parsedCalibration = result.success ? result.data : deviceCalibrationSchema.parse({});
        } catch {
            parsedCalibration = deviceCalibrationSchema.parse({});
        }

        try {
            const rawPrefs = JSON.parse(config.preferences) || {};
            const result = devicePreferencesSchema.safeParse(rawPrefs);
            parsedPreferences = result.success ? result.data : devicePreferencesSchema.parse({});
        } catch {
            parsedPreferences = devicePreferencesSchema.parse({});
        }

        return {
            success: true,
            data: {
                ...config,
                calibration: parsedCalibration,
                preferences: parsedPreferences,
            },
        };
    } catch (error) {
        console.error("Error getting device config:", error);
        return {
            success: false,
            message: "Failed to get device config",
        };
    }
}

export async function updateCalibration(input: DeviceCalibration): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        const validated = deviceCalibrationSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "Validation failed",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        // Check if config exists, if not create, else update first found
        const existing = await prisma.deviceConfig.findFirst();

        const dataStr = JSON.stringify(validated.data);

        if (existing) {
            await prisma.deviceConfig.update({
                where: { id: existing.id },
                data: { calibration: dataStr },
            });
        } else {
            await prisma.deviceConfig.create({
                data: {
                    calibration: dataStr,
                    preferences: JSON.stringify({}),
                },
            });
        }

        revalidatePath("/game");
        revalidatePath("/");

        // Return parsed
        return await getDeviceConfig();
    } catch (error) {
        console.error("Error updating calibration:", error);
        return {
            success: false,
            message: "Failed to update calibration",
        };
    }
}

export async function updatePreferences(input: DevicePreferences): Promise<ActionResponse<ParsedDeviceConfig>> {
    try {
        const validated = devicePreferencesSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                message: "Validation failed",
                errors: validated.error.flatten().fieldErrors,
            };
        }

        const existing = await prisma.deviceConfig.findFirst();
        const dataStr = JSON.stringify(validated.data);

        if (existing) {
            await prisma.deviceConfig.update({
                where: { id: existing.id },
                data: { preferences: dataStr },
            });
        } else {
            await prisma.deviceConfig.create({
                data: {
                    calibration: JSON.stringify({}),
                    preferences: dataStr,
                },
            });
        }

        revalidatePath("/game");
        revalidatePath("/");

        return await getDeviceConfig();
    } catch (error) {
        console.error("Error updating preferences:", error);
        return {
            success: false,
            message: "Failed to update preferences",
        };
    }
}
