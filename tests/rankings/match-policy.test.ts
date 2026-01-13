import { describe, expect, it } from "vitest";

import { COUNTABLE_MATCH_STATUS, isCountableMatchStatus } from "@/lib/rankings/match-policy";

describe("rankings/match-policy", () => {
    it("usa status 'completed' como único status contabilizable (STRICT)", () => {
        expect(COUNTABLE_MATCH_STATUS).toBe("completed");
        expect(isCountableMatchStatus("completed")).toBe(true);
    });

    it("rechaza cualquier otro status (setup/ongoing/aborted)", () => {
        expect(isCountableMatchStatus("setup")).toBe(false);
        expect(isCountableMatchStatus("ongoing")).toBe(false);
        expect(isCountableMatchStatus("aborted")).toBe(false);
    });
});
