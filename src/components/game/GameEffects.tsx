// src/components/game/GameEffects.tsx
"use client";

import { soundManager } from "@/lib/audio/sounds";
import { GameState, Throw } from "@/types/models/darts";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

interface GameEffectsProps {
    gameState: GameState;
}

export function GameEffects({ gameState }: GameEffectsProps) {
    const lastThrowRef = useRef<Throw | null>(null);
    const lastPlayerIdRef = useRef<string>(gameState.currentPlayerId);
    const [flashActive, setFlashActive] = useState(false);
    const [flashType, setFlashType] = useState<"normal" | "strong">("normal");

    const fireConfetti = (opts: confetti.Options) => {
        confetti({
            ...opts,
            zIndex: 100,
        });
    };

    const triggerFlash = (type: "normal" | "strong") => {
        // Wrap in setTimeout to avoid synchronous state update in effect warning
        // This effectively defers the flash to the next tick
        setTimeout(() => {
            setFlashType(type);
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 150);
        }, 0);
    };

    const handleWinEffects = () => {
        soundManager.play("win");
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    const handleThrowEffects = (t: Throw) => {
        // Visual Flash
        triggerFlash(t.hit.multiplier >= 2 || t.hit.segment === 25 ? "strong" : "normal");

        // Sound Logic
        if (t.hit.segment === 0) {
            soundManager.play("miss");
            return;
        }

        if (t.hit.segment === 25) {
            soundManager.play("bull");
            fireConfetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
            return;
        }

        if (t.hit.multiplier === 3) {
            soundManager.play("triple");
            // Confetti for High Triple (T20, T19, T18, T17)
            if ([20, 19, 18, 17].includes(t.hit.segment)) {
                fireConfetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
            }
            return;
        }

        if (t.hit.multiplier === 2) {
            soundManager.play("double");
            return;
        }

        // Standard hit
        soundManager.play("hit");
    };

    // Detect new throws
    useEffect(() => {
        const currentThrows = gameState.currentTurn.throws;
        if (currentThrows.length === 0) return;

        const latestThrow = currentThrows[currentThrows.length - 1];

        // Ensure we handle a throw only once by comparing references or timestamps
        if (lastThrowRef.current && lastThrowRef.current.timestamp === latestThrow.timestamp) {
            return;
        }

        lastThrowRef.current = latestThrow;
        handleThrowEffects(latestThrow);

        if (latestThrow.isWin) {
            handleWinEffects();
        } else if (latestThrow.isBust) {
            soundManager.play("bust");
        }
    }, [gameState.currentTurn.throws]);

    // Detect turn change
    useEffect(() => {
        if (gameState.currentPlayerId !== lastPlayerIdRef.current) {
            lastPlayerIdRef.current = gameState.currentPlayerId;
            soundManager.play("change-turn");
        }
    }, [gameState.currentPlayerId]);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {flashActive && (
                <div
                    className={`absolute inset-0 transition-opacity duration-150 ease-out ${flashType === "strong" ? "bg-white/20" : "bg-white/5"}`}
                />
            )}
        </div>
    );
}
