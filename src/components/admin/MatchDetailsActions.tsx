"use client";

import type { MatchDetailsActionsProps } from "@/types/components";

import { useState, useTransition } from "react";

import { Ban, Copy, Play, RotateCcw, Shield } from "lucide-react";

import { abortMatch, forceTakeoverMatch, undoAbortMatch } from "@/app/actions/matches";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getOrCreateDeviceId } from "@/lib/device/device-id";

function getMatchLink(matchId: string): string {
    if (typeof window === "undefined") return `/game?matchId=${matchId}`;
    return `${window.location.origin}/game?matchId=${matchId}`;
}

export function MatchDetailsActions({ matchId, status }: MatchDetailsActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [abortDialogOpen, setAbortDialogOpen] = useState(false);
    const [abortError, setAbortError] = useState<string | null>(null);
    const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
    const [takeoverError, setTakeoverError] = useState<string | null>(null);
    const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
    const [reactivateError, setReactivateError] = useState<string | null>(null);

    const isCompleted = status === "completed";
    const isAborted = status === "aborted";
    const isActive = status === "ongoing" || status === "setup";

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
        setAbortError(null);
        setAbortDialogOpen(true);
    }

    function handleConfirmAbort() {
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
        setTakeoverError(null);
        setTakeoverDialogOpen(true);
    }

    function handleConfirmTakeover() {
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

    function handleReactivate() {
        setReactivateError(null);
        setReactivateDialogOpen(true);
    }

    function handleConfirmReactivate() {
        setReactivateError(null);

        startTransition(async () => {
            const res = await undoAbortMatch(matchId);
            if (res.success) {
                setReactivateDialogOpen(false);
                return;
            }

            setReactivateError(res.message ?? "No se ha podido reactivar la partida");
        });
    }

    if (isCompleted) {
        return <p className="text-sm text-slate-600">La partida está completada. No hay acciones disponibles.</p>;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {isActive ? (
                    <Button type="button" onClick={handleResume} disabled={isPending}>
                        <Play className="mr-2 h-4 w-4" />
                        Reanudar
                    </Button>
                ) : null}

                <Button type="button" variant="outline" onClick={handleCopyLink} disabled={isPending}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                </Button>

                {isActive ? (
                    <Button type="button" variant="outline" onClick={handleTakeover} disabled={isPending}>
                        <Shield className="mr-2 h-4 w-4" />
                        Tomar control
                    </Button>
                ) : null}

                {isActive ? (
                    <Button type="button" variant="destructive" onClick={handleAbort} disabled={isPending}>
                        <Ban className="mr-2 h-4 w-4" />
                        Abortar
                    </Button>
                ) : null}

                {isAborted ? (
                    <Button type="button" onClick={handleReactivate} disabled={isPending}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reactivar
                    </Button>
                ) : null}
            </div>

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
                        <Button type="button" variant="destructive" onClick={handleConfirmAbort} disabled={isPending}>
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
                        <Button type="button" onClick={handleConfirmTakeover} disabled={isPending}>
                            {isPending ? "Tomando control…" : "Tomar control"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={reactivateDialogOpen}
                onOpenChange={(open) => {
                    setReactivateDialogOpen(open);
                    if (!open) setReactivateError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reactivar partida</DialogTitle>
                        <DialogDescription>
                            Esto reactivará la partida. Si ya tenía lanzamientos, volverá a estado “En juego”; si no tenía, volverá a “Preparadas”.
                        </DialogDescription>
                    </DialogHeader>

                    {reactivateError ? <p className="text-sm text-red-600">{reactivateError}</p> : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setReactivateDialogOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleConfirmReactivate} disabled={isPending}>
                            {isPending ? "Reactivando…" : "Reactivar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
