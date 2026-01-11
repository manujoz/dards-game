"use client";

import type { EditPlayerDialogProps } from "@/types/components";

import { updatePlayerWithAvatar } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function EditPlayerDialog({ player, open, onOpenChange }: EditPlayerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [nickname, setNickname] = useState(player.nickname);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (open) {
            setNickname(player.nickname);
            setAvatarFile(null);
            setRemoveAvatar(false);
            setError("");
        }
    }, [open, player.nickname]);

    const previewUrl = useMemo(() => {
        if (avatarFile) return URL.createObjectURL(avatarFile);
        if (removeAvatar) return null;
        return player.avatarUrl || null;
    }, [avatarFile, player.avatarUrl, removeAvatar]);

    useEffect(() => {
        if (!avatarFile) return;
        const url = URL.createObjectURL(avatarFile);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = new FormData();
            payload.set("id", player.id);
            payload.set("nickname", nickname);
            payload.set("removeAvatar", removeAvatar ? "true" : "false");
            if (avatarFile) payload.set("avatar", avatarFile);

            const res = await updatePlayerWithAvatar(payload);
            if (res.success) {
                onOpenChange(false);
                router.refresh();
                return;
            }

            if (res.errors) {
                const firstError = Object.values(res.errors)[0]?.[0];
                setError(firstError || res.message || "Validation failed");
            } else {
                setError(res.message || "Failed to update player");
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
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Player</DialogTitle>
                        <DialogDescription>Update nickname and avatar. Admin flag is managed directly in the database.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-nickname" className="text-right text-sm font-medium">
                                Nickname
                            </label>
                            <Input
                                id="edit-nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="col-span-3"
                                required
                                minLength={2}
                                maxLength={20}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right text-sm font-medium">Avatar</div>
                            <div className="col-span-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex grow-0 h-12 w-12 items-center justify-center">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt={nickname}
                                                className="w-full object-cover aspect-square overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                                            />
                                        ) : (
                                            <span className="text-xs text-slate-400 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                                —
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        id="edit-avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            setAvatarFile(e.target.files?.[0] || null);
                                            setRemoveAvatar(false);
                                        }}
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={removeAvatar}
                                        onChange={(e) => {
                                            setRemoveAvatar(e.target.checked);
                                            if (e.target.checked) setAvatarFile(null);
                                        }}
                                    />
                                    Remove avatar
                                </label>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center text-sm text-red-500">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
