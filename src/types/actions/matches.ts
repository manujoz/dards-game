import { CreateMatchInput } from "@/lib/validation/matches";
import { ActionResponse } from "./shared";
// Depending on how much data we return for a match, we might use the Match model from Prisma or a mapped type
import { Match } from "@prisma/client";

export type CreateMatchAction = (input: CreateMatchInput) => Promise<ActionResponse<Match>>;
export type CancelMatchAction = (matchId: string) => Promise<ActionResponse<void>>;
export type GetActiveMatchAction = (matchId: string) => Promise<ActionResponse<Match>>;
