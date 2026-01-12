import { CreateMatchInput } from "@/lib/validation/matches";
import { ActionResponse } from "./shared";
// Depending on how much data we return for a match, we might use the Match model from Prisma or a mapped type
import { Match } from "@prisma/client";

export type MatchActionErrorCode = "LOCKED_BY_OTHER_DEVICE";

export type MatchActionResponse<T> = ActionResponse<T> & {
    code?: MatchActionErrorCode;
};

export interface RegisterThrowInput {
    deviceId: string;
    participantId: string;
    segment: number;
    multiplier: number;
    x: number;
    y: number;
    points?: number;
    isBust?: boolean;
    isWin?: boolean;
    isValid?: boolean;
    roundIndex: number;
    throwIndex: number;
}

export type RegisterThrowForPlayerInput = Omit<RegisterThrowInput, "participantId"> & {
    playerId: string;
};

export interface MatchControlInput {
    matchId: string;
    deviceId: string;
}

export type ClaimMatchControlAction = (input: MatchControlInput) => Promise<ActionResponse<void>>;
export type ReleaseMatchControlAction = (input: MatchControlInput) => Promise<ActionResponse<void>>;
export type ForceTakeoverMatchAction = (input: MatchControlInput) => Promise<ActionResponse<void>>;

export type CreateMatchAction = (input: CreateMatchInput) => Promise<ActionResponse<Match>>;
export type CancelMatchAction = (matchId: string) => Promise<ActionResponse<void>>;
export type GetActiveMatchAction = (matchId: string) => Promise<ActionResponse<Match>>;
