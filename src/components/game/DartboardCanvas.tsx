"use client";

import { BOARD_DIMENSIONS_MM } from "@/lib/game/board-geometry";
import { transformCoordinates } from "@/lib/game/calibration";
import { mapCoordinatesToHit } from "@/lib/game/score-mapper";
import { cn } from "@/lib/utils";
import { CalibrationConfig, Hit } from "@/types/models/darts";
import { useRef, useState } from "react";

interface DartboardCanvasProps {
    onThrow: (hit: Hit, coordinates: { x: number; y: number }) => void;
    disabled?: boolean;
}

export function DartboardCanvas({ onThrow, disabled = false }: DartboardCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lastHit, setLastHit] = useState<{ x: number; y: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Auto-configure calibration based on current responsive size
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Assume the board fits within the smaller dimension with some margin
        const minDim = Math.min(rect.width, rect.height);
        const radiusPx = (minDim / 2) * 0.95; // 95% fill

        // Scale = pixels per mm
        const scale = radiusPx / BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R;

        const config: CalibrationConfig = {
            centerX,
            centerY,
            scale,
            rotation: 0,
        };

        const boardCoords = transformCoordinates(clickX, clickY, config);
        const hit = mapCoordinatesToHit(boardCoords.x, boardCoords.y);

        // Visual feedback (keep marker on screen for a moment)
        setLastHit({ x: clickX, y: clickY });

        // Pass result up
        onThrow(hit, boardCoords);
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full bg-slate-900 rounded-full border-4 border-slate-700 shadow-2xl",
                "flex items-center justify-center overflow-hidden touch-none",
            )}
            onPointerDown={handlePointerDown}
            style={{ aspectRatio: "1/1" }}
        >
            {/* Visual simulation of a board - concentric circles using CSS/SVG could go here */}
            {/* For now just a target background */}
            <div
                className="absolute inset-0 rounded-full border-[1px] border-slate-600 opacity-20 pointer-events-none"
                style={{ margin: "5%" }}
            ></div>
            <div
                className="absolute inset-0 rounded-full border-[1px] border-slate-600 opacity-20 pointer-events-none"
                style={{ margin: "25%" }}
            ></div>
            <div
                className="absolute inset-0 rounded-full border-[1px] border-slate-600 opacity-20 pointer-events-none"
                style={{ margin: "45%" }}
            ></div>

            {/* Center Bullseye approximation */}
            <div className="w-4 h-4 bg-red-600 rounded-full absolute pointer-events-none"></div>

            {/* Hit Marker */}
            {lastHit && (
                <div
                    className={cn(
                        "absolute w-4 h-4 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2",
                        "pointer-events-none shadow-lg border border-white",
                    )}
                    style={{ left: lastHit.x, top: lastHit.y }}
                />
            )}
        </div>
    );
}
