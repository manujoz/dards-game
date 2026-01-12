import { describe, expect, it } from "vitest";

import { getDisplayRoundIndex, groupThrowsByRound, isZeroBasedRoundIndex } from "@/lib/matches/match-details";

describe("match-details", () => {
    it("detecta roundIndex 0-based cuando el mínimo es 0", () => {
        expect(
            isZeroBasedRoundIndex([
                {
                    id: "t1",
                    matchId: "m1",
                    participantId: "p1",
                    roundIndex: 0,
                    throwIndex: 1,
                    segment: 20,
                    multiplier: 1,
                    points: 20,
                    isBust: false,
                    isWin: false,
                    isValid: true,
                    timestamp: new Date("2026-01-01T10:00:00.000Z"),
                },
            ]),
        ).toBe(true);
    });

    it("no asume 0-based si no hay tiros", () => {
        expect(isZeroBasedRoundIndex([])).toBe(false);
    });

    it("calcula displayRoundIndex con +1 cuando es 0-based", () => {
        expect(getDisplayRoundIndex(0, true)).toBe(1);
        expect(getDisplayRoundIndex(4, true)).toBe(5);
    });

    it("agrupa tiros por ronda y preserva el orden", () => {
        const t1 = {
            id: "t1",
            matchId: "m1",
            participantId: "p1",
            roundIndex: 0,
            throwIndex: 1,
            segment: 20,
            multiplier: 1,
            points: 20,
            isBust: false,
            isWin: false,
            isValid: true,
            timestamp: new Date("2026-01-01T10:00:01.000Z"),
        };

        const t2 = {
            id: "t2",
            matchId: "m1",
            participantId: "p1",
            roundIndex: 0,
            throwIndex: 2,
            segment: 19,
            multiplier: 1,
            points: 19,
            isBust: false,
            isWin: false,
            isValid: true,
            timestamp: new Date("2026-01-01T10:00:02.000Z"),
        };

        const t3 = {
            id: "t3",
            matchId: "m1",
            participantId: "p2",
            roundIndex: 1,
            throwIndex: 1,
            segment: 25,
            multiplier: 1,
            points: 25,
            isBust: false,
            isWin: false,
            isValid: true,
            timestamp: new Date("2026-01-01T10:00:03.000Z"),
        };

        const groups = groupThrowsByRound([t3, t2, t1]);

        expect(groups).toHaveLength(2);
        expect(groups[0].roundIndex).toBe(0);
        expect(groups[0].displayRoundIndex).toBe(1);
        expect(groups[0].throwIds).toEqual(["t1", "t2"]);

        expect(groups[1].roundIndex).toBe(1);
        expect(groups[1].displayRoundIndex).toBe(2);
        expect(groups[1].throwIds).toEqual(["t3"]);
    });
});
