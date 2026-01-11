import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, verifySessionToken, type AdminSessionPayload } from "@/lib/auth/session";

export async function requireAdminSession(): Promise<AdminSessionPayload> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        throw new Error("No autorizado");
    }

    const payload = await verifySessionToken(token);

    if (!payload) {
        throw new Error("No autorizado");
    }

    return payload;
}
