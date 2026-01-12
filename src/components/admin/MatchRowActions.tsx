"use client";

import type { MatchRowActionsProps } from "@/types/components";

import { useState, useTransition } from "react";

import { Ban, Copy, MoreHorizontal, Play, Shield } from "lucide-react";

import { abortMatch, forceTakeoverMatch } from "@/app/actions/matches";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { getOrCreateDeviceId } from "@/lib/device/device-id";

function getMatchLink(matchId: string): string {
    if (typeof window === "undefined") return `/game?matchId=${matchId}`;
    return `${window.location.origin}/game?matchId=${matchId}`;
}

export function MatchRowActions({ matchId, status }: MatchRowActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [abortDialogOpen, setAbortDialogOpen] = useState(false);
    const [abortError, setAbortError] = useState<string | null>(null);
    const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
    const [takeoverError, setTakeoverError] = useState<string | null>(null);

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
        setAbortError(null);
        setAbortDialogOpen(true);
    }

    function handleConfirmAbort() {
        if (isFinished) return;

        setAbortError(null);

        startTransition(async () => {
            const res = await abortMatch(matchId);
            if (res.success) {
                setAbortDialogOpen(false);
                return;
            }

            setAbortError(res.message ?? "No se ha podido abortar la partida");
        });
    }

    function handleTakeover() {
        if (isFinished) return;
        setTakeoverError(null);
        setTakeoverDialogOpen(true);
    }

    function handleConfirmTakeover() {
        if (isFinished) return;

        setTakeoverError(null);

        const deviceId = getOrCreateDeviceId();

        startTransition(async () => {
            const res = await forceTakeoverMatch({ matchId, deviceId });
            if (res.success) {
                setTakeoverDialogOpen(false);
                return;
            }

            setTakeoverError(res.message ?? "No se ha podido tomar el control de la partida");
        });
    }

    return (
        <>
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

            <Dialog
                open={abortDialogOpen}
                onOpenChange={(open) => {
                    setAbortDialogOpen(open);
                    if (!open) setAbortError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abortar partida</DialogTitle>
                        <DialogDescription>
                            ¿Seguro que quieres abortar esta partida? Se conservarán los lanzamientos para auditoría y la partida pasará a estado
                            “Abortada”.
                        </DialogDescription>
                    </DialogHeader>

                    {abortError ? <p className="text-sm text-red-600">{abortError}</p> : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAbortDialogOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleConfirmAbort} disabled={isFinished || isPending}>
                            {isPending ? "Abortando…" : "Abortar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={takeoverDialogOpen}
                onOpenChange={(open) => {
                    setTakeoverDialogOpen(open);
                    if (!open) setTakeoverError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tomar control</DialogTitle>
                        <DialogDescription>
                            Esto forzará el control de la partida desde este dispositivo. Si otro dispositivo estaba jugando, sus lanzamientos podrían
                            ser rechazados a partir de ahora.
                        </DialogDescription>
                    </DialogHeader>

                    {takeoverError ? <p className="text-sm text-red-600">{takeoverError}</p> : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setTakeoverDialogOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleConfirmTakeover} disabled={isFinished || isPending}>
                            {isPending ? "Tomando control…" : "Tomar control"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
