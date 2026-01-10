"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface HiddenMenuTriggerProps {
    onTrigger: () => void;
    className?: string;
}

export function HiddenMenuTrigger({ onTrigger, className }: HiddenMenuTriggerProps) {
    const tapsRef = useRef<number[]>([]);

    const handleTap = () => {
        const now = Date.now();
        const taps = tapsRef.current;

        if (taps.length === 0 || now - taps[0] > 900) {
            tapsRef.current = [now];
            return;
        }

        tapsRef.current.push(now);

        if (tapsRef.current.length === 3) {
            onTrigger();
            tapsRef.current = [];
        }
    };

    useEffect(() => {
        // Cleanup if needed
    }, []);
    return (
        <div
            className={cn("fixed top-0 left-0 w-full h-16 z-[100] cursor-pointer bg-transparent", className)}
            onClick={handleTap}
            data-testid="hidden-menu-trigger"
            aria-hidden="true"
        />
    );
}
