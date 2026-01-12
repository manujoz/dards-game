import { describe, expect, it } from "vitest";

import type { EloCompetitor } from "@/lib/rankings/elo";
import { computeEloUpdatesWinnerOnly } from "@/lib/rankings/elo";

function getUpdate(updates: { playerId: string; delta: number; newRatingElo: number }[], playerId: string): { delta: number; newRatingElo: number } {
    const update = updates.find((u) => u.playerId === playerId);
    if (!update) throw new Error(`No existe update para ${playerId}`);
    return update;
}

describe("rankings/elo", () => {
    it("1v1: el ganador sube y el perdedor baja", () => {
        const competitors: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1500, matchesPlayed: 0 },
        ];

        const updates = computeEloUpdatesWinnerOnly({
            competitors,
            winnerPlayerId: "a",
        });

        const a = getUpdate(updates, "a");
        const b = getUpdate(updates, "b");

        expect(a.delta).toBeGreaterThan(0);
        expect(b.delta).toBeLessThan(0);

        // Conservación aproximada (con redondeo entero debería ser exacto en este caso).
        expect(a.delta + b.delta).toBe(0);
        expect(a.newRatingElo).toBe(1520);
        expect(b.newRatingElo).toBe(1480);
    });

    it("multi-jugador: ganador sube, perdedores bajan; suma de deltas ~0", () => {
        const competitors: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "c", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "d", ratingElo: 1500, matchesPlayed: 0 },
        ];

        const updates = computeEloUpdatesWinnerOnly({
            competitors,
            winnerPlayerId: "a",
        });

        const a = getUpdate(updates, "a");
        const b = getUpdate(updates, "b");
        const c = getUpdate(updates, "c");
        const d = getUpdate(updates, "d");

        expect(a.delta).toBeGreaterThan(0);
        expect(b.delta).toBeLessThan(0);
        expect(c.delta).toBeLessThan(0);
        expect(d.delta).toBeLessThan(0);

        const sum = updates.reduce((acc, u) => acc + u.delta, 0);

        // Puede haber pequeñas desviaciones por redondeo en otros setups.
        expect(Math.abs(sum)).toBeLessThanOrEqual(2);
    });

    it("K dinámico: con pocas partidas el cambio absoluto es mayor", () => {
        const lowExperience: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1500, matchesPlayed: 0 },
        ];

        const highExperience: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1500, matchesPlayed: 60 },
            { playerId: "b", ratingElo: 1500, matchesPlayed: 60 },
        ];

        const updatesLow = computeEloUpdatesWinnerOnly({ competitors: lowExperience, winnerPlayerId: "a" });
        const updatesHigh = computeEloUpdatesWinnerOnly({ competitors: highExperience, winnerPlayerId: "a" });

        const aLow = getUpdate(updatesLow, "a");
        const aHigh = getUpdate(updatesHigh, "a");

        expect(Math.abs(aLow.delta)).toBeGreaterThan(Math.abs(aHigh.delta));
    });

    it("monotonicidad: una victoria como underdog da un delta mayor que una victoria como favorito", () => {
        const underdogWin: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1400, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1600, matchesPlayed: 0 },
        ];

        const favoriteWin: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1600, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1400, matchesPlayed: 0 },
        ];

        const updatesUnderdog = computeEloUpdatesWinnerOnly({ competitors: underdogWin, winnerPlayerId: "a" });
        const updatesFavorite = computeEloUpdatesWinnerOnly({ competitors: favoriteWin, winnerPlayerId: "a" });

        const aUnderdog = getUpdate(updatesUnderdog, "a");
        const aFavorite = getUpdate(updatesFavorite, "a");

        expect(aUnderdog.delta).toBeGreaterThan(0);
        expect(aFavorite.delta).toBeGreaterThan(0);

        expect(aUnderdog.delta).toBeGreaterThan(aFavorite.delta);
    });

    it("equipos 2v2: el delta se aplica igual dentro de cada equipo y usa media de ratings", () => {
        // Equipo A: media 1500 (1700 + 1300) / 2
        // Equipo B: media 1500 (1500 + 1500) / 2
        const competitors: EloCompetitor[] = [
            { playerId: "a1", ratingElo: 1700, matchesPlayed: 0, teamId: "A" },
            { playerId: "a2", ratingElo: 1300, matchesPlayed: 0, teamId: "A" },
            { playerId: "b1", ratingElo: 1500, matchesPlayed: 0, teamId: "B" },
            { playerId: "b2", ratingElo: 1500, matchesPlayed: 0, teamId: "B" },
        ];

        const updates = computeEloUpdatesWinnerOnly({
            competitors,
            winnerPlayerId: "a1",
        });

        const a1 = getUpdate(updates, "a1");
        const a2 = getUpdate(updates, "a2");
        const b1 = getUpdate(updates, "b1");
        const b2 = getUpdate(updates, "b2");

        expect(a1.delta).toBeGreaterThan(0);
        expect(a2.delta).toBeGreaterThan(0);
        expect(b1.delta).toBeLessThan(0);
        expect(b2.delta).toBeLessThan(0);

        // Igual dentro del equipo (regla del plan).
        expect(a1.delta).toBe(a2.delta);
        expect(b1.delta).toBe(b2.delta);

        // Con medias iguales (1500 vs 1500) y K alto, el delta esperado es 20.
        expect(a1.delta).toBe(20);
        expect(b1.delta).toBe(-20);
    });

    it("si no hay winnerId, no hay actualización", () => {
        const competitors: EloCompetitor[] = [
            { playerId: "a", ratingElo: 1500, matchesPlayed: 0 },
            { playerId: "b", ratingElo: 1500, matchesPlayed: 0 },
        ];

        expect(computeEloUpdatesWinnerOnly({ competitors, winnerPlayerId: null })).toEqual([]);
        expect(computeEloUpdatesWinnerOnly({ competitors, winnerPlayerId: undefined })).toEqual([]);
    });
});
