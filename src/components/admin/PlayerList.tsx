"use client";

import { Button } from "@/components/ui/button";
import { Player } from "@prisma/client";
import { MoreHorizontal, User } from "lucide-react";
import { CreatePlayerDialog } from "./CreatePlayerDialog";

const PLAYER_JOINED_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

interface PlayerListProps {
    initialPlayers: Player[];
}

export function PlayerList({ initialPlayers }: PlayerListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Players</h2>
                    <p className="text-muted-foreground text-sm">Manage usage players and view their statistics.</p>
                </div>
                <CreatePlayerDialog />
            </div>
            <div className="border shadow-sm overflow-hidden rounded-md bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="h-12 px-4 font-medium text-slate-500">Player</th>
                            <th className="h-12 px-4 font-medium text-slate-500">Joined</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialPlayers.map((player) => (
                            <tr key={player.id} className="border-b transition-colors hover:bg-slate-50/50 last:border-0">
                                <td className="p-4 font-medium align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                            {player.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={player.avatarUrl} alt={player.nickname} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-slate-900">{player.nickname}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle text-slate-500">{PLAYER_JOINED_DATE_FORMATTER.format(new Date(player.createdAt))}</td>
                                <td className="p-4 text-right align-middle">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {initialPlayers.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="rounded-full bg-slate-100 p-3">
                                            <User className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">No players found</h3>
                                        <p>Get started by creating a new player.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
