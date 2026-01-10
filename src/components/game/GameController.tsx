"use client";

import { DartboardCanvas } from "@/components/game/DartboardCanvas";
import { CheckoutBustOverlay } from "@/components/game/CheckoutBustOverlay";
import { GameEffects } from "@/components/game/GameEffects";
import { HiddenTopBar } from "@/components/game/HiddenTopBar";
import { TurnHud } from "@/components/game/TurnHud";
import { soundManager } from "@/lib/audio/sounds";
import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";
import { GameState, Hit } from "@/types/models/darts";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GameControllerProps {
    initialState: GameState | null;
}

export function GameController({ initialState }: GameControllerProps) {
    const [gameState, setGameState] = useState<GameState | null>(initialState);
    const isAwaitingNextTurnRef = useRef(false);
    const [checkoutBustOverlay, setCheckoutBustOverlay] = useState<{ title: string; message: string } | null>(null);

    // If props change (e.g. new match loaded), update state
    useEffect(() => {
        setGameState(initialState);
    }, [initialState]);

    const isAwaitingNextTurn = Boolean(gameState && gameState.status === "active" && GameEngine.isTurnComplete(gameState));

    useEffect(() => {
        isAwaitingNextTurnRef.current = isAwaitingNextTurn;
    }, [isAwaitingNextTurn]);

    const handleThrow = (hit: Hit) => {
        if (!gameState) return;
        if (gameState.status === "completed") return;
        if (isAwaitingNextTurn) return;
        if (isAwaitingNextTurnRef.current) return;

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
        <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col">
            <HiddenTopBar />
            <GameEffects gameState={gameState} />
            <CheckoutBustOverlay
                open={Boolean(checkoutBustOverlay)}
                title={checkoutBustOverlay?.title ?? ""}
                message={checkoutBustOverlay?.message ?? ""}
                onClose={() => setCheckoutBustOverlay(null)}
            />
            {/* HUD Layer */}
            <TurnHud gameState={gameState} />

            {/* Game Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-[80vh] max-h-[80vh] w-full h-full aspect-square">
                    <DartboardCanvas onThrow={handleThrow} disabled={gameState.status === "completed" || isAwaitingNextTurn} />
                </div>
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

                {gameState.status === "completed" && (
                    <div className="pointer-events-auto bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-bounce font-bold">
                        GAME OVER! Winner: {gameState.players.find((p) => p.id === gameState.winnerId)?.name}
                    </div>
                )}
            </div>
        </main>
    );
}
