import type { GameId, Player } from "@/types/models/darts";

import type { ActionResponse } from "./shared";

export type RankingGameType = GameId | "all";

export type RankingVariantGameType = Exclude<RankingGameType, "all">;

export interface GetRankingsRequest {
    gameType: RankingGameType;
    variantKey?: string;
    limit?: number;
}

export interface RankingEntry {
    rank: number;
    player: Player;

    variantKey: string;
    ratingElo: number;
    isProvisional: boolean;

    matchesPlayed: number;
    matchesWon: number;

    pointsAggregated: number;
    marksAggregated: number | null;

    ppd: number | null; // Points per dart
    mpr: number | null; // Marks per round

    lastMatchAt: string | null; // ISO
}

export interface RankingVariantOption {
    variantKey: string;
    label: string;
    matchCount: number;
}

export type GetRankingsAction = (input?: GetRankingsRequest | RankingGameType) => Promise<ActionResponse<RankingEntry[]>>;

export type GetRankingVariantsAction = (gameType: RankingVariantGameType) => Promise<ActionResponse<RankingVariantOption[]>>;
