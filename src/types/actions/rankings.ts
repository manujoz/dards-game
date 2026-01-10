import { Player } from "@/types/models/darts";
import { ActionResponse } from "./shared";

export interface RankingEntry {
    rank: number;
    player: Player;
    score: number; // Elo, Win rate, Total points, etc.
    stats: {
        matchesPlayed: number;
        matchesWon: number;
        ppd?: number; // Points Per Dart
        mpr?: number; // Marks Per Round
    };
}

export type GetRankingAction = (gameType?: "x01" | "cricket" | "all") => Promise<ActionResponse<RankingEntry[]>>;
