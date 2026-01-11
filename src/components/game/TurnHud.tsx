"use client";

import { cn } from "@/lib/utils";
import { GameState, Throw } from "@/types/models/darts";

interface TurnHudProps {
    gameState: GameState;
}

function formatHit(hit: Throw["hit"]): string {
    if (hit.multiplier === 0) return "MISS";
    const segment = hit.segment === 25 ? "BULL" : hit.segment.toString();
    if (hit.multiplier === 3) return `T${segment}`;
    if (hit.multiplier === 2) return `D${segment}`;
    return segment;
}

function getThrowStyles(multiplier: number): string {
    if (multiplier === 0) return "bg-red-900/80 border-red-700 text-red-200";
    if (multiplier === 3) return "bg-yellow-900/80 border-yellow-600 text-yellow-200";
    if (multiplier === 2) return "bg-green-900/80 border-green-600 text-green-200";
    return "bg-slate-800/90 border-slate-600 text-white";
}

export function TurnHud({ gameState }: TurnHudProps) {
    const { currentPlayerId, players, playerStates, currentTurn, currentRound } = gameState;

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    const playerState = playerStates.find((p) => p.playerId === currentPlayerId);

    if (!currentPlayer || !playerState) return null;

    const throws = currentTurn.throws || [];
    const throwsLeft = 3 - throws.length;

    return (
        <div className="absolute top-4 left-0 right-0 px-4 flex justify-end items-start pointer-events-none">
            {/* Right: Throws */}
            <div className="flex flex-col gap-2 items-end">
                <div className="text-xs text-slate-500 mr-1">
                    <span className="text-slate-400">{currentPlayer.name}</span>
                    <span className="mx-1">•</span>
                    <span>Round {currentRound}</span>
                </div>
                <div className="flex gap-2 justify-end">
                    {throws.map((t, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-12 h-12 flex items-center justify-center rounded-lg font-bold border-2 shadow-lg text-lg",
                                getThrowStyles(t.hit.multiplier),
                            )}
                        >
                            {formatHit(t.hit)}
                        </div>
                    ))}
                    {Array.from({ length: throwsLeft }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-12 h-12 rounded-lg border-2 border-slate-800 bg-slate-900/50" />
                    ))}
                </div>

                {currentTurn.throws.length > 0 && (
                    <div className="text-right">
                        <span className="bg-slate-900/80 text-slate-300 px-3 py-1 rounded-full text-sm font-mono border border-slate-700">
                            Current: {currentTurn.throws.reduce((acc, t) => acc + t.points, 0)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
