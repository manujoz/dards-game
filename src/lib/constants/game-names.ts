import type { GameId } from "@/types/models/darts";

export const GAME_NAME_BY_ID: Record<GameId, string> = {
    x01: "X01",
    cricket: "Cricket",
    round_the_clock: "Round the Clock",
    high_score: "High Score",
    shanghai: "Shanghai",
    killer: "Killer",
    halve_it: "Halve It",
};

export function getGameName(gameId: string): string {
    return (GAME_NAME_BY_ID as Record<string, string>)[gameId] ?? gameId.replace(/_/gu, " ");
}
