import { getMatches, type MatchListEntry } from "@/app/actions/matches";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy } from "lucide-react";

import type { GameId } from "@/types/models/darts";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
    const result = await getMatches();
    const matches = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partidas</h1>
                    <p className="text-slate-500">Historial de partidas jugadas.</p>
                </div>
            </div>

            <div className="rounded-md border bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="h-12 px-4 font-medium">Fecha</th>
                                <th className="h-12 px-4 font-medium">Juego</th>
                                <th className="h-12 px-4 font-medium">Participantes</th>
                                <th className="h-12 px-4 font-medium">Ganador</th>
                                <th className="h-12 px-4 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matches?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center text-slate-500">
                                        No se han encontrado partidas.
                                    </td>
                                </tr>
                            ) : (
                                matches?.map((match) => <MatchRow key={match.id} match={match} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const GAME_LABELS: Record<GameId, string> = {
    x01: "X01",
    cricket: "Cricket",
    round_the_clock: "Alrededor del reloj",
    high_score: "Puntuación máxima",
    shanghai: "Shanghai",
    killer: "Asesino",
    halve_it: "A la mitad",
};

function getGameLabel(gameId: string): string {
    return GAME_LABELS[gameId as GameId] ?? gameId.replace(/_/g, " ");
}

function MatchRow({ match }: { match: MatchListEntry }) {
    // Helper to resolve winner
    const getWinnerName = (match: MatchListEntry) => {
        if (!match.winnerId) return "-";

        const winningTeam = match.teams.find((t) => t.id === match.winnerId);
        if (winningTeam) return winningTeam.name || "Equipo";

        // Check both for robustness
        const winningParticipant = match.participants.find((p) => p.id === match.winnerId || p.playerId === match.winnerId);
        // Note: winnerId usually stores participantId or teamId, but let's be safe.
        // Actually looking at schemas, typically winnerId matches a participant ID for single player or Team ID.

        if (winningParticipant) return winningParticipant.player.nickname;

        return "Desconocido";
    };

    const winnerName = getWinnerName(match);
    const playerCount = match.participants.length;

    return (
        <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 text-slate-700">{format(new Date(match.startedAt), "d MMM yyyy HH:mm", { locale: es })}</td>
            <td className="px-4 py-3 font-medium text-slate-900">
                <span className="capitalize">{getGameLabel(match.gameId)}</span>
            </td>
            <td className="px-4 py-3 text-slate-600">{playerCount} Jugadores</td>
            <td className="px-4 py-3">
                {match.winnerId ? (
                    <div className="flex items-center gap-2 font-medium text-green-600">
                        <Trophy className="h-4 w-4" />
                        {winnerName}
                    </div>
                ) : (
                    <span className="text-slate-400">-</span>
                )}
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={match.status} />
            </td>
        </tr>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: "bg-green-100 text-green-700",
        playing: "bg-blue-100 text-blue-700",
        aborted: "bg-red-100 text-red-700",
        setup: "bg-slate-100 text-slate-700",
    };

    const labels: Record<string, string> = {
        completed: "Completada",
        playing: "En juego",
        aborted: "Abortada",
        setup: "Configuración",
    };

    const normalized = status.toLowerCase();

    const style = styles[normalized] || "bg-slate-100 text-slate-700";
    const label = labels[normalized] ?? status;

    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}
