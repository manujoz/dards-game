"use client";

import type { AbortedMatchRowActionsProps } from "@/types/components";

import { useState, useTransition } from "react";

import { MoreHorizontal, RotateCcw } from "lucide-react";

import { undoAbortMatch } from "@/app/actions/matches";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AbortedMatchRowActions({ matchId }: AbortedMatchRowActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpen() {
        setError(null);
        setDialogOpen(true);
    }

    function handleConfirm() {
        setError(null);

        startTransition(async () => {
            const res = await undoAbortMatch(matchId);
            if (res.success) {
                setDialogOpen(false);
                return;
            }

            setError(res.message ?? "No se ha podido deshacer el abortado");
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
                <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuItem onSelect={handleOpen} disabled={isPending}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Deshacer abortado
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setError(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deshacer abortado</DialogTitle>
                        <DialogDescription>
                            Esto reactivará la partida. Si ya tenía lanzamientos, volverá a estado “En juego”; si no tenía, volverá a “Preparadas”.
                        </DialogDescription>
                    </DialogHeader>

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleConfirm} disabled={isPending}>
                            {isPending ? "Reactivando…" : "Reactivar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
