"use client";

import { DartboardCanvas } from "@/components/game/DartboardCanvas";
import { GameEffects } from "@/components/game/GameEffects";
import { HiddenTopBar } from "@/components/game/HiddenTopBar";
import { TurnHud } from "@/components/game/TurnHud";
import { soundManager } from "@/lib/audio/sounds";
import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";
import { GameState, Hit } from "@/types/models/darts";
import { useEffect, useState } from "react";

interface GameControllerProps {
    initialState: GameState | null;
}

export function GameController({ initialState }: GameControllerProps) {
    const [gameState, setGameState] = useState<GameState | null>(initialState);

    // If props change (e.g. new match loaded), update state
    useEffect(() => {
        setGameState(initialState);
    }, [initialState]);

    const handleThrow = (hit: Hit) => {
        if (!gameState) return;
        if (gameState.status === "completed") return;

        // Unlock audio on interaction
        soundManager.unlock();

        // 1. Process Logic
        const gameLogic = getGameLogic(gameState.config.type);

        // processThrow calculates the result AND mutates player state (score)
        const throwResult = gameLogic.processThrow(gameState, hit);

        // 2. Add Throw to State
        let newState = GameEngine.addThrow(gameState, throwResult);

        // 3. Sync Turn Score (Since GameEngine doesn't auto-sync endScore for hits)
        const currentPlayerState = newState.playerStates.find((p) => p.playerId === newState.currentPlayerId);
        if (currentPlayerState) {
            newState.currentTurn.endScore = currentPlayerState.score;
        }

        // 4. Check Turn End
        if (newState.currentTurn.throws.length >= 3 || throwResult.isBust || throwResult.isWin) {
            if (throwResult.isWin) {
                // GameEngine already sets status=completed if throwResult.isWin
                // Maybe trigger server action to save "Win" status here?
                // For now, we just update local state.
            } else {
                // Standard turn switch
                newState = GameEngine.nextTurn(newState);
            }
        }

        // TODO: Here we should call a Server Action to persist the throw!
        // await saveThrow(matchId, throwResult);

        setGameState(newState);
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
            {/* HUD Layer */}
            <TurnHud gameState={gameState} />

            {/* Game Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-[80vh] max-h-[80vh] w-full h-full aspect-square">
                    <DartboardCanvas onThrow={handleThrow} disabled={gameState.status === "completed"} />
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none">
                <div className="text-slate-500 text-xs">
                    {gameState.config.type.toUpperCase()} • {gameState.players.length} Players • Round {gameState.currentRound}
                </div>

                {gameState.status === "completed" && (
                    <div className="pointer-events-auto bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-bounce font-bold">
                        GAME OVER! Winner: {gameState.players.find((p) => p.id === gameState.winnerId)?.name}
                    </div>
                )}
            </div>
        </main>
    );
}
