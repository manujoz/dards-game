"use client";

import { Crown, Skull, Target } from "lucide-react";

import { getGameName } from "@/lib/constants/game-names";
import { getGameLogic } from "@/lib/game/games";
import { cn } from "@/lib/utils";

import type { GameScoreboardProps } from "@/types/components/game";

function formatScore(value: string | number): string {
    return typeof value === "number" ? String(value) : value;
}

function getCricketExtras(row: { marks?: Record<string, number> }): { closedCount: number; total: number } {
    const marks = row.marks ?? {};
    const targets = [20, 19, 18, 17, 16, 15, 25];

    const closedCount = targets.reduce((acc, n) => {
        const m = Number(marks[String(n)] ?? 0) || 0;
        return acc + (m >= 3 ? 1 : 0);
    }, 0);

    return { closedCount, total: targets.length };
}

export function GameScoreboard({ gameState, layout, isPaused, onOpenCricketMarks }: GameScoreboardProps) {
    const scoreboard = getGameLogic(gameState.config.type).getScoreboard(gameState);

    // Scoreboard should only be interactive when the match is paused.
    // Otherwise, taps on it should register as a MISS via the global handler.
    const allowInteraction = isPaused || gameState.status !== "active";
    const pointerEventsClassName = allowInteraction ? "pointer-events-auto" : "pointer-events-none";

    if (layout === "portrait") {
        return (
            <div className={cn("w-full px-3 pb-3", pointerEventsClassName)}>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-400">{scoreboard.roundIndicator}</div>

                    {scoreboard.gameType === "cricket" && onOpenCricketMarks && (
                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-700 text-slate-200 text-xs hover:bg-slate-900"
                            onClick={onOpenCricketMarks}
                        >
                            Marcas
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {scoreboard.rows.map((r) => {
                        const isActive = r.active;
                        const isWinner = gameState.status === "completed" && gameState.winnerId === r.playerId;
                        const cricketExtras = scoreboard.gameType === "cricket" ? getCricketExtras(r) : null;

                        return (
                            <div
                                key={r.playerId}
                                className={cn(
                                    "min-w-[160px] rounded-xl border p-3 bg-slate-950/70",
                                    isActive ? "border-emerald-400/40 shadow-[0_0_0_2px_rgba(52,211,153,0.18)]" : "border-slate-800",
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-bold text-white truncate">{r.playerName}</div>
                                    {isWinner && <Crown className="h-4 w-4 text-yellow-400" />}
                                </div>

                                <div className={cn("mt-2 text-2xl font-black font-mono", isActive ? "text-emerald-300" : "text-slate-200")}>
                                    {formatScore(r.score)}
                                </div>

                                {scoreboard.gameType === "cricket" && cricketExtras && (
                                    <div className="mt-1 text-xs text-slate-400">
                                        Cierres: {cricketExtras.closedCount}/{cricketExtras.total}
                                    </div>
                                )}

                                {scoreboard.gameType === "killer" && r.details.length >= 3 && (
                                    <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1">
                                            <Target className="h-3.5 w-3.5" /> {String(r.details[0]?.value ?? "-")}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Skull className="h-3.5 w-3.5" /> {String(r.details[2]?.value ?? "-")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Landscape: left vertical list
    return (
        <aside className={cn("h-full w-[240px] max-w-[38vw] p-4", pointerEventsClassName)}>
            <div className="bg-slate-900/65 backdrop-blur rounded-2xl border border-slate-800 shadow-xl h-full flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">{getGameName(scoreboard.gameType)}</div>
                    <div className="text-sm text-slate-300 mt-1">{scoreboard.roundIndicator}</div>

                    {scoreboard.gameType === "cricket" && onOpenCricketMarks && (
                        <button
                            type="button"
                            className="mt-3 w-full px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-white font-bold hover:bg-slate-800"
                            onClick={onOpenCricketMarks}
                        >
                            Ver marcas
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-3 flex flex-col gap-2">
                        {scoreboard.rows.map((r) => {
                            const isActive = r.active;
                            const isWinner = gameState.status === "completed" && gameState.winnerId === r.playerId;
                            const cricketExtras = scoreboard.gameType === "cricket" ? getCricketExtras(r) : null;

                            return (
                                <div
                                    key={r.playerId}
                                    className={cn(
                                        "rounded-xl border px-3 py-3 bg-slate-950/60",
                                        isActive ? "border-emerald-400/40" : "border-slate-800",
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className={cn("font-bold truncate", isActive ? "text-emerald-200" : "text-white")}>{r.playerName}</div>

                                        <div className="flex items-center gap-2">
                                            {isWinner && <Crown className="h-4 w-4 text-yellow-400" />}
                                            {scoreboard.gameType === "killer" &&
                                                r.details.length >= 3 &&
                                                String(r.details[2]?.value) === "Asesino" && <Skull className="h-4 w-4 text-red-400" />}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-end justify-between gap-3">
                                        <div className={cn("text-2xl font-black font-mono", isActive ? "text-emerald-300" : "text-slate-200")}>
                                            {formatScore(r.score)}
                                        </div>

                                        {scoreboard.gameType === "cricket" && cricketExtras && (
                                            <div className="text-xs text-slate-400">
                                                {cricketExtras.closedCount}/{cricketExtras.total}
                                            </div>
                                        )}

                                        {scoreboard.gameType === "round_the_clock" && <div className="text-xs text-slate-400">Objetivo</div>}
                                    </div>

                                    {scoreboard.gameType === "killer" && r.details.length >= 3 && (
                                        <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1">
                                                <Target className="h-3.5 w-3.5" /> {String(r.details[0]?.value ?? "-")}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Skull className="h-3.5 w-3.5" /> {String(r.details[2]?.value ?? "-")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
}
