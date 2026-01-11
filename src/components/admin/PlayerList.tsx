"use client";

import type { PlayerListProps } from "@/types/components";

import { Shield, User } from "lucide-react";
import { CreatePlayerDialog } from "./CreatePlayerDialog";
import { PlayerRowActions } from "./PlayerRowActions";

const PLAYER_JOINED_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

export function PlayerList({ initialPlayers }: PlayerListProps) {
    const admins = initialPlayers.filter((p) => p.admin);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Jugadores</h2>
                    <p className="text-muted-foreground text-sm">Gestiona los jugadores y consulta sus estadísticas.</p>
                </div>
                <CreatePlayerDialog />
            </div>
            <div className="border shadow-sm overflow-hidden rounded-md bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="h-12 px-4 font-medium text-slate-500">Jugador</th>
                            <th className="h-12 px-4 font-medium text-slate-500">Administrador</th>
                            <th className="h-12 px-4 font-medium text-slate-500">Alta</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialPlayers.map((player) => (
                            <tr key={player.id} className="border-b transition-colors hover:bg-slate-50/50 last:border-0">
                                <td className="p-4 font-medium align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                            {player.avatarUrl ? (
                                                <img src={player.avatarUrl} alt={player.nickname} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-slate-900">{player.nickname}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle">
                                    {player.admin ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                            <Shield className="h-3.5 w-3.5" />
                                            Administrador
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>
                                <td className="p-4 align-middle text-slate-500">{PLAYER_JOINED_DATE_FORMATTER.format(new Date(player.createdAt))}</td>
                                <td className="p-4 text-right align-middle">
                                    <PlayerRowActions player={player} admins={admins} />
                                </td>
                            </tr>
                        ))}
                        {initialPlayers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="rounded-full bg-slate-100 p-3">
                                            <User className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">No se han encontrado jugadores</h3>
                                        <p>Empieza creando un nuevo jugador.</p>
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
