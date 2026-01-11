"use client";

import type { DeletePlayerDialogProps } from "@/types/components";

import { deletePlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function DeletePlayerDialog({ player, admins, open, onOpenChange }: DeletePlayerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [performedByPlayerId, setPerformedByPlayerId] = useState("");
    const router = useRouter();

    const adminOptions = useMemo(() => admins.filter((p) => p.admin), [admins]);

    useEffect(() => {
        if (!open) return;

        setError("");

        const firstAdmin = adminOptions[0];
        setPerformedByPlayerId(firstAdmin?.id || "");
    }, [adminOptions, open]);

    async function handleDelete() {
        setLoading(true);
        setError("");

        try {
            const res = await deletePlayer({
                playerId: player.id,
                performedByPlayerId,
            });

            if (res.success) {
                onOpenChange(false);
                router.refresh();
                return;
            }

            if (res.errors) {
                const firstError = Object.values(res.errors)[0]?.[0];
                setError(firstError || res.message || "Validation failed");
            } else {
                setError(res.message || "Failed to delete player");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Delete player</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The player and their participations may be removed depending on DB constraints.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        You are about to delete <span className="font-semibold">{player.nickname}</span>.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm as admin</label>
                        <select
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={performedByPlayerId}
                            onChange={(e) => setPerformedByPlayerId(e.target.value)}
                            disabled={loading || adminOptions.length === 0}
                        >
                            {adminOptions.length === 0 ? (
                                <option value="">No admins configured in DB</option>
                            ) : (
                                adminOptions.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nickname}
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-slate-500">Admins are immutable and must be marked directly in the database.</p>
                    </div>

                    {error && (
                        <div className="flex items-center text-sm text-red-600">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        type="button"
                        onClick={handleDelete}
                        disabled={loading || adminOptions.length === 0 || !performedByPlayerId}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
