"use client";

import type { GameControllerProps } from "@/types/components/game";

import { getDeviceConfig } from "@/app/actions/device-config";
import { claimMatchControl, createMatch, forceTakeoverMatch, registerThrowForPlayer } from "@/app/actions/matches";
import { CheckoutBustOverlay } from "@/components/game/CheckoutBustOverlay";
import { CricketMarksOverlay } from "@/components/game/CricketMarksOverlay";
import { DartboardCanvas } from "@/components/game/DartboardCanvas";
import { GameEffects } from "@/components/game/GameEffects";
import { GameScoreboard } from "@/components/game/GameScoreboard";
import { HiddenTopBar } from "@/components/game/HiddenTopBar";
import { TurnHud } from "@/components/game/TurnHud";
import { soundManager } from "@/lib/audio/sounds";
import { getOrCreateDeviceId } from "@/lib/device/device-id";
import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";
import { cn } from "@/lib/utils";
import type { CreateMatchInput } from "@/lib/validation/matches";
import type { CalibrationConfig, GameId, GameState, Hit } from "@/types/models/darts";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GAME_TYPE_LABELS: Record<GameId, string> = {
    x01: "X01",
    cricket: "Cricket",
    round_the_clock: "Alrededor del reloj",
    high_score: "Puntuación máxima",
    shanghai: "Shanghai",
    killer: "Asesino",
    halve_it: "A la mitad",
};

function getGameTypeLabel(id: GameId): string {
    return GAME_TYPE_LABELS[id] ?? id;
}

export function GameController({ initialState }: GameControllerProps) {
    const [gameState, setGameState] = useState<GameState | null>(initialState);
    const [deviceCalibration, setDeviceCalibration] = useState<CalibrationConfig | null>(null);
    const isAwaitingNextTurnRef = useRef(false);
    const isPersistingThrowRef = useRef(false);
    const [isPersistingThrow, setIsPersistingThrow] = useState(false);
    const [checkoutBustOverlay, setCheckoutBustOverlay] = useState<{ title: string; message: string } | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [cricketMarksOpen, setCricketMarksOpen] = useState(false);
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const [isRestartPending, startRestartTransition] = useTransition();
    const [lockDialog, setLockDialog] = useState<{ open: boolean; message: string }>(() => ({
        open: false,
        message: "Partida controlada por otro dispositivo",
    }));
    const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>(() => ({
        open: false,
        message: "",
    }));

    const LANDSCAPE_SCOREBOARD_WIDTH_PX = 280;
    let boardMaxSizeStyle: { maxWidth: string; maxHeight: string } | undefined;
    if (!isPortrait) {
        boardMaxSizeStyle = {
            maxWidth: `min(80vh, calc(100vw - ${LANDSCAPE_SCOREBOARD_WIDTH_PX * 2}px))`,
            maxHeight: "80vh",
        };
    }

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
        // No-op: markers are handled by DartboardCanvas.
    }, []);

    useEffect(() => {
        const deviceId = getOrCreateDeviceId();
        let cancelled = false;

        getDeviceConfig(deviceId).then((res) => {
            if (cancelled) return;
            if (res.success && res.data) {
                setDeviceCalibration(res.data.calibration ?? null);
                return;
            }

            setDeviceCalibration(null);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!gameState) return;

        // Si la partida ya está finalizada, no tiene sentido reclamar control.
        if (gameState.status === "completed" || gameState.status === "aborted") return;

        const deviceId = getOrCreateDeviceId();
        let cancelled = false;

        claimMatchControl({ matchId: gameState.id, deviceId }).then((res) => {
            if (cancelled) return;

            if (!res.success) {
                if (res.code === "LOCKED_BY_OTHER_DEVICE") {
                    setLockDialog({
                        open: true,
                        message: res.message ?? "Partida controlada por otro dispositivo",
                    });
                    return;
                }

                // Caso esperado: entre cargar estado y reclamar, puede que alguien haya finalizado la partida.
                if (res.message === "La partida ya está finalizada") {
                    return;
                }

                // En errores genéricos, no bloqueamos de inicio; pero evitamos silencio total.
                console.error("No se ha podido reclamar el control de la partida", res.message);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [gameState?.id]);

    const handleThrow = (hit: Hit, coordinates?: { x: number; y: number }): boolean => {
        if (!gameState) return false;
        if (gameState.status === "completed") return false;
        if (isAwaitingNextTurn) return false;
        if (isAwaitingNextTurnRef.current) return false;
        if (isPaused) return false;
        if (lockDialog.open) return false;
        if (isPersistingThrowRef.current) return false;

        // Unlock audio on interaction
        soundManager.unlock();

        // 1. Process Logic
        const gameLogic = getGameLogic(gameState.config.type);

        const currentPlayerStateBefore = gameState.playerStates.find((p) => p.playerId === gameState.currentPlayerId);
        const currentScoreBefore = currentPlayerStateBefore?.score;

        // processThrow calculates the result AND mutates player state (score)
        const throwResult = gameLogic.processThrow(gameState, hit);

        const throwIndex = gameState.currentTurn.throws.length + 1;

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
                title: "TIRADA NULA",
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

        // Persist throw (best-effort). This enables refresh persistence via the loader.
        // NOTE: We currently don't persist exact hit coordinates (x/y) yet; segment/multiplier is enough to replay.
        const deviceId = getOrCreateDeviceId();
        const previousState = gameState;
        isPersistingThrowRef.current = true;
        setIsPersistingThrow(true);

        void (async () => {
            try {
                const res = await registerThrowForPlayer(gameState.id, {
                    deviceId,
                    playerId: gameState.currentPlayerId,
                    segment: throwResult.hit.segment,
                    multiplier: throwResult.hit.multiplier,
                    x: coordinates?.x ?? 0,
                    y: coordinates?.y ?? 0,
                    points: throwResult.points,
                    isBust: throwResult.isBust,
                    isWin: throwResult.isWin,
                    isValid: throwResult.isValid,
                    roundIndex: gameState.currentTurn.roundIndex,
                    throwIndex,
                });

                if (res.success) return;

                // Si el servidor rechaza (lock u otros errores), evitamos divergencia.
                setGameState(previousState);
                isAwaitingNextTurnRef.current = false;

                if (res.code === "LOCKED_BY_OTHER_DEVICE") {
                    setLockDialog({
                        open: true,
                        message: res.message ?? "Partida controlada por otro dispositivo",
                    });
                    return;
                }

                setErrorDialog({
                    open: true,
                    message: res.message ?? "No se ha podido guardar el lanzamiento",
                });
            } catch (error: unknown) {
                setGameState(previousState);
                isAwaitingNextTurnRef.current = false;
                console.error("Error inesperado al guardar el lanzamiento", error);
            } finally {
                isPersistingThrowRef.current = false;
                setIsPersistingThrow(false);
            }
        })();

        setGameState(newState);
        return true;
    };

    function handleTryClaimControl() {
        if (!gameState) return;

        const deviceId = getOrCreateDeviceId();

        claimMatchControl({ matchId: gameState.id, deviceId }).then((res) => {
            if (res.success) {
                setLockDialog((prev) => ({ ...prev, open: false }));
                return;
            }

            if (res.code === "LOCKED_BY_OTHER_DEVICE") {
                setLockDialog({
                    open: true,
                    message: res.message ?? "Partida controlada por otro dispositivo",
                });
                return;
            }

            setLockDialog({
                open: true,
                message: res.message ?? "No se ha podido reclamar el control",
            });
        });
    }

    function handleForceTakeover() {
        if (!gameState) return;

        const deviceId = getOrCreateDeviceId();

        forceTakeoverMatch({ matchId: gameState.id, deviceId }).then((res) => {
            if (res.success) {
                setLockDialog((prev) => ({ ...prev, open: false }));
                return;
            }

            setLockDialog({
                open: true,
                message: res.message ?? "No se ha podido tomar el control",
            });
        });
    }

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

    function handleRestartSameConfig() {
        if (!gameState) return;
        if (gameState.players.length === 0) return;

        const playerIds = gameState.players.map((p) => p.id);

        startRestartTransition(async () => {
            const result = await createMatch({
                gameId: gameState.config.type,
                config: gameState.config as unknown as CreateMatchInput["config"],
                playerIds,
            });

            if (result.success && result.data) {
                window.location.href = `/game?matchId=${result.data.id}`;
            } else {
                console.error("No se ha podido reiniciar la partida", result.message);
            }
        });
    }

    if (!gameState) {
        return (
            <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
                <HiddenTopBar defaultShowNewGame={true} getBoardRect={() => boardContainerRef.current?.getBoundingClientRect() ?? null} />
                <div className="text-white text-xl animate-pulse">Esperando partida...</div>
                <div className="text-slate-500 mt-2">Crea una nueva partida desde el menú</div>
            </main>
        );
    }

    return (
        <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col">
            <HiddenTopBar
                defaultShowNewGame={false}
                canRestartSameConfig={gameState.status === "active" || gameState.status === "completed"}
                onRestartSameConfig={handleRestartSameConfig}
                getBoardRect={() => boardContainerRef.current?.getBoundingClientRect() ?? null}
            />
            <Dialog open={lockDialog.open} onOpenChange={(open) => setLockDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Partida bloqueada</DialogTitle>
                        <DialogDescription>
                            {lockDialog.message}. Para evitar conflictos, este dispositivo no puede registrar lanzamientos hasta tener el control.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={handleTryClaimControl}>
                            Reintentar
                        </Button>
                        <Button onClick={handleForceTakeover}>Tomar control</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>{errorDialog.message}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" onClick={() => setErrorDialog({ open: false, message: "" })}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <GameEffects gameState={gameState} />
            <CheckoutBustOverlay
                open={Boolean(checkoutBustOverlay)}
                title={checkoutBustOverlay?.title ?? ""}
                message={checkoutBustOverlay?.message ?? ""}
                onClose={() => setCheckoutBustOverlay(null)}
            />
            <CricketMarksOverlay open={cricketMarksOpen} gameState={gameState} onClose={() => setCricketMarksOpen(false)} />

            {/* HUD Layer */}
            <TurnHud gameState={gameState} />

            {/* Main Layout */}
            <div className="flex-1 relative">
                {!isPortrait && (
                    <div className="absolute inset-y-0 left-0 z-20">
                        <GameScoreboard
                            gameState={gameState}
                            layout="landscape"
                            isPaused={isPaused}
                            onOpenCricketMarks={gameState.config.type === "cricket" ? () => setCricketMarksOpen(true) : undefined}
                        />
                    </div>
                )}

                <div className={cn("h-full w-full flex", isPortrait ? "flex-col" : "flex-row")}>
                    {/* Game Area */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div ref={boardContainerRef} className="w-full h-full aspect-square" style={boardMaxSizeStyle}>
                            <DartboardCanvas
                                key={`${gameState.currentPlayerId}:${gameState.currentRound}`}
                                onThrow={(hit, coordinates) => handleThrow(hit, coordinates)}
                                calibration={deviceCalibration}
                                disabled={gameState.status === "completed" || isAwaitingNextTurn || isPaused || lockDialog.open || isPersistingThrow}
                            />
                        </div>
                    </div>

                    {isPortrait && (
                        <div className="w-full">
                            <GameScoreboard
                                gameState={gameState}
                                layout="portrait"
                                isPaused={isPaused}
                                onOpenCricketMarks={gameState.config.type === "cricket" ? () => setCricketMarksOpen(true) : undefined}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none">
                <div className="text-slate-500 text-xs">
                    <span>{getGameTypeLabel(gameState.config.type)}</span>
                    <span className="mx-1">•</span>
                    <span>{gameState.players.length} Jugadores</span>
                    <span className="mx-1">•</span>
                    <span>Ronda {gameState.currentRound}</span>
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
                    <div className="pointer-events-auto bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3">
                        <div>
                            <div className="text-sm opacity-90">Ganador</div>
                            <div className="text-lg">{gameState.players.find((p) => p.id === gameState.winnerId)?.name ?? "-"}</div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRestartSameConfig}
                            disabled={isRestartPending}
                            data-no-throw="true"
                            className={cn(
                                "ml-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/20 border border-white/20",
                                "transition disabled:opacity-60 disabled:cursor-not-allowed",
                            )}
                        >
                            {isRestartPending ? "Reiniciando…" : "Repetir"}
                        </button>
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
