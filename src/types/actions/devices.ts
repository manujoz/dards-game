import { ActionResponse } from "./shared";

export interface RegisterDeviceInput {
    deviceId: string; // UUID
    name?: string;
}

export type RegisterDeviceAction = (input: RegisterDeviceInput) => Promise<ActionResponse<{ deviceId: string }>>;
