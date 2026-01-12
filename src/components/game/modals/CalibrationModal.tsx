"use client";

import type { CalibrationModalProps } from "@/types/components/game";

import { updateCalibration } from "@/app/actions/device-config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getOrCreateDeviceId } from "@/lib/device/device-id";
import { BOARD_DIMENSIONS_MM } from "@/lib/game/board-geometry";
import { computeCalibrationFromPoints } from "@/lib/game/calibration";
import { Loader2, Target } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type CalibrationStep = "intro" | "center" | "perimeter" | "saving" | "complete";

export function CalibrationModal({ open, onOpenChange, getBoardRect }: CalibrationModalProps) {
    const [step, setStep] = useState<CalibrationStep>("intro");
    const [centerPoint, setCenterPoint] = useState<{ x: number; y: number } | null>(null);
    const [, startTransition] = useTransition();

    const reset = () => {
        setStep("intro");
        setCenterPoint(null);
    };

    useEffect(() => {
        if (!open && step !== "intro") {
            // Reset state when closed
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStep("intro");
            setCenterPoint(null);
        }
    }, [open, step]);

    const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = getBoardRect();
        if (!rect) {
            console.error("No se ha podido calibrar: no se encuentra el área de la diana");
            reset();
            return;
        }

        const localPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        if (step === "center") {
            setCenterPoint(localPoint);
            setStep("perimeter");
        } else if (step === "perimeter") {
            saveCalibration(rect, centerPoint!, localPoint);
        }
    };

    const saveCalibration = (rect: DOMRect, center: { x: number; y: number }, perimeter: { x: number; y: number }) => {
        setStep("saving");

        const refDistanceMm = (BOARD_DIMENSIONS_MM.DOUBLE_INNER_R + BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R) / 2;
        const partial = computeCalibrationFromPoints(center, perimeter, refDistanceMm);
        const deviceId = getOrCreateDeviceId();

        startTransition(async () => {
            const res = await updateCalibration(deviceId, {
                centerX: partial.centerX ?? center.x,
                centerY: partial.centerY ?? center.y,
                scale: partial.scale ?? 1,
                rotation: partial.rotation ?? 0,
                aspectRatio: rect.width / rect.height,
            });

            if (res.success) {
                setStep("complete");
                setTimeout(() => onOpenChange(false), 1500);
            } else {
                console.error("No se ha podido guardar la calibración", res.message);
                setStep("intro"); // Retry
            }
        });
    };

    if (step === "center" || step === "perimeter") {
        return (
            <div
                className="fixed inset-0 z-[200] bg-black/80 cursor-crosshair flex flex-col items-center justify-center text-white"
                onClick={handleScreenClick}
            >
                <Target className="w-16 h-16 animate-pulse mb-8 text-red-500" />
                <h2 className="text-3xl font-bold mb-4">{step === "center" ? "TOCA EL CENTRO" : "TOCA EL DOBLE 20 (ARRIBA)"}</h2>
                <p className="text-xl opacity-80">Toca exactamente el {step === "center" ? "centro" : "doble superior"} de la diana</p>
                <Button
                    variant="outline"
                    className="mt-12 text-black"
                    onClick={(e) => {
                        e.stopPropagation();
                        reset();
                    }}
                >
                    Cancelar
                </Button>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Calibración de pantalla</DialogTitle>
                    <DialogDescription>Calibra el toque para que coincida con la proyección física de la diana.</DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center text-center">
                    {step === "saving" && <Loader2 className="w-10 h-10 animate-spin text-primary" />}
                    {step === "complete" && <div className="text-green-500 font-bold text-xl">¡Calibración guardada!</div>}
                    {step === "intro" && (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                Este asistente te pedirá que toques puntos específicos en la diana para alinear el toque.
                            </p>
                            <ul className="text-left text-sm space-y-2 list-disc pl-5">
                                <li>Asegúrate de estar en modo pantalla completa.</li>
                                <li>Colócate justo delante de la pantalla.</li>
                                <li>
                                    Tendrás que tocar el <strong>centro</strong> y el <strong>doble 20</strong>.
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === "intro" ? (
                        <div className="flex w-full justify-between">
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>
                            <Button onClick={() => setStep("center")}>Iniciar calibración</Button>
                        </div>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
