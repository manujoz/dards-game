"use client";

import type { DeletePlayerDialogProps } from "@/types/components";

import { useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deletePlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeletePlayerDialog({ player, open, onOpenChange }: DeletePlayerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleDelete() {
        setLoading(true);
        setError("");

        try {
            const res = await deletePlayer({
                playerId: player.id,
            });

            if (res.success) {
                onOpenChange(false);
                router.refresh();
                return;
            }

            if (res.errors) {
                const firstError = Object.values(res.errors)[0]?.[0];
                setError(firstError || res.message || "La validación ha fallado");
            } else {
                setError(res.message || "No se ha podido eliminar el jugador");
            }
        } catch (err) {
            setError("Ha ocurrido un error inesperado");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Eliminar jugador</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. El jugador y sus participaciones pueden eliminarse dependiendo de las restricciones de la
                        base de datos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Estás a punto de eliminar a <span className="font-semibold">{player.nickname}</span>.
                    </div>

                    <p className="text-sm text-slate-600">Solo un administrador con sesión iniciada puede eliminar jugadores.</p>

                    {error && (
                        <div className="flex items-center text-sm text-red-600">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" type="button" onClick={handleDelete} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
