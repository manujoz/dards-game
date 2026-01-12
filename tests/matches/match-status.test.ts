import { describe, expect, it } from "vitest";

import { deriveMatchStatus, deriveWinnerId } from "@/lib/matches/match-status";

describe("match-status", () => {
    it("deriva el estado a completed si hay ganador", () => {
        expect(deriveMatchStatus("ongoing", true)).toBe("completed");
        expect(deriveMatchStatus("setup", true)).toBe("completed");
    });

    it("mantiene el estado si no hay ganador", () => {
        expect(deriveMatchStatus("ongoing", false)).toBe("ongoing");
        expect(deriveMatchStatus("aborted", false)).toBe("aborted");
    });

    it("elige winnerId de match si existe", () => {
        expect(deriveWinnerId("player-1", "player-2")).toBe("player-1");
    });

    it("usa el winner del tiro ganador como fallback", () => {
        expect(deriveWinnerId(undefined, "player-2")).toBe("player-2");
    });

    it("devuelve undefined si no hay ninguna pista", () => {
        expect(deriveWinnerId(undefined, undefined)).toBeUndefined();
    });
});
