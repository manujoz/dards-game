import { describe, expect, it } from "vitest";

import { calculateMatchMetricsByParticipant, calculateMpr } from "@/lib/rankings/match-metrics";

describe("rankings/match-metrics (cricket)", () => {
    it("marks suma multiplicadores válidos sólo en 15-20 y bull (25)", () => {
        const participants = [{ id: "pc", playerId: "p1" }];

        const throws = [
            // Ronda 0
            {
                participantId: "pc",
                roundIndex: 0,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: true,
            },
            {
                participantId: "pc",
                roundIndex: 0,
                segment: 25,
                multiplier: 2,
                points: 50,
                isBust: false,
                isValid: true,
            },
            // Ronda 1: segmento fuera de objetivo de Cricket
            {
                participantId: "pc",
                roundIndex: 1,
                segment: 14,
                multiplier: 3,
                points: 42,
                isBust: false,
                isValid: true,
            },
            // Ronda 2: inválido, no suma marks, pero sí cuenta para roundsPlayed
            {
                participantId: "pc",
                roundIndex: 2,
                segment: 19,
                multiplier: 1,
                points: 19,
                isBust: false,
                isValid: false,
            },
        ];

        const [result] = calculateMatchMetricsByParticipant({
            gameId: "cricket",
            participants,
            throws,
        });

        expect(result.marks).toBe(5);
        expect(result.roundsPlayed).toBe(3);
        expect(result.dartsValid).toBe(3);
        expect(result.pointsValid).toBe(152);

        expect(calculateMpr(result.marks ?? 0, result.roundsPlayed)).toBeCloseTo(5 / 3, 10);
    });

    it("calculateMpr devuelve 0 si roundsPlayed es 0", () => {
        expect(calculateMpr(7, 0)).toBe(0);
    });
});
