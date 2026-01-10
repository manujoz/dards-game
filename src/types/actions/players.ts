import { PlayerInput } from "@/lib/validation/players";
import { Player } from "@/types/models/darts";
import { ActionResponse } from "./shared";

export type CreatePlayerAction = (input: PlayerInput) => Promise<ActionResponse<Player>>;
export type UpdatePlayerAction = (id: string, input: PlayerInput) => Promise<ActionResponse<Player>>;
export type DeletePlayerAction = (id: string) => Promise<ActionResponse<void>>;
export type GetPlayersAction = () => Promise<ActionResponse<Player[]>>;
