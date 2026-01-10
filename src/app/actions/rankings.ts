"use server";

import { type RankingEntry } from "@/types/actions/rankings";
import { type ActionResponse } from "@/types/actions/shared";

export async function getRankings(gameType: "x01" | "cricket" | "all" = "all"): Promise<ActionResponse<RankingEntry[]>> {
    // Return dummy data for now as requested for the Admin UI development
    const dummyRankings: RankingEntry[] = [
        {
            rank: 1,
            player: {
                id: "player-1",
                name: "Pro Darter",
                email: "pro@example.com",
            },
            score: 1500,
            stats: {
                matchesPlayed: 42,
                matchesWon: 35,
                ppd: gameType === "x01" || gameType === "all" ? 30.5 : undefined,
                mpr: gameType === "cricket" ? 3.8 : undefined,
            },
        },
        {
            rank: 2,
            player: {
                id: "player-2",
                name: "Rookie",
                email: "rookie@example.com",
            },
            score: 1200,
            stats: {
                matchesPlayed: 15,
                matchesWon: 5,
                ppd: gameType === "x01" || gameType === "all" ? 18.2 : undefined,
                mpr: gameType === "cricket" ? 1.5 : undefined,
            },
        },
    ];

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

    return {
        success: true,
        data: dummyRankings,
    };
}
