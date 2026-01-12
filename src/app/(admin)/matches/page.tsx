import { getMatches, type MatchListEntry } from "@/app/actions/matches";
import { AbortedMatchRowActions } from "@/components/admin/AbortedMatchRowActions";
import { MatchRowActions } from "@/components/admin/MatchRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy } from "lucide-react";
import Link from "next/link";

import type { GameId } from "@/types/models/darts";

export const dynamic = "force-dynamic";

type MatchesPageSearchParams = {
    view?: string;
    returnTo?: string;
};

interface PageProps {
    searchParams: Promise<MatchesPageSearchParams>;
}

function getView(searchParams: MatchesPageSearchParams): "completed" | "ongoing" | "setup" | "aborted" {
    const view = searchParams?.view;
    if (view === "ongoing" || view === "setup" || view === "completed" || view === "aborted") return view;
    return "completed";
}

export default async function MatchesPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const view = getView(resolvedSearchParams);

    const MATCHES_TABLE_LIMIT = 50;

    function getTabHref(nextView: "completed" | "ongoing" | "setup" | "aborted"): string {
        const params = new URLSearchParams();

        if (resolvedSearchParams.returnTo) {
            params.set("returnTo", resolvedSearchParams.returnTo);
        }

        if (nextView !== "completed") {
            params.set("view", nextView);
        }

        const query = params.toString();
        return query ? `/matches?${query}` : "/matches";
    }

    function getDetailsHref(matchId: string): string {
        const params = new URLSearchParams();

        if (resolvedSearchParams.returnTo) {
            params.set("returnTo", resolvedSearchParams.returnTo);
        }

        if (view !== "completed") {
            params.set("view", view);
        }

        const query = params.toString();
        return query ? `/matches/${matchId}?${query}` : `/matches/${matchId}`;
    }

    const isCompletedView = view === "completed";

    const result = await getMatches({
        limit: MATCHES_TABLE_LIMIT,
        status: isCompletedView ? "completed" : view,
        includeOngoingWithWin: isCompletedView,
    });
    const matches = result.success ? result.data : [];

    const tabs: Array<{ view: "completed" | "ongoing" | "setup" | "aborted"; label: string }> = [
        { view: "completed", label: "Completadas" },
        { view: "ongoing", label: "En juego" },
        { view: "setup", label: "Preparadas" },
        { view: "aborted", label: "Abortadas" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partidas</h1>
                    <p className="text-slate-500">Historial de partidas jugadas.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const isActive = tab.view === view;
                    const href = getTabHref(tab.view);
                    return (
                        <Link
                            key={tab.view}
                            href={href}
                            className={
                                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
                                (isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                            }
                        >
                            {tab.label}
                        </Link>
                    );
                })}
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
                                <th className="h-12 px-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matches?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center text-slate-500">
                                        No se han encontrado partidas.
                                    </td>
                                </tr>
                            ) : (
                                matches?.map((match) => <MatchRow key={match.id} match={match} view={view} detailsHref={getDetailsHref(match.id)} />)
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

function MatchRow({ match, view, detailsHref }: { match: MatchListEntry; view: "completed" | "ongoing" | "setup" | "aborted"; detailsHref: string }) {
    const derivedWinnerId = match.winnerId ?? match.winningThrows?.[0]?.participant?.playerId;
    const derivedStatus = match.status === "ongoing" && derivedWinnerId ? "completed" : match.status;

    const winnerParticipant = derivedWinnerId
        ? match.participants.find((p) => p.id === derivedWinnerId || p.playerId === derivedWinnerId)
        : undefined;
    const winnerAvatarUrl = winnerParticipant?.player.avatarUrl ?? undefined;

    // Helper to resolve winner
    const getWinnerName = (match: MatchListEntry, winnerId: string | undefined) => {
        if (!winnerId) return "-";

        const winningTeam = match.teams.find((t) => t.id === winnerId);
        if (winningTeam) return winningTeam.name || "Equipo";

        // Check both for robustness
        const winningParticipant = match.participants.find((p) => p.id === winnerId || p.playerId === winnerId);
        // Note: winnerId usually stores participantId or teamId, but let's be safe.
        // Actually looking at schemas, typically winnerId matches a participant ID for single player or Team ID.

        if (winningParticipant) return winningParticipant.player.nickname;

        return "Desconocido";
    };

    const winnerName = getWinnerName(match, derivedWinnerId);
    const playerCount = match.participants.length;

    return (
        <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 text-slate-700">{format(new Date(match.startedAt), "d MMM yyyy HH:mm", { locale: es })}</td>
            <td className="px-4 py-3 font-medium text-slate-900">
                <span className="capitalize">{getGameLabel(match.gameId)}</span>
            </td>
            <td className="px-4 py-3 text-slate-600">{playerCount} Jugadores</td>
            <td className="px-4 py-3">
                {derivedWinnerId ? (
                    <div className="flex items-center gap-2 font-medium text-green-600">
                        <Trophy className="h-4 w-4" />
                        <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-green-600/20 bg-white/70">
                            {winnerAvatarUrl ? (
                                <img src={winnerAvatarUrl} alt={`Avatar de ${winnerName}`} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-extrabold text-green-700">
                                    {(winnerName.trim().charAt(0) || "?").toUpperCase()}
                                </span>
                            )}
                        </div>
                        {winnerName}
                    </div>
                ) : (
                    <span className="text-slate-400">-</span>
                )}
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={derivedStatus} />
            </td>
            <td className="px-4 py-3 text-right">
                {view === "ongoing" || view === "setup" ? (
                    <MatchRowActions matchId={match.id} status={match.status} detailsHref={detailsHref} />
                ) : view === "aborted" ? (
                    <AbortedMatchRowActions matchId={match.id} detailsHref={detailsHref} />
                ) : (
                    <Link
                        href={detailsHref}
                        className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                        Ver detalles
                    </Link>
                )}
            </td>
        </tr>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: "bg-green-100 text-green-700",
        ongoing: "bg-blue-100 text-blue-700",
        playing: "bg-blue-100 text-blue-700",
        aborted: "bg-red-100 text-red-700",
        setup: "bg-amber-100 text-amber-800",
    };

    const labels: Record<string, string> = {
        completed: "Completada",
        ongoing: "En juego",
        playing: "En juego",
        aborted: "Abortada",
        setup: "Preparación",
    };

    const normalized = status.toLowerCase();

    const style = styles[normalized] || "bg-slate-100 text-slate-700";
    const label = labels[normalized] ?? status;

    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}
