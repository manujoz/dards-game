import { z } from "zod";

export const pointCalibrationSchema = z.object({
    x: z.number(),
    y: z.number(),
    segment: z.number(),
    ring: z.string(), // "single", "double", "triple", "bull", "bullseye"
});

export const deviceCalibrationSchema = z.object({
    matrix: z.array(z.array(z.number())), // Transformation matrix if needed
    quadrants: z.array(pointCalibrationSchema).optional(), // Calibration points
    scaleX: z.number().default(1),
    scaleY: z.number().default(1),
    offsetX: z.number().default(0),
    offsetY: z.number().default(0),
});

export const devicePreferencesSchema = z.object({
    soundVolume: z.number().min(0).max(100).default(50),
    brightness: z.number().min(0).max(100).default(100),
    language: z.enum(["en", "es", "ca"]).default("en"),
    theme: z.enum(["light", "dark", "system"]).default("dark"),
    animationsEnabled: z.boolean().default(true),
});

export const deviceConfigSchema = z.object({
    calibration: deviceCalibrationSchema,
    preferences: devicePreferencesSchema,
});

export type DeviceConfigInput = z.infer<typeof deviceConfigSchema>;
