"use client";

import type { HiddenTopBarProps } from "@/types/components/game";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gamepad2, Maximize, Minimize, Play, RotateCcw, Settings, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiddenMenuTrigger } from "./HiddenMenuTrigger";
import { CalibrationModal } from "./modals/CalibrationModal";
import { NewGameModal } from "./modals/NewGameModal";

const LAST_GAME_URL_STORAGE_KEY = "dards:lastGameUrl";

export function HiddenTopBar({ defaultShowNewGame = false, canRestartSameConfig = false, onRestartSameConfig, getBoardRect }: HiddenTopBarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Modals
    const [showNewGame, setShowNewGame] = useState(defaultShowNewGame);
    const [showCalibration, setShowCalibration] = useState(false);

    const router = useRouter();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            // Do not hide if a modal is open
            if (!showNewGame && !showCalibration) {
                setIsVisible(false);
            }
        }, 6000); // 6 seconds
    }, [showNewGame, showCalibration]);

    // Auto-hide logic
    useEffect(() => {
        if (isVisible) {
            resetTimer();
            window.addEventListener("pointerdown", resetTimer);
            return () => {
                window.removeEventListener("pointerdown", resetTimer);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }
    }, [isVisible, resetTimer]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error("No se ha podido activar pantalla completa:", e);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Listen to fullscreen changes to update state icon
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    function handleOpenAdmin() {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        try {
            window.sessionStorage.setItem(LAST_GAME_URL_STORAGE_KEY, returnTo);
        } catch {
            // ignore storage failures
        }

        router.push(`/admin?returnTo=${encodeURIComponent(returnTo)}`);
    }

    return (
        <>
            <HiddenMenuTrigger onTrigger={() => setIsVisible(true)} className={isVisible ? "hidden" : "block"} />

            {/* Top Bar Container */}
            <div
                className={cn(
                    "fixed top-0 left-0 w-full z-[110] transition-transform duration-300 ease-in-out bg-background/95 backdrop-blur",
                    "border-b shadow-md p-2 flex items-center justify-between gap-2 overflow-x-auto",
                    isVisible ? "translate-y-0" : "-translate-y-full",
                )}
                onPointerDown={resetTimer} // Keep alive interaction
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewGame(true)}>
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Nueva partida
                    </Button>

                    {canRestartSameConfig && onRestartSameConfig && (
                        <Button variant="outline" size="sm" onClick={onRestartSameConfig}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reiniciar
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" title="Reanudar" onClick={() => setIsVisible(false)}>
                        <Play className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" title="Deshacer último tiro">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="Calibración" onClick={() => setShowCalibration(true)}>
                        <Target className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" title="Alternar pantalla completa" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>

                    <Button variant="ghost" size="icon" title="Panel de administración" onClick={handleOpenAdmin}>
                        <Settings className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" title="Cerrar menú" onClick={() => setIsVisible(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <NewGameModal open={showNewGame} onOpenChange={setShowNewGame} />
            <CalibrationModal open={showCalibration} onOpenChange={setShowCalibration} getBoardRect={getBoardRect ?? (() => null)} />
        </>
    );
}
