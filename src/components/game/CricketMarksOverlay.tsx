"use client";

import type { CricketMarksOverlayProps } from "@/types/components/game";
import type { CricketConfig } from "@/types/models/darts";

import { Fragment } from "react";

import { getGameLogic } from "@/lib/game/games";
import { cn } from "@/lib/utils";

const CRICKET_NUMBERS_DEFAULT: number[] = [20, 19, 18, 17, 16, 15, 25];

function getMarksColor(marks: number): string {
    if (marks >= 3) return "bg-emerald-600/70 text-white border-emerald-300/30";
    if (marks === 2) return "bg-amber-600/55 text-white border-amber-300/30";
    if (marks === 1) return "bg-sky-600/50 text-white border-sky-300/30";
    return "bg-slate-900/60 text-slate-300 border-slate-700";
}

function formatCricketNumber(n: number): string {
    return n === 25 ? "BULL" : String(n);
}

export function CricketMarksOverlay({ open, gameState, onClose }: CricketMarksOverlayProps) {
    if (!open) return null;

    const scoreboard = getGameLogic(gameState.config.type).getScoreboard(gameState);
    const config = gameState.config as CricketConfig;
    const numbers = config.numbers?.length ? config.numbers : CRICKET_NUMBERS_DEFAULT;

    // Detect "dead" numbers: all players have 3+ marks.
    const isDead = (n: number): boolean => {
        return scoreboard.rows.every((r) => (Number(r.marks?.[String(n)] ?? 0) || 0) >= 3);
    };

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Marcas de Cricket"
            data-no-throw="true"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-[min(1100px,96vw)] max-h-[92vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <div className="text-sm text-slate-400">Cricket</div>
                        <div className="text-xl font-extrabold text-white">Marcas</div>
                        <div className="text-xs text-slate-500 mt-1">{scoreboard.roundIndicator}</div>
                    </div>

                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-slate-800/70 text-white border border-slate-700 hover:bg-slate-800"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-4 overflow-auto">
                    <div className="min-w-[720px]">
                        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${scoreboard.rows.length}, minmax(120px, 1fr))` }}>
                            <div className="px-3 py-2 text-xs uppercase tracking-wider text-slate-400">Número</div>
                            {scoreboard.rows.map((r) => (
                                <div key={r.playerId} className="px-3 py-2 text-xs uppercase tracking-wider text-slate-400 truncate">
                                    {r.playerName}
                                </div>
                            ))}

                            {numbers.map((n) => {
                                const dead = isDead(n);
                                return (
                                    <Fragment key={`row-${n}`}>
                                        <div
                                            className={cn(
                                                "px-3 py-3 border-t border-slate-800 text-white font-bold",
                                                dead && "text-slate-400 line-through",
                                            )}
                                        >
                                            {formatCricketNumber(n)}
                                            {dead && <span className="ml-2 text-xs text-slate-500">(muerto)</span>}
                                        </div>

                                        {scoreboard.rows.map((r) => {
                                            const marks = Number(r.marks?.[String(n)] ?? 0) || 0;
                                            return (
                                                <div key={`${n}-${r.playerId}`} className="px-3 py-3 border-t border-slate-800">
                                                    <div
                                                        className={cn(
                                                            "h-10 rounded-lg border flex items-center justify-center font-black",
                                                            getMarksColor(marks),
                                                        )}
                                                    >
                                                        {Math.min(3, marks)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                        <div>Colores: 0 (gris), 1 (azul), 2 (amarillo), 3 (verde). Un número queda “muerto” cuando todos lo han cerrado.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
