"use client";

import type { CreatePlayerDialogProps } from "@/types/components";

import { useState } from "react";

import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createPlayerWithAvatar } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreatePlayerDialog({ className }: CreatePlayerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [nickname, setNickname] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (isAdmin) {
            if (password.length < 6) {
                setLoading(false);
                setError("La contraseña debe tener al menos 6 caracteres");
                return;
            }

            if (password !== confirmPassword) {
                setLoading(false);
                setError("La confirmación de contraseña no coincide");
                return;
            }
        }

        try {
            const payload = new FormData();
            payload.set("nickname", nickname);
            if (avatarFile) payload.set("avatar", avatarFile);
            payload.set("admin", isAdmin ? "true" : "false");
            if (isAdmin) {
                payload.set("password", password);
                payload.set("confirmPassword", confirmPassword);
            }

            const res = await createPlayerWithAvatar(payload);
            if (res.success) {
                setOpen(false);
                setNickname("");
                setAvatarFile(null);
                setIsAdmin(false);
                setPassword("");
                setConfirmPassword("");
                router.refresh();
            } else {
                // If it's a field error, we just show the first one or a generic message for now
                if (res.errors) {
                    const firstError = Object.values(res.errors)[0]?.[0];
                    setError(firstError || res.message || "La validación ha fallado");
                } else {
                    setError(res.message || "No se ha podido crear el jugador");
                }
            }
        } catch (err) {
            setError("Ha ocurrido un error inesperado");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={className}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir jugador
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Añadir nuevo jugador</DialogTitle>
                        <DialogDescription>Crea un nuevo jugador para la partida. El apodo aparecerá durante el juego.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="nickname" className="text-right text-sm font-medium">
                                Apodo
                            </label>
                            <Input
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="col-span-3"
                                required
                                minLength={2}
                                maxLength={20}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="avatar" className="text-right text-sm font-medium">
                                Avatar
                            </label>
                            <Input
                                id="avatar"
                                className="col-span-3"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="admin" className="text-right text-sm font-medium">
                                Admin
                            </label>
                            <label className="col-span-3 flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    id="admin"
                                    type="checkbox"
                                    checked={isAdmin}
                                    onChange={(e) => {
                                        const next = e.target.checked;
                                        setIsAdmin(next);
                                        setError("");
                                        if (!next) {
                                            setPassword("");
                                            setConfirmPassword("");
                                        }
                                    }}
                                />
                                Marcar como administrador (requiere contraseña)
                            </label>
                        </div>

                        {isAdmin && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="password" className="text-right text-sm font-medium">
                                        Contraseña
                                    </label>
                                    <Input
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="col-span-3"
                                        type="password"
                                        required
                                        minLength={6}
                                        maxLength={72}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="confirmPassword" className="text-right text-sm font-medium">
                                        Confirmar
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="col-span-3"
                                        type="password"
                                        required
                                        minLength={6}
                                        maxLength={72}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </>
                        )}
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
                            Guardar jugador
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
