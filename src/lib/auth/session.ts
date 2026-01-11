import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "dards_admin_session";

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
} satisfies {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
    maxAge: number;
};

export type AdminSessionPayload = {
    playerId: string;
    nickname: string;
    admin: true;
};

function getAuthSecret(): string {
    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.trim().length === 0) {
        throw new Error("AUTH_SECRET no está configurado");
    }

    return secret;
}

function getAuthKey(): Uint8Array {
    return new TextEncoder().encode(getAuthSecret());
}

function isAdminSessionPayload(value: unknown): value is AdminSessionPayload {
    if (!value || typeof value !== "object") {
        return false;
    }

    const maybe = value as Partial<AdminSessionPayload>;

    return (
        maybe.admin === true &&
        typeof maybe.playerId === "string" &&
        maybe.playerId.length > 0 &&
        typeof maybe.nickname === "string" &&
        maybe.nickname.length > 0
    );
}

export async function createSessionToken(payload: AdminSessionPayload): Promise<string> {
    const key = getAuthKey();

    return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key);
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
    try {
        const key = getAuthKey();
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });

        if (!isAdminSessionPayload(payload)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}
