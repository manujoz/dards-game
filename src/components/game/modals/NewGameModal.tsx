"use client";

import type { NewGameModalProps } from "@/types/components/game";

import { createMatch } from "@/app/actions/matches";
import { getPlayers } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CreateMatchInput } from "@/lib/validation/matches";
import { Player } from "@prisma/client";
import { Loader2, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type GameType = "x01" | "cricket" | "round_the_clock" | "killer" | "shanghai" | "high_score" | "halve_it";

const GAME_TYPE_LABELS: Record<GameType, string> = {
    x01: "X01",
    cricket: "Cricket",
    round_the_clock: "Round the Clock",
    killer: "Killer",
    shanghai: "Shanghai",
    high_score: "High Score",
    halve_it: "Halve It",
};

export function NewGameModal({ open, onOpenChange }: NewGameModalProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [gameType, setGameType] = useState<GameType>("x01");
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Game specific configs
    const [x01StartScore, setX01StartScore] = useState<301 | 501 | 701 | 901>(501);
    const [x01OutMode, setX01OutMode] = useState<"straight" | "double" | "master">("double");
    const [cricketMode, setCricketMode] = useState<"standard" | "cut_throat">("standard");

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoadingPlayers(true);
            getPlayers()
                .then((res) => {
                    if (res.success && res.data) {
                        setPlayers(res.data);
                    }
                })
                .finally(() => setIsLoadingPlayers(false));
        }
    }, [open]);

    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds((prev) => (prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]));
    };

    const handleStartGame = () => {
        if (selectedPlayerIds.length === 0) return;

        startTransition(async () => {
            let config: CreateMatchInput["config"];
            const baseConfig = { teamMode: "single" as const };

            if (gameType === "x01") {
                config = {
                    ...baseConfig,
                    type: "x01",
                    startScore: x01StartScore,
                    inMode: "straight",
                    outMode: x01OutMode,
                };
            } else if (gameType === "cricket") {
                config = {
                    ...baseConfig,
                    type: "cricket",
                    mode: cricketMode,
                    numbers: [20, 19, 18, 17, 16, 15, 25],
                };
            } else if (gameType === "round_the_clock") {
                config = {
                    ...baseConfig,
                    type: "round_the_clock",
                    mode: "singles",
                    startNumber: 1,
                    endNumber: 25,
                };
            } else if (gameType === "killer") {
                config = { ...baseConfig, type: "killer", lives: 5, killMode: "double_to_kill" };
            } else if (gameType === "shanghai") {
                config = { ...baseConfig, type: "shanghai", startNumber: 1 };
            } else if (gameType === "high_score") {
                config = { ...baseConfig, type: "high_score", targetScore: 1000 };
            } else if (gameType === "halve_it") {
                config = {
                    ...baseConfig,
                    type: "halve_it",
                    targets: ["20", "16", "D7", "14", "18", "T10", "25"],
                };
            } else {
                return; // Should not happen
            }

            const result = await createMatch({
                gameId: gameType,
                config: config,
                playerIds: selectedPlayerIds,
            });

            if (result.success && result.data) {
                onOpenChange(false);
                // Redirect to the new game with matchId
                router.push(`/game?matchId=${result.data.id}`);
            } else {
                console.error("No se ha podido iniciar la partida", result.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Nueva partida</DialogTitle>
                    <DialogDescription>Configura el juego y selecciona los jugadores.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Game Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Modo de juego
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(["x01", "cricket", "round_the_clock", "high_score", "shanghai", "halve_it", "killer"] as GameType[]).map((type) => (
                                <div
                                    key={type}
                                    onClick={() => setGameType(type)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
                                        "transition-all hover:bg-accent",
                                        gameType === type ? "border-primary bg-accent/50" : "border-transparent bg-secondary",
                                    )}
                                >
                                    <span className="font-bold uppercase">{GAME_TYPE_LABELS[type]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game Options */}
                    {gameType === "x01" && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Puntuación inicial</label>
                                <div className="flex gap-2">
                                    {[301, 501, 701, 901].map((score) => (
                                        <Button
                                            key={score}
                                            variant={x01StartScore === score ? "default" : "outline"}
                                            onClick={() => setX01StartScore(score as 301 | 501 | 701 | 901)}
                                            className="flex-1"
                                        >
                                            {score}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Modo de salida</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={x01OutMode === "straight" ? "default" : "outline"}
                                        onClick={() => setX01OutMode("straight")}
                                    >
                                        Directo
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={x01OutMode === "double" ? "default" : "outline"}
                                        onClick={() => setX01OutMode("double")}
                                    >
                                        Doble
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={x01OutMode === "master" ? "default" : "outline"}
                                        onClick={() => setX01OutMode("master")}
                                    >
                                        Maestro
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    En Doble/Maestro-Out, si llegas a 0 sin el multiplicador requerido, el turno es nulo y vuelves a la puntuación
                                    inicial del turno.
                                </p>
                            </div>
                        </div>
                    )}

                    {gameType === "cricket" && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Modo</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={cricketMode === "standard" ? "default" : "outline"}
                                    onClick={() => setCricketMode("standard")}
                                    className="flex-1"
                                >
                                    Estándar
                                </Button>
                                <Button
                                    variant={cricketMode === "cut_throat" ? "default" : "outline"}
                                    onClick={() => setCricketMode("cut_throat")}
                                    className="flex-1"
                                >
                                    Contra todos
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Player Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Jugadores ({selectedPlayerIds.length})</label>
                            <Button variant="ghost" size="sm" onClick={() => router.push("/players")}>
                                <UserPlus className="w-4 h-4 mr-2" /> Gestionar
                            </Button>
                        </div>

                        {isLoadingPlayers ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {players.map((player) => (
                                    <div
                                        key={player.id}
                                        onClick={() => handlePlayerToggle(player.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-md border cursor-pointer select-none transition-colors",
                                            selectedPlayerIds.includes(player.id) ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                            {player.avatarUrl ? (
                                                <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="truncate font-medium">{player.nickname}</span>
                                    </div>
                                ))}
                                {players.length === 0 && (
                                    <div className="col-span-full py-4 text-center text-muted-foreground text-sm">
                                        No se han encontrado jugadores. Añade jugadores en el panel de administración.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleStartGame} disabled={isPending || selectedPlayerIds.length === 0}>
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Empezar partida
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
