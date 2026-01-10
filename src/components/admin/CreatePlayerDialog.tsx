"use client";

import { createPlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";

export function CreatePlayerDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ nickname: "", avatarUrl: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await createPlayer(formData);
            if (res.success) {
                setOpen(false);
                setFormData({ nickname: "", avatarUrl: "" });
            } else {
                // If it's a field error, we just show the first one or a generic message for now
                if (res.errors) {
                    const firstError = Object.values(res.errors)[0]?.[0];
                    setError(firstError || res.message || "Validation failed");
                } else {
                    setError(res.message || "Failed to create player");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Player
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                        <DialogDescription>Create a new player for the game. Nickname matches will appear in game.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="nickname" className="text-right text-sm font-medium">
                                Nickname
                            </label>
                            <Input
                                id="nickname"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                className="col-span-3"
                                required
                                minLength={2}
                                maxLength={20}
                            />
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
                            Save Player
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
