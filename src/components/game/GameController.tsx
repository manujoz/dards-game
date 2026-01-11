"use client";

import { CheckoutBustOverlay } from "@/components/game/CheckoutBustOverlay";
import { CricketMarksOverlay } from "@/components/game/CricketMarksOverlay";
import { DartboardCanvas } from "@/components/game/DartboardCanvas";
import { GameEffects } from "@/components/game/GameEffects";
import { GameScoreboard } from "@/components/game/GameScoreboard";
import { HiddenTopBar } from "@/components/game/HiddenTopBar";
import { TurnHud } from "@/components/game/TurnHud";
import { soundManager } from "@/lib/audio/sounds";
import { BOARD_DIMENSIONS_MM } from "@/lib/game/board-geometry";
import { transformCoordinates } from "@/lib/game/calibration";
import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";
import { mapCoordinatesToHit } from "@/lib/game/score-mapper";
import { cn } from "@/lib/utils";
import type { CalibrationConfig, GameState, Hit } from "@/types/models/darts";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GameControllerProps {
    initialState: GameState | null;
}

export function GameController({ initialState }: GameControllerProps) {
    const [gameState, setGameState] = useState<GameState | null>(initialState);
    const isAwaitingNextTurnRef = useRef(false);
    const [checkoutBustOverlay, setCheckoutBustOverlay] = useState<{ title: string; message: string } | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [cricketMarksOpen, setCricketMarksOpen] = useState(false);
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const [lastScreenHit, setLastScreenHit] = useState<{ x: number; y: number; kind: "hit" | "miss" } | null>(null);

    // NOTE: This component is remounted when matchId changes (see the page `key`).

    const isAwaitingNextTurn = Boolean(gameState && gameState.status === "active" && GameEngine.isTurnComplete(gameState));

    useEffect(() => {
        isAwaitingNextTurnRef.current = isAwaitingNextTurn;
    }, [isAwaitingNextTurn]);

    useEffect(() => {
        const update = () => {
            if (typeof window === "undefined") return;
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        if (!lastScreenHit) return;
        const t = window.setTimeout(() => setLastScreenHit(null), 350);
        return () => window.clearTimeout(t);
    }, [lastScreenHit]);

    function getAutoCalibrationFromRect(rect: DOMRect): CalibrationConfig {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const minDim = Math.min(rect.width, rect.height);
        const outerRadiusPx = (minDim / 2) * 0.95;
        const scoringRadiusPx = outerRadiusPx * 0.84;

        const scale = scoringRadiusPx / BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R;

        return {
            centerX,
            centerY,
            scale,
            rotation: 0,
        };
    }

    function handleGlobalPointerDown(e: React.PointerEvent<HTMLElement>) {
        if (!gameState) return;
        if (gameState.status === "completed") return;
        if (isPaused) return;
        if (isAwaitingNextTurn) return;
        if (isAwaitingNextTurnRef.current) return;

        const target = e.target as Element | null;
        if (target?.closest("[data-no-throw='true']")) return;

        const boardEl = boardContainerRef.current;
        if (!boardEl) return;

        // Unlock audio on interaction
        soundManager.unlock();

        const rect = boardEl.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const cal = getAutoCalibrationFromRect(rect);
        const boardCoords = transformCoordinates(screenX, screenY, cal);
        const hit = mapCoordinatesToHit(boardCoords.x, boardCoords.y);

        setLastScreenHit({ x: e.clientX, y: e.clientY, kind: hit.multiplier === 0 ? "miss" : "hit" });
        handleThrow(hit);
    }

    const handleThrow = (hit: Hit) => {
        if (!gameState) return;
        if (gameState.status === "completed") return;
        if (isAwaitingNextTurn) return;
        if (isAwaitingNextTurnRef.current) return;
        if (isPaused) return;

        // Unlock audio on interaction
        soundManager.unlock();

        // 1. Process Logic
        const gameLogic = getGameLogic(gameState.config.type);

        const currentPlayerStateBefore = gameState.playerStates.find((p) => p.playerId === gameState.currentPlayerId);
        const currentScoreBefore = currentPlayerStateBefore?.score;

        // processThrow calculates the result AND mutates player state (score)
        const throwResult = gameLogic.processThrow(gameState, hit);

        // 2. Add Throw to State
        const newState = GameEngine.addThrow(gameState, throwResult);

        // 3. Sync Turn Score (Since GameEngine doesn't auto-sync endScore for hits)
        const currentPlayerState = newState.playerStates.find((p) => p.playerId === newState.currentPlayerId);
        if (currentPlayerState) {
            newState.currentTurn.endScore = currentPlayerState.score;
        }

        // 4. Check Turn End
        // Turn advancement is now user-confirmed (button) so the HUD can show the 3rd dart/bust.

        if (
            gameState.config.type === "x01" &&
            typeof currentScoreBefore === "number" &&
            throwResult.isBust &&
            !throwResult.isWin &&
            currentScoreBefore - throwResult.points === 0
        ) {
            const outMode = gameState.config.outMode;
            let outRule = "";
            if (outMode === "double") {
                outRule = "Necesitas cerrar con un DOBLE (incluye D-BULL).";
            } else if (outMode === "master") {
                outRule = "Necesitas cerrar con DOBLE o TRIPLE.";
            }

            setCheckoutBustOverlay({
                title: "BUST",
                message: `Checkout inválido. ${outRule}`,
            });
        }

        if (throwResult.isWin || newState.status === "completed") {
            // Lock immediately so an extra fast tap can't register and accidentally bust after a checkout.
            isAwaitingNextTurnRef.current = true;
        }

        if (newState.status === "active" && GameEngine.isTurnComplete(newState)) {
            // Lock immediately (avoids fast taps registering extra throws before React re-renders).
            isAwaitingNextTurnRef.current = true;
        }

        // TODO: Here we should call a Server Action to persist the throw!
        // await saveThrow(matchId, throwResult);

        setGameState(newState);
    };

    const handleNextTurn = () => {
        if (!gameState) return;
        if (!isAwaitingNextTurn) return;
        isAwaitingNextTurnRef.current = false;
        setGameState(GameEngine.nextTurn(gameState));
    };

    const handleTogglePause = () => {
        if (!gameState) return;
        if (gameState.status !== "active") return;
        if (isAwaitingNextTurn) return;
        setIsPaused((prev) => !prev);
    };

    if (!gameState) {
        return (
            <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
                <HiddenTopBar />
                <div className="text-white text-xl animate-pulse">Waiting for Match...</div>
                <div className="text-slate-500 mt-2">Create a new game from the menu</div>
            </main>
        );
    }

    return (
        <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col" onPointerDown={handleGlobalPointerDown}>
            <HiddenTopBar />
            <GameEffects gameState={gameState} />
            <CheckoutBustOverlay
                open={Boolean(checkoutBustOverlay)}
                title={checkoutBustOverlay?.title ?? ""}
                message={checkoutBustOverlay?.message ?? ""}
                onClose={() => setCheckoutBustOverlay(null)}
            />
            <CricketMarksOverlay open={cricketMarksOpen} gameState={gameState} onClose={() => setCricketMarksOpen(false)} />

            {lastScreenHit && (
                <div
                    className={cn(
                        "absolute z-40 w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none",
                        lastScreenHit.kind === "miss" ? "bg-red-500" : "bg-emerald-400",
                    )}
                    style={{ left: lastScreenHit.x, top: lastScreenHit.y }}
                />
            )}

            {/* HUD Layer */}
            <TurnHud gameState={gameState} />

            {/* Main Layout */}
            <div className={cn("flex-1 flex", isPortrait ? "flex-col" : "flex-row")}>
                {!isPortrait && (
                    <GameScoreboard
                        gameState={gameState}
                        layout="landscape"
                        onOpenCricketMarks={gameState.config.type === "cricket" ? () => setCricketMarksOpen(true) : undefined}
                    />
                )}

                {/* Game Area */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div ref={boardContainerRef} className="max-w-[80vh] max-h-[80vh] w-full h-full aspect-square">
                        <DartboardCanvas
                            onThrow={(hit) => handleThrow(hit)}
                            disabled={gameState.status === "completed" || isAwaitingNextTurn || isPaused}
                        />
                    </div>
                </div>

                {isPortrait && (
                    <div className="w-full">
                        <GameScoreboard
                            gameState={gameState}
                            layout="portrait"
                            onOpenCricketMarks={gameState.config.type === "cricket" ? () => setCricketMarksOpen(true) : undefined}
                        />
                    </div>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none">
                <div className="text-slate-500 text-xs">
                    <span>{gameState.config.type.toUpperCase()}</span>
                    <span className="mx-1">•</span>
                    <span>{gameState.players.length} Players</span>
                    <span className="mx-1">•</span>
                    <span>Round {gameState.currentRound}</span>
                </div>

                {isAwaitingNextTurn && (
                    <div className="pointer-events-auto">
                        <button
                            type="button"
                            onClick={handleNextTurn}
                            onPointerDown={(e) => e.stopPropagation()}
                            data-no-throw="true"
                            className={
                                "w-[120px] h-[120px] rounded-full bg-gradient-to-br from-red-500 to-red-700 " +
                                "shadow-[0_20px_60px_rgba(220,38,38,0.35)] border border-red-300/25 " +
                                "flex flex-col items-center justify-center gap-2 text-white font-extrabold " +
                                "transition-transform active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
                            }
                        >
                            <ArrowRight className="h-7 w-7" />
                            <span className="text-center leading-tight">
                                Siguiente
                                <br />
                                turno
                            </span>
                        </button>
                    </div>
                )}

                {!isAwaitingNextTurn && gameState.status === "active" && (
                    <div className="pointer-events-auto">
                        <button
                            type="button"
                            onClick={handleTogglePause}
                            onPointerDown={(e) => e.stopPropagation()}
                            data-no-throw="true"
                            className={
                                "w-[120px] h-[120px] rounded-full bg-gradient-to-br from-slate-700 to-slate-900 " +
                                "shadow-[0_20px_60px_rgba(15,23,42,0.50)] border border-slate-500/20 " +
                                "flex flex-col items-center justify-center gap-2 text-white font-extrabold " +
                                "transition-transform active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/30"
                            }
                        >
                            {isPaused ? <Play className="h-7 w-7" /> : <Pause className="h-7 w-7" />}
                            <span className="text-center leading-tight">{isPaused ? "Reanudar" : "Pausar"}</span>
                        </button>
                    </div>
                )}

                {gameState.status === "completed" && (
                    <div className="pointer-events-auto bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-bounce font-bold">
                        GAME OVER! Winner: {gameState.players.find((p) => p.id === gameState.winnerId)?.name}
                    </div>
                )}
            </div>

            {isPaused && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <div className="bg-slate-950/55 border border-slate-700 text-white px-6 py-4 rounded-2xl backdrop-blur shadow-2xl">
                        <div className="text-2xl font-extrabold">PAUSADO</div>
                        <div className="text-sm text-slate-300 mt-1">Toca “Reanudar” para seguir</div>
                    </div>
                </div>
            )}
        </main>
    );
}
