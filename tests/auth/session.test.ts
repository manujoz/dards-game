import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "../../src/lib/auth/session";

function setAuthSecret(value: string | undefined): void {
    if (typeof value === "string") {
        process.env.AUTH_SECRET = value;
        return;
    }

    delete process.env.AUTH_SECRET;
}

describe("auth/session", () => {
    it("con AUTH_SECRET definido, createSessionToken + verifySessionToken devuelve el payload", async () => {
        const originalSecret = process.env.AUTH_SECRET;
        setAuthSecret("test-secret");

        try {
            const payload = {
                playerId: "p1",
                nickname: "Admin",
                admin: true,
            } as const;

            const token = await createSessionToken(payload);
            const verified = await verifySessionToken(token);

            expect(verified).not.toBeNull();
            expect(verified).toMatchObject(payload);
        } finally {
            setAuthSecret(originalSecret);
        }
    });

    it("token inválido devuelve null", async () => {
        const originalSecret = process.env.AUTH_SECRET;
        setAuthSecret("test-secret");

        try {
            const verified = await verifySessionToken("this-is-not-a-jwt");
            expect(verified).toBeNull();
        } finally {
            setAuthSecret(originalSecret);
        }
    });

    it("token firmado con admin:false devuelve null", async () => {
        const originalSecret = process.env.AUTH_SECRET;
        setAuthSecret("test-secret");

        try {
            const key = new TextEncoder().encode("test-secret");
            const payload: Record<string, unknown> = {
                playerId: "p1",
                nickname: "NotAdmin",
                admin: false,
            };

            const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key);

            const verified = await verifySessionToken(token);
            expect(verified).toBeNull();
        } finally {
            setAuthSecret(originalSecret);
        }
    });

    it("createSessionToken falla claramente si AUTH_SECRET falta", async () => {
        const originalSecret = process.env.AUTH_SECRET;
        setAuthSecret(undefined);

        try {
            const payload = {
                playerId: "p1",
                nickname: "Admin",
                admin: true,
            } as const;

            await expect(createSessionToken(payload)).rejects.toThrow(/AUTH_SECRET/i);
        } finally {
            setAuthSecret(originalSecret);
        }
    });
});
