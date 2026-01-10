"use client";

import type { CheckoutBustOverlayProps } from "@/types/components/game";

import { X } from "lucide-react";

export function CheckoutBustOverlay({ open, title, message, onClose }: CheckoutBustOverlayProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-black/85 px-6 text-white"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl rounded-2xl border border-red-500/20 bg-gradient-to-b from-slate-950 to-black p-8 shadow-[0_30px_120px_rgba(0,0,0,0.8)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cerrar</span>
                </button>

                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-600/15 ring-2 ring-red-500/35">
                    <div className="h-14 w-14 rounded-full bg-red-600/30 ring-2 ring-red-500/40" />
                </div>

                <h2 className="text-center text-4xl font-black tracking-tight text-red-200">{title}</h2>
                <p className="mt-4 text-center text-lg text-slate-200/90">{message}</p>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full max-w-xs rounded-xl bg-gradient-to-br from-red-500 to-red-700 px-6 py-4 text-lg font-extrabold text-white shadow-[0_20px_60px_rgba(220,38,38,0.30)] transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
                    >
                        Entendido
                    </button>
                    <div className="text-center text-xs text-slate-400">
                        El turno queda bloqueado. Pulsa “Siguiente turno” cuando quieras continuar.
                    </div>
                </div>
            </div>
        </div>
    );
}
