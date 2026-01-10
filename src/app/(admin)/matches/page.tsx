import { getMatches, type MatchListEntry } from "@/app/actions/matches";
import { format } from "date-fns";
import { Trophy } from "lucide-react";

export default async function MatchesPage() {
    const result = await getMatches();
    const matches = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Matches</h1>
                    <p className="text-slate-500">History of played matches.</p>
                </div>
            </div>

            <div className="rounded-md border bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="h-12 px-4 font-medium">Date</th>
                                <th className="h-12 px-4 font-medium">Game</th>
                                <th className="h-12 px-4 font-medium">Participants</th>
                                <th className="h-12 px-4 font-medium">Winner</th>
                                <th className="h-12 px-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matches?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center text-slate-500">
                                        No matches found.
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

function MatchRow({ match }: { match: MatchListEntry }) {
    // Helper to resolve winner
    const getWinnerName = (match: MatchListEntry) => {
        if (!match.winnerId) return "-";

        const winningTeam = match.teams.find((t) => t.id === match.winnerId);
        if (winningTeam) return winningTeam.name || "Team";

        // Check both for robustness
        const winningParticipant = match.participants.find((p) => p.id === match.winnerId || p.playerId === match.winnerId);
        // Note: winnerId usually stores participantId or teamId, but let's be safe.
        // Actually looking at schemas, typically winnerId matches a participant ID for single player or Team ID.

        if (winningParticipant) return winningParticipant.player.nickname;

        return "Unknown";
    };

    const winnerName = getWinnerName(match);
    const playerCount = match.participants.length;

    return (
        <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 text-slate-700">{format(new Date(match.startedAt), "MMM d, yyyy HH:mm")}</td>
            <td className="px-4 py-3 font-medium text-slate-900">
                <span className="capitalize">{match.gameId.replace(/_/g, " ")}</span>
            </td>
            <td className="px-4 py-3 text-slate-600">{playerCount} Players</td>
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

    const style = styles[status.toLowerCase()] || "bg-slate-100 text-slate-700";

    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{status}</span>;
}
