import { describe, expect, test } from "vitest";

import { canClaimLock, CONTROLLER_LEASE_TTL_MS, isLockValid, nextLeaseUntil } from "@/lib/device/device-lock";

describe("device-lock", () => {
    test("nextLeaseUntil suma el TTL", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");
        const leaseUntil = nextLeaseUntil(now);

        expect(leaseUntil.getTime()).toBe(now.getTime() + CONTROLLER_LEASE_TTL_MS);
    });

    test("isLockValid devuelve false si no hay lease", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");

        expect(isLockValid(now, null)).toBe(false);
        expect(isLockValid(now, undefined)).toBe(false);
    });

    test("isLockValid devuelve true si leaseUntil es futuro", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");
        const leaseUntil = new Date(now.getTime() + 1);

        expect(isLockValid(now, leaseUntil)).toBe(true);
    });

    test("isLockValid devuelve false si leaseUntil es igual a now", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");

        expect(isLockValid(now, new Date(now.getTime()))).toBe(false);
    });

    test("canClaimLock devuelve true si no hay lease", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");

        expect(canClaimLock(now, null)).toBe(true);
        expect(canClaimLock(now, undefined)).toBe(true);
    });

    test("canClaimLock devuelve false si leaseUntil es futuro", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");
        const leaseUntil = new Date(now.getTime() + 1);

        expect(canClaimLock(now, leaseUntil)).toBe(false);
    });

    test("canClaimLock devuelve true si leaseUntil es pasado o igual", () => {
        const now = new Date("2026-01-12T10:00:00.000Z");

        expect(canClaimLock(now, new Date(now.getTime() - 1))).toBe(true);
        expect(canClaimLock(now, new Date(now.getTime()))).toBe(true);
    });
});
