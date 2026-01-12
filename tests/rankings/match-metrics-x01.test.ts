import { describe, expect, it } from "vitest";

import { calculateMatchMetricsByParticipant, calculatePpd } from "@/lib/rankings/match-metrics";

describe("rankings/match-metrics (x01)", () => {
    it("roundsPlayed cuenta roundIndex distintos aunque haya throws inválidos", () => {
        const participants = [{ id: "pa", playerId: "p1" }];

        const throws = [
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: true,
            },
            {
                participantId: "pa",
                roundIndex: 2,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: false,
            },
        ];

        const [result] = calculateMatchMetricsByParticipant({
            gameId: "x01",
            participants,
            throws,
        });

        expect(result.roundsPlayed).toBe(2);
    });

    it("bust anula los puntos válidos de la ronda en X01", () => {
        const participants = [{ id: "pa", playerId: "p1" }];

        const throws = [
            // Ronda 0: hay bust => puntos válidos de la ronda deben ser 0
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: true,
            },
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 20,
                multiplier: 1,
                points: 20,
                isBust: true,
                isValid: true,
            },
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 5,
                multiplier: 1,
                points: 5,
                isBust: false,
                isValid: true,
            },
            // Ronda 1: sin bust
            {
                participantId: "pa",
                roundIndex: 1,
                segment: 20,
                multiplier: 1,
                points: 20,
                isBust: false,
                isValid: true,
            },
            // Ronda 2: sólo inválidos (debe contar para roundsPlayed)
            {
                participantId: "pa",
                roundIndex: 2,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: false,
            },
        ];

        const [result] = calculateMatchMetricsByParticipant({
            gameId: "x01",
            participants,
            throws,
        });

        // Dardos válidos: 4 (3 en ronda 0 + 1 en ronda 1)
        expect(result.dartsValid).toBe(4);

        // Puntos válidos: ronda 0 => 0 por bust, ronda 1 => 20
        expect(result.pointsValid).toBe(20);

        // roundsPlayed: {0,1,2}
        expect(result.roundsPlayed).toBe(3);

        expect(calculatePpd(result.pointsValid, result.dartsValid)).toBe(5);
    });

    it("bust anula los puntos válidos de la ronda aunque el throw con isBust sea inválido", () => {
        const participants = [{ id: "pa", playerId: "p1" }];

        const throws = [
            // Ronda 0: el bust es inválido, pero aun así anula los puntos válidos de esa ronda.
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 20,
                multiplier: 3,
                points: 60,
                isBust: false,
                isValid: true,
            },
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 20,
                multiplier: 1,
                points: 20,
                isBust: true,
                isValid: false,
            },
            {
                participantId: "pa",
                roundIndex: 0,
                segment: 5,
                multiplier: 1,
                points: 5,
                isBust: false,
                isValid: true,
            },
            // Ronda 1: sin bust
            {
                participantId: "pa",
                roundIndex: 1,
                segment: 20,
                multiplier: 1,
                points: 20,
                isBust: false,
                isValid: true,
            },
        ];

        const [result] = calculateMatchMetricsByParticipant({
            gameId: "x01",
            participants,
            throws,
        });

        expect(result.roundsPlayed).toBe(2);
        expect(result.dartsValid).toBe(3);

        // Ronda 0 anulada, ronda 1 suma.
        expect(result.pointsValid).toBe(20);
    });

    it("calculatePpd devuelve 0 si dartsValid es 0", () => {
        expect(calculatePpd(100, 0)).toBe(0);
    });

    it("si no hay throws, roundsPlayed es 0", () => {
        const participants = [{ id: "pa", playerId: "p1" }];

        const [result] = calculateMatchMetricsByParticipant({
            gameId: "x01",
            participants,
            throws: [],
        });

        expect(result.roundsPlayed).toBe(0);
        expect(result.dartsValid).toBe(0);
        expect(result.pointsValid).toBe(0);
    });
});
