"use client";

import type { DartboardCanvasMarker, DartboardCanvasProps } from "@/types/components/game";
import type { CalibrationConfig } from "@/types/models/darts";

import { useEffect, useMemo, useRef, useState } from "react";

import { BOARD_DIMENSIONS_MM, SEGMENT_ORDER } from "@/lib/game/board-geometry";
import { transformCoordinates } from "@/lib/game/calibration";
import { mapCoordinatesToHit } from "@/lib/game/score-mapper";
import { cn } from "@/lib/utils";

export function DartboardCanvas({ onThrow, disabled = false }: DartboardCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hitMarkers, setHitMarkers] = useState<DartboardCanvasMarker[]>([]);

    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const colors = useMemo(
        () => ({
            background: "#0b1220",
            wire: "rgba(255, 255, 255, 0.12)",
            wireStrong: "rgba(255, 255, 255, 0.22)",
            black: "#0b0f14",
            cream: "#f1e0bf",
            red: "#c81d25",
            green: "#2f9e44",
            text: "rgba(255, 255, 255, 0.92)",
        }),
        [],
    );

    useEffect(() => {
        if (!containerRef.current) return;

        const el = containerRef.current;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    function toCanvasRad(degFromTopClockwise: number): number {
        return ((degFromTopClockwise - 90) * Math.PI) / 180;
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    function drawWedge(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        rInner: number,
        rOuter: number,
        startDeg: number,
        endDeg: number,
        fill: string,
        stroke?: string,
    ) {
        const startRad = toCanvasRad(startDeg);
        const endRad = toCanvasRad(endDeg);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rOuter, startRad, endRad, false);
        ctx.arc(cx, cy, rInner, endRad, startRad, true);
        ctx.closePath();

        ctx.fillStyle = fill;
        ctx.fill();

        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function drawCircle(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        r: number,
        fill: CanvasFillStrokeStyles["fillStyle"],
        stroke?: string,
    ) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();

        ctx.fillStyle = fill;
        ctx.fill();

        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function drawRingGuide(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawAnnulus(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        rInner: number,
        rOuter: number,
        fill: CanvasFillStrokeStyles["fillStyle"],
    ) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill("evenodd");
        ctx.restore();
    }

    function drawBoard(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        const minDim = Math.min(width, height);
        const outerRadiusPx = (minDim / 2) * 0.95;
        const scoringRadiusPx = outerRadiusPx * 0.84;
        const numberBandWidthPx = outerRadiusPx - scoringRadiusPx;

        // Background disc + outer bezel
        const bezelGradient = ctx.createRadialGradient(cx, cy, scoringRadiusPx * 0.2, cx, cy, outerRadiusPx);
        bezelGradient.addColorStop(0, "rgba(255,255,255,0.03)");
        bezelGradient.addColorStop(1, "rgba(255,255,255,0.06)");
        drawCircle(ctx, cx, cy, outerRadiusPx, bezelGradient);
        drawCircle(ctx, cx, cy, outerRadiusPx, "rgba(0,0,0,0)", colors.wireStrong);

        // Number ring background (outside the scoring surface)
        drawAnnulus(ctx, cx, cy, scoringRadiusPx, outerRadiusPx, "rgba(4, 10, 20, 0.65)");
        drawRingGuide(ctx, cx, cy, scoringRadiusPx, colors.wireStrong);

        // Convert WDF radii (mm) to px (scoring surface ends at DOUBLE_OUTER_R)
        const mmToPx = scoringRadiusPx / BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R;
        const rInnerBull = BOARD_DIMENSIONS_MM.INNER_BULL_R * mmToPx;
        const rOuterBull = BOARD_DIMENSIONS_MM.OUTER_BULL_R * mmToPx;
        const rTripleInner = BOARD_DIMENSIONS_MM.TRIPLE_INNER_R * mmToPx;
        const rTripleOuter = BOARD_DIMENSIONS_MM.TRIPLE_OUTER_R * mmToPx;
        const rDoubleInner = BOARD_DIMENSIONS_MM.DOUBLE_INNER_R * mmToPx;
        const rDoubleOuter = BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R * mmToPx;

        // Segment painting (20 wedges, 18° each, centered on 0°, 18°, ...)
        for (let i = 0; i < 20; i += 1) {
            const startDeg = i * 18 - 9;
            const endDeg = i * 18 + 9;

            // Standard dartboard: 20 (top) is BLACK, alternates
            const isBlack = i % 2 === 0;
            const singleFill = isBlack ? colors.black : colors.cream;
            const bandFill = isBlack ? colors.red : colors.green;

            // Inner single (outer bull -> triple inner)
            drawWedge(ctx, cx, cy, rOuterBull, rTripleInner, startDeg, endDeg, singleFill);
            // Triple ring
            drawWedge(ctx, cx, cy, rTripleInner, rTripleOuter, startDeg, endDeg, bandFill);
            // Outer single (triple outer -> double inner)
            drawWedge(ctx, cx, cy, rTripleOuter, rDoubleInner, startDeg, endDeg, singleFill);
            // Double ring
            drawWedge(ctx, cx, cy, rDoubleInner, rDoubleOuter, startDeg, endDeg, bandFill);
        }

        // Wires / separators
        drawRingGuide(ctx, cx, cy, rOuterBull, colors.wireStrong);
        drawRingGuide(ctx, cx, cy, rTripleInner, colors.wire);
        drawRingGuide(ctx, cx, cy, rTripleOuter, colors.wireStrong);
        drawRingGuide(ctx, cx, cy, rDoubleInner, colors.wire);
        drawRingGuide(ctx, cx, cy, rDoubleOuter, colors.wireStrong);

        // Radial separators
        for (let i = 0; i < 20; i += 1) {
            const deg = i * 18 - 9;
            const rad = toCanvasRad(deg);
            const x = cx + Math.cos(rad) * rDoubleOuter;
            const y = cy + Math.sin(rad) * rDoubleOuter;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = colors.wire;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Bulls
        drawCircle(ctx, cx, cy, rOuterBull, colors.green, colors.wireStrong);
        drawCircle(ctx, cx, cy, rInnerBull, colors.red, colors.wireStrong);

        // Numbers band (ensure they fit in the ring area)
        const numberRadius = scoringRadiusPx + numberBandWidthPx * 0.62;
        const fontSize = clamp(Math.round(numberBandWidthPx * 0.72), 12, 28);

        ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Same segment order as score-mapper (index 0 => 20 at top)
        for (let i = 0; i < 20; i += 1) {
            const label = String(SEGMENT_ORDER[i]);
            const centerDeg = i * 18;
            const rad = toCanvasRad(centerDeg);
            const x = cx + Math.cos(rad) * numberRadius;
            const y = cy + Math.sin(rad) * numberRadius;

            // Outline for readability
            ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.16));
            ctx.strokeStyle = "rgba(0, 0, 0, 0.70)";
            ctx.strokeText(label, x, y);

            ctx.fillStyle = colors.text;
            ctx.fillText(label, x, y);
        }
    }

    useEffect(() => {
        if (!canvasRef.current) return;
        if (size.width <= 0 || size.height <= 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.max(1, Math.floor(size.width * dpr));
        canvas.height = Math.max(1, Math.floor(size.height * dpr));
        canvas.style.width = `${size.width}px`;
        canvas.style.height = `${size.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawBoard(ctx, size.width, size.height);
    }, [colors, size.height, size.width]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !containerRef.current) return;
        // Avoid bubbling to any parent "full screen" handlers.
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Auto-configure calibration based on current responsive size
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Assume the board fits within the smaller dimension with some margin
        const minDim = Math.min(rect.width, rect.height);
        const outerRadiusPx = (minDim / 2) * 0.95;
        const scoringRadiusPx = outerRadiusPx * 0.84;

        // Scale = pixels per mm
        const scale = scoringRadiusPx / BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R;

        const config: CalibrationConfig = {
            centerX,
            centerY,
            scale,
            rotation: 0,
        };

        const boardCoords = transformCoordinates(clickX, clickY, config);
        const hit = mapCoordinatesToHit(boardCoords.x, boardCoords.y);

        const accepted = onThrow(hit, boardCoords);
        if (!accepted) return;

        // Solo pintamos marcador si el impacto está dentro de la diana (no MISS).
        if (hit.multiplier !== 0) {
            setHitMarkers((prev) => {
                const next = [...prev, { x: clickX, y: clickY }];
                return next.length > 3 ? next.slice(next.length - 3) : next;
            });
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full rounded-full border-4 border-slate-700 shadow-2xl",
                "flex items-center justify-center overflow-hidden touch-none",
            )}
            onPointerDown={handlePointerDown}
            style={{ aspectRatio: "1/1" }}
        >
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Hit Marker */}
            {hitMarkers.map((m, index) => (
                <div
                    key={index}
                    className={cn(
                        "absolute w-4 h-4 bg-emerald-400 rounded-full transform -translate-x-1/2 -translate-y-1/2",
                        "pointer-events-none shadow-lg border border-white",
                    )}
                    style={{ left: m.x, top: m.y }}
                />
            ))}
        </div>
    );
}
