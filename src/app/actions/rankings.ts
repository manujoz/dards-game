"use server";

import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { prisma } from "@/lib/db/prisma";
import { type RankingEntry } from "@/types/actions/rankings";
import { type ActionResponse } from "@/types/actions/shared";

function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && error.message === "No autorizado";
}

export async function getRankings(gameType: "x01" | "cricket" | "all" = "all"): Promise<ActionResponse<RankingEntry[]>> {
    try {
        await requireAdminSession();

        // NOTE: Los cálculos reales de ranking (ELO, win-rate, etc.) se pueden implementar después.
        // Por ahora mostramos jugadores reales (nickname + avatar) para que la tabla sea útil.

        const players = await prisma.player.findMany({
            orderBy: {
                nickname: "asc",
            },
            select: {
                id: true,
                nickname: true,
                avatarUrl: true,
            },
        });

        const rankings: RankingEntry[] = players.map((p, idx) => {
            const seed = (idx + 1) * 97;
            const matchesPlayed = Math.max(0, 10 - idx);
            const matchesWon = Math.max(0, Math.min(matchesPlayed, Math.round(matchesPlayed * 0.6)));

            return {
                rank: idx + 1,
                player: {
                    id: p.id,
                    name: p.nickname,
                    avatarUrl: p.avatarUrl ?? undefined,
                },
                score: 1500 - seed,
                stats: {
                    matchesPlayed,
                    matchesWon,
                    ppd: gameType === "cricket" ? undefined : 20 + Math.max(0, 5 - idx) * 1.3,
                    mpr: gameType === "x01" ? undefined : 1.5 + Math.max(0, 3 - idx) * 0.4,
                },
            };
        });

        return {
            success: true,
            data: rankings,
        };
    } catch (error) {
        if (isUnauthorized(error)) {
            return {
                success: false,
                message: "No autorizado",
            };
        }

        console.error("Error al cargar la clasificación:", error);
        return {
            success: false,
            message: "No se han podido cargar los rankings",
        };
    }
}
