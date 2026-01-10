"use client";

import type { StartGameButtonProps } from "@/types/components/home";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function StartGameButton({ href = "/game", label }: StartGameButtonProps) {
    const router = useRouter();

    function handleStart() {
        router.push(href);
    }

    return <Button onClick={handleStart}>{label}</Button>;
}
