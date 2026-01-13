import { getMatch } from "@/app/actions/matches";
import { MatchDetailsActions } from "@/components/admin/MatchDetailsActions";
import { MatchDetailsHeader } from "@/components/admin/MatchDetailsHeader";
import { MatchDetailsScoreboard } from "@/components/admin/MatchDetailsScoreboard";
import { MatchDetailsThrows } from "@/components/admin/MatchDetailsThrows";
import { getGameName } from "@/lib/constants/game-names";
import { getGameLogic } from "@/lib/game/games";
import { getMatchStateFromDetails } from "@/lib/game/match-state-from-details";
import { getDisplayRoundIndex, groupThrowsByRound, isZeroBasedRoundIndex } from "@/lib/matches/match-details";
import { deriveMatchStatus, deriveWinnerId } from "@/lib/matches/match-status";

import type { MatchDetailsThrowItem, MatchDetailsThrowsRound } from "@/types/components";
import type { GameState, Scoreboard } from "@/types/models/darts";

export const dynamic = "force-dynamic";

type MatchDetailsPageSearchParams = {
    view?: string;
    returnTo?: string;
};

interface PageProps {
    params: Promise<{ matchId: string }>;
    searchParams: Promise<MatchDetailsPageSearchParams>;
}

function getGameLabel(gameId: string): string {
    return getGameName(gameId);
}

function getBackHref(searchParams: MatchDetailsPageSearchParams): string {
    const params = new URLSearchParams();

    if (searchParams.returnTo) {
        params.set("returnTo", searchParams.returnTo);
    }

    if (searchParams.view && searchParams.view !== "completed") {
        params.set("view", searchParams.view);
    }

    const query = params.toString();
    return query ? `/matches?${query}` : "/matches";
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        completed: "Completada",
        ongoing: "En juego",
        aborted: "Abortada",
        setup: "Preparación",
    };

    return labels[status] ?? status;
}

export default async function MatchDetailsPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const matchId = resolvedParams.matchId;
    const backHref = getBackHref(resolvedSearchParams);

    const matchResult = await getMatch(matchId);

    if (!matchResult.success || !matchResult.data) {
        return (
            <div className="space-y-6">
                <MatchDetailsHeader
                    matchId={matchId}
                    gameLabel="Partida"
                    statusLabel="No disponible"
                    status="unknown"
                    startedAt={new Date()}
                    endedAt={null}
                    lastActivityAt={null}
                    players={[]}
                    winnerName={undefined}
                    winnerAvatarUrl={null}
                    backHref={backHref}
                />

                <div className="rounded-md border bg-white p-6 shadow">
                    <p className="text-sm text-slate-600">No se ha podido cargar la partida.</p>
                    <p className="mt-1 text-xs text-slate-500">{matchResult.message ?? "Error desconocido"}</p>
                </div>
            </div>
        );
    }

    const match = matchResult.data;

    const gameLabel = getGameLabel(match.gameId);

    const lastWinningThrow = [...match.throws].filter((t) => t.isWin).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const winningThrowPlayerId = lastWinningThrow
        ? (match.participants.find((p) => p.id === lastWinningThrow.participantId)?.playerId ?? null)
        : null;

    const derivedWinnerId = deriveWinnerId(match.winnerId, winningThrowPlayerId);
    const winnerParticipant = derivedWinnerId ? match.participants.find((p) => p.playerId === derivedWinnerId) : undefined;

    const hasWinner = Boolean(derivedWinnerId);
    const derivedStatus = deriveMatchStatus(match.status, hasWinner);

    const hasAvailableActions = derivedStatus === "ongoing" || derivedStatus === "setup" || derivedStatus === "aborted";

    const headerPlayers = match.participants.map((p) => ({
        id: p.player.id,
        nickname: p.player.nickname,
        avatarUrl: p.player.avatarUrl ?? null,
    }));

    const statusLabel = getStatusLabel(derivedStatus);

    const state = getMatchStateFromDetails(match);
    const scoreboard: Scoreboard | null = state ? getScoreboardSafe(state) : null;

    const baseThrows = match.throws.map((t) => ({
        id: t.id,
        matchId: t.matchId,
        participantId: t.participantId,
        roundIndex: t.roundIndex,
        throwIndex: t.throwIndex,
        segment: t.segment,
        multiplier: t.multiplier,
        points: t.points,
        isBust: t.isBust,
        isWin: t.isWin,
        isValid: t.isValid,
        timestamp: t.timestamp,
    }));

    const isZeroBasedRounds = isZeroBasedRoundIndex(baseThrows);

    const participantIdToPlayer = new Map(match.participants.map((p) => [p.id, { playerId: p.playerId, playerName: p.player.nickname }] as const));

    const throwItems: MatchDetailsThrowItem[] = baseThrows
        .slice()
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((t) => {
            const player = participantIdToPlayer.get(t.participantId);
            return {
                id: t.id,
                participantId: t.participantId,
                playerId: player?.playerId ?? "",
                playerName: player?.playerName ?? "Desconocido",
                roundIndex: t.roundIndex,
                displayRoundIndex: getDisplayRoundIndex(t.roundIndex, isZeroBasedRounds),
                throwIndex: t.throwIndex,
                segment: t.segment,
                multiplier: t.multiplier,
                points: t.points,
                isBust: t.isBust,
                isWin: t.isWin,
                isValid: t.isValid,
                timestamp: t.timestamp,
            };
        });

    const throwItemById = new Map(throwItems.map((t) => [t.id, t] as const));

    const rounds: MatchDetailsThrowsRound[] = groupThrowsByRound(baseThrows).map((g) => ({
        roundIndex: g.roundIndex,
        displayRoundIndex: g.displayRoundIndex,
        throws: g.throwIds
            .map((id) => throwItemById.get(id))
            .filter((value): value is MatchDetailsThrowItem => Boolean(value))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    }));

    return (
        <div className="space-y-6">
            <MatchDetailsHeader
                matchId={match.id}
                gameLabel={gameLabel}
                statusLabel={statusLabel}
                status={derivedStatus}
                startedAt={match.startedAt}
                endedAt={match.endedAt}
                lastActivityAt={match.lastActivityAt}
                players={headerPlayers}
                winnerName={winnerParticipant?.player.nickname}
                winnerAvatarUrl={winnerParticipant?.player.avatarUrl ?? null}
                backHref={backHref}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-md border bg-white shadow">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Marcador</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Marcador calculado según las reglas del modo de juego.</p>
                        </div>
                        <div className="p-4">
                            {scoreboard ? (
                                <MatchDetailsScoreboard scoreboard={scoreboard} />
                            ) : (
                                <p className="text-sm text-slate-600">No disponible.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {hasAvailableActions ? (
                        <div className="rounded-md border bg-white shadow">
                            <div className="border-b px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">Acciones</h2>
                                <p className="mt-0.5 text-xs text-slate-500">Acciones disponibles según el estado de la partida.</p>
                            </div>
                            <div className="p-4">
                                <MatchDetailsActions matchId={match.id} status={derivedStatus} />
                            </div>
                        </div>
                    ) : null}

                    <div className="rounded-md border bg-white shadow">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Resumen</h2>
                        </div>
                        <div className="space-y-3 p-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Participantes</span>
                                <span className="font-medium text-slate-900">{match.participants.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Tiros</span>
                                <span className="font-medium text-slate-900">{match.throws.length}</span>
                            </div>
                            {winnerParticipant ? (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-500">Ganador</span>
                                    <span className="font-medium text-slate-900">{winnerParticipant.player.nickname}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white shadow">
                <div className="border-b px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Tiros</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Histórico de tiros por ronda.</p>
                </div>
                <div className="p-4">
                    <MatchDetailsThrows rounds={rounds} isZeroBasedRounds={isZeroBasedRounds} />
                </div>
            </div>
        </div>
    );
}

function getScoreboardSafe(state: GameState): Scoreboard | null {
    try {
        return getGameLogic(state.config.type).getScoreboard(state);
    } catch {
        return null;
    }
}
