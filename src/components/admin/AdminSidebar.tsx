"use client";

import type { AdminSidebarProps } from "@/types/components/admin";

import { useEffect, useMemo, useSyncExternalStore, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BookOpen, History, Home, LogOut, Shield, Trophy, UserCog, Users } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LAST_GAME_URL_STORAGE_KEY = "dards:lastGameUrl";
const LAST_GAME_URL_EVENT = "dards:lastGameUrl";

function isSafeReturnTo(value: string): boolean {
    return value.trim().startsWith("/game");
}

function withReturnTo(path: string, returnTo: string): string {
    const [base, query] = path.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("returnTo", returnTo);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

function readStoredReturnTo(): string | null {
    try {
        const raw = window.sessionStorage.getItem(LAST_GAME_URL_STORAGE_KEY);
        return raw && isSafeReturnTo(raw) ? raw : null;
    } catch {
        return null;
    }
}

export function AdminSidebar({ title = "Panel" }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const storedReturnTo = useSyncExternalStore(
        (onStoreChange) => {
            const handler = () => onStoreChange();
            window.addEventListener("storage", handler);
            window.addEventListener(LAST_GAME_URL_EVENT, handler);

            return () => {
                window.removeEventListener("storage", handler);
                window.removeEventListener(LAST_GAME_URL_EVENT, handler);
            };
        },
        () => readStoredReturnTo(),
        () => null,
    );

    const returnToFromQuery = useMemo(() => {
        const raw = searchParams.get("returnTo");
        return raw && isSafeReturnTo(raw) ? raw : null;
    }, [searchParams]);

    useEffect(() => {
        if (!returnToFromQuery) return;
        try {
            window.sessionStorage.setItem(LAST_GAME_URL_STORAGE_KEY, returnToFromQuery);
            window.dispatchEvent(new Event(LAST_GAME_URL_EVENT));
        } catch {
            // ignore
        }
    }, [returnToFromQuery]);

    const returnTo = returnToFromQuery ?? storedReturnTo ?? "/game";

    const items = [
        { href: "/admin", label: "Inicio", icon: Home },
        { href: "/players", label: "Jugadores", icon: Users },
        { href: "/matches", label: "Partidas", icon: History },
        { href: "/rankings", label: "Clasificación", icon: Trophy },
        { href: "/rules", label: "Reglas", icon: BookOpen },
        { href: "/admin/account", label: "Cuenta", icon: UserCog },
    ] as const;

    async function performLogout(): Promise<void> {
        await logout();
        router.push("/");
        router.refresh();
    }

    function handleLogout(): void {
        startTransition(() => {
            void performLogout();
        });
    }

    return (
        <aside className="hidden w-72 flex-col bg-slate-900 text-slate-50 md:flex">
            <div className="flex h-14 items-center border-b border-slate-800 px-6 bg-slate-950/50">
                <Shield className="mr-2 h-6 w-6" />
                <span className="font-bold">{title}</span>
            </div>

            <div className="flex h-full flex-col">
                <nav className="flex-1 space-y-1 p-4">
                    {items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;
                        const href = returnTo ? withReturnTo(item.href, returnTo) : item.href;

                        return (
                            <Link
                                key={item.href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                                    isActive ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:bg-slate-800 hover:text-slate-50",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link
                        href={returnTo}
                        className="flex items-center justify-center rounded-lg bg-slate-100/10 hover:bg-slate-100/15 border border-slate-700 px-3 py-2 text-sm font-bold"
                    >
                        Volver al juego
                    </Link>

                    <Button
                        type="button"
                        variant="ghost"
                        className="mt-3 w-full justify-center gap-2 border border-slate-800 bg-slate-950/40 text-slate-100 hover:bg-slate-950/60 hover:text-slate-50"
                        onClick={handleLogout}
                        disabled={isPending}
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </Button>
                </div>
            </div>
        </aside>
    );
}
