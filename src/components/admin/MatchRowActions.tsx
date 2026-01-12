"use client";

import type { MatchRowActionsProps } from "@/types/components";

import { useTransition } from "react";

import { Ban, Copy, MoreHorizontal, Play, Shield } from "lucide-react";

import { abortMatch, forceTakeoverMatch } from "@/app/actions/matches";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { getOrCreateDeviceId } from "@/lib/device/device-id";

function getMatchLink(matchId: string): string {
    if (typeof window === "undefined") return `/game?matchId=${matchId}`;
    return `${window.location.origin}/game?matchId=${matchId}`;
}

export function MatchRowActions({ matchId, status }: MatchRowActionsProps) {
    const [isPending, startTransition] = useTransition();

    const isFinished = status === "completed" || status === "aborted";

    async function handleCopyLink() {
        const link = getMatchLink(matchId);

        try {
            await navigator.clipboard.writeText(link);
        } catch {
            try {
                const el = document.createElement("textarea");
                el.value = link;
                el.setAttribute("readonly", "true");
                el.style.position = "absolute";
                el.style.left = "-9999px";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            } catch {
                // Clipboard may be unavailable depending on browser permissions.
            }
        }
    }

    function handleResume() {
        window.location.href = `/game?matchId=${matchId}`;
    }

    function handleAbort() {
        if (isFinished) return;
        if (!window.confirm("¿Abortar esta partida? Se conservarán los lanzamientos para auditoría.")) return;

        startTransition(async () => {
            const res = await abortMatch(matchId);
            if (!res.success) {
                window.alert(res.message ?? "No se ha podido abortar la partida");
            }
        });
    }

    function handleTakeover() {
        if (isFinished) return;
        if (!window.confirm("¿Tomar control de esta partida desde este dispositivo?")) return;

        const deviceId = getOrCreateDeviceId();

        startTransition(async () => {
            const res = await forceTakeoverMatch({ matchId, deviceId });
            if (!res.success) {
                window.alert(res.message ?? "No se ha podido tomar el control de la partida");
            }
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Acciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={handleResume}>
                    <Play className="mr-2 h-4 w-4" />
                    Reanudar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleTakeover} disabled={isFinished || isPending}>
                    <Shield className="mr-2 h-4 w-4" />
                    Tomar control
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={handleAbort}
                    disabled={isFinished || isPending}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                >
                    <Ban className="mr-2 h-4 w-4" />
                    Abortar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
