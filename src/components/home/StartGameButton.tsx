"use client";

import type { StartGameButtonProps } from "@/types/components/home";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function StartGameButton({ href = "/game", label, className }: StartGameButtonProps) {
    const router = useRouter();

    function handleStart() {
        router.push(href);
    }

    return (
        <Button onClick={handleStart} size="lg" className={cn("text-lg font-bold px-8 py-6 h-auto", className)}>
            {label}
        </Button>
    );
}
