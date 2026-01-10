import { getRankings } from "@/app/actions/rankings";
import { cn } from "@/lib/utils";
import { type RankingEntry } from "@/types/actions/rankings";
import { Medal } from "lucide-react";

export default async function RankingsPage(props: { searchParams: Promise<{ type?: string }> }) {
    const searchParams = await props.searchParams;
    const type = searchParams.type === "cricket" ? "cricket" : searchParams.type === "x01" ? "x01" : "all";

    const result = await getRankings(type);
    const rankings = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rankings</h1>
                    <p className="text-slate-500">Top players by game mode.</p>
                </div>
            </div>

            <div>
                <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 w-fit">
                    <TabLink current={type} target="all" label="All Games" />
                    <TabLink current={type} target="x01" label="X01" />
                    <TabLink current={type} target="cricket" label="Cricket" />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="h-12 w-12 px-4 font-medium">#</th>
                                <th className="h-12 px-4 font-medium">Player</th>
                                <th className="h-12 px-4 font-medium text-right">Rating</th>
                                <th className="h-12 px-4 font-medium text-right">Win Rate</th>
                                <th className="h-12 px-4 font-medium text-right">Matches</th>
                                {type !== "cricket" && <th className="h-12 px-4 font-medium text-right">PPD</th>}
                                {type !== "x01" && <th className="h-12 px-4 font-medium text-right">MPR</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rankings?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-24 text-center text-slate-500">
                                        No rankings data available.
                                    </td>
                                </tr>
                            ) : (
                                rankings?.map((entry) => <RankingRow key={entry.player.id} entry={entry} type={type} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function TabLink({ current, target, label }: { current: string; target: string; label: string }) {
    const isActive = current === target;
    return (
        <a
            href={`/rankings?type=${target}`}
            className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
        >
            {label}
        </a>
    );
}

function RankingRow({ entry, type }: { entry: RankingEntry; type: string }) {
    const winRate = entry.stats.matchesPlayed > 0 ? Math.round((entry.stats.matchesWon / entry.stats.matchesPlayed) * 100) : 0;

    return (
        <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-bold text-slate-400">
                {entry.rank === 1 ? (
                    <Medal className="h-5 w-5 text-yellow-500" />
                ) : entry.rank === 2 ? (
                    <Medal className="h-5 w-5 text-slate-400" />
                ) : entry.rank === 3 ? (
                    <Medal className="h-5 w-5 text-amber-700" />
                ) : (
                    entry.rank
                )}
            </td>
            <td className="px-4 py-3 font-medium text-slate-900">{entry.player.name}</td>
            <td className="px-4 py-3 text-right font-mono text-slate-700">{entry.score}</td>
            <td className="px-4 py-3 text-right text-slate-600">{winRate}%</td>
            <td className="px-4 py-3 text-right text-slate-600">{entry.stats.matchesPlayed}</td>
            {type !== "cricket" && <td className="px-4 py-3 text-right text-slate-600">{entry.stats.ppd?.toFixed(1) || "-"}</td>}
            {type !== "x01" && <td className="px-4 py-3 text-right text-slate-600">{entry.stats.mpr?.toFixed(1) || "-"}</td>}
        </tr>
    );
}
