import type { CalibrationConfig } from "@/types/models/darts";
import type { DeviceConfig } from "@prisma/client";

import type { ActionResponse } from "./shared";

export type DeviceLanguage = "en" | "es" | "ca";
export type DeviceTheme = "light" | "dark" | "system";

export interface DevicePreferences {
    soundVolume: number;
    brightness: number;
    language: DeviceLanguage;
    theme: DeviceTheme;
    animationsEnabled: boolean;
}

export interface ParsedDeviceConfig extends Omit<DeviceConfig, "calibration" | "preferences"> {
    calibration: CalibrationConfig | null;
    preferences: DevicePreferences;
}

export type GetDeviceConfigAction = (deviceId: string) => Promise<ActionResponse<ParsedDeviceConfig>>;
export type UpdateCalibrationAction = (deviceId: string, input: CalibrationConfig) => Promise<ActionResponse<ParsedDeviceConfig>>;
export type UpdatePreferencesAction = (deviceId: string, input: DevicePreferences) => Promise<ActionResponse<ParsedDeviceConfig>>;
