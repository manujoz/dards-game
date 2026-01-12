import { z } from "zod";

/**
 * Calibración unificada (Opción B): compatible con `CalibrationConfig`.
 *
 * NOTA: estos valores se almacenan en coordenadas locales del área de diana (px),
 * y `scale` representa px/mm.
 */
export const calibrationConfigSchema = z.object({
    centerX: z.number().finite(),
    centerY: z.number().finite(),
    scale: z.number().positive(),
    rotation: z.number().finite(),
    aspectRatio: z.number().positive().optional(),
});

/**
 * Forma persistida en BD. Permitimos `null` para representar "sin calibración".
 *
 * La compatibilidad legacy se rompe a propósito: shapes antiguos NO validarán.
 */
export const storedCalibrationSchema = calibrationConfigSchema.nullable();

export const devicePreferencesSchema = z.object({
    soundVolume: z.number().min(0).max(100).default(50),
    brightness: z.number().min(0).max(100).default(100),
    language: z.enum(["en", "es", "ca"]).default("en"),
    theme: z.enum(["light", "dark", "system"]).default("dark"),
    animationsEnabled: z.boolean().default(true),
});

export const deviceConfigSchema = z.object({
    calibration: storedCalibrationSchema,
    preferences: devicePreferencesSchema,
});

export type DeviceConfigInput = z.infer<typeof deviceConfigSchema>;
