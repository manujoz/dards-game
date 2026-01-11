"use client";

import type { AdminLoginFormProps } from "@/types/components/home";

import { useRouter } from "next/navigation";
import * as React from "react";

import { loginAdmin } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminLoginForm({ returnTo }: AdminLoginFormProps) {
    const router = useRouter();

    const [nickname, setNickname] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        startTransition(async () => {
            const result = await loginAdmin({ nickname, password });

            if (!result.success) {
                setErrorMessage(result.message ?? "No se ha podido iniciar sesión");
                return;
            }

            if (returnTo) {
                router.push(returnTo);
                return;
            }

            router.refresh();
        });
    }

    return (
        <div className="w-full max-w-md">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur">
                <div className="space-y-1">
                    <h2 className="text-lg font-extrabold tracking-tight text-white">Acceso de administrador</h2>
                    <p className="text-sm text-slate-300">Inicia sesión para habilitar el panel y el juego.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3" aria-label="Formulario de acceso de administrador">
                    <div className="space-y-1">
                        <label htmlFor="admin-nickname" className="text-sm font-semibold text-slate-200">
                            Apodo
                        </label>
                        <Input
                            id="admin-nickname"
                            name="nickname"
                            autoComplete="username"
                            inputMode="text"
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            placeholder="Tu apodo"
                            className={cn("h-12 text-base", "bg-slate-950/50 text-white placeholder:text-slate-500", "border-white/10")}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="admin-password" className="text-sm font-semibold text-slate-200">
                            Contraseña
                        </label>
                        <Input
                            id="admin-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            className={cn("h-12 text-base", "bg-slate-950/50 text-white placeholder:text-slate-500", "border-white/10")}
                        />
                    </div>

                    {errorMessage ? <p className="text-sm font-semibold text-red-300">{errorMessage}</p> : null}

                    <Button
                        type="submit"
                        size="lg"
                        disabled={isPending}
                        className={cn(
                            "w-full h-12 text-base font-extrabold uppercase tracking-widest",
                            "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500",
                            "disabled:opacity-70",
                        )}
                    >
                        {isPending ? "Accediendo…" : "Entrar"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
