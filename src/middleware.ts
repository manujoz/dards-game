import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATH_PREFIXES = ["/_next/", "/assets/", "/sounds/"] as const;
const PUBLIC_EXACT_PATHS = ["/", "/favicon.ico"] as const;

function isPublicPath(pathname: string): boolean {
    if ((PUBLIC_EXACT_PATHS as readonly string[]).includes(pathname)) {
        return true;
    }

    return (PUBLIC_PATH_PREFIXES as readonly string[]).some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname, search } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
        const payload = await verifySessionToken(token);

        if (payload) {
            return NextResponse.next();
        }
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("returnTo", `${pathname}${search}`);

    return NextResponse.redirect(redirectUrl);
}

export const config = {
    matcher: ["/((?!_next/|favicon.ico|assets/|sounds/).*)"],
};
