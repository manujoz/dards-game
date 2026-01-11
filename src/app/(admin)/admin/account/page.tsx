"use client";

import type { ChangePasswordInput } from "@/lib/validation/auth";

import { useState, useTransition } from "react";

import { changePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getFirstFieldError(errors: Record<string, string[]> | undefined): string | null {
    if (!errors) {
        return null;
    }

    const first = Object.values(errors)[0];
    return first?.[0] ?? null;
}

export default function AccountPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("La confirmación no coincide con la nueva contraseña");
            return;
        }

        const payload: ChangePasswordInput = {
            currentPassword,
            newPassword,
            confirmPassword,
        };

        startTransition(() => {
            void (async () => {
                const res = await changePassword(payload);

                if (res.success) {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setSuccess(res.message ?? "Contraseña actualizada correctamente");
                    return;
                }

                const firstError = getFirstFieldError(res.errors);
                setError(firstError ?? res.message ?? "No se ha podido cambiar la contraseña");
            })();
        });
    }

    return (
        <div className="mx-auto w-full max-w-xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cuenta</h1>
                <p className="text-slate-500">Gestiona tu contraseña de administrador.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">Cambiar contraseña</h2>
                <p className="mt-1 text-sm text-slate-600">Por seguridad, necesitas tu contraseña actual para establecer una nueva.</p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium text-slate-900">
                            Contraseña actual
                        </label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            maxLength={72}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium text-slate-900">
                            Nueva contraseña
                        </label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={6}
                            maxLength={72}
                            disabled={isPending}
                        />
                        <p className="text-xs text-slate-500">Entre 6 y 72 caracteres.</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-900">
                            Confirmar nueva contraseña
                        </label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={6}
                            maxLength={72}
                            disabled={isPending}
                        />
                    </div>

                    {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</div>}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Cambiar contraseña"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
