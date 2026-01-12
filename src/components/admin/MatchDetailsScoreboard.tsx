import type { MatchDetailsScoreboardProps } from "@/types/components";

import type { ReactNode } from "react";

export function MatchDetailsScoreboard({ scoreboard }: MatchDetailsScoreboardProps) {
    const scoreLabel = scoreboard.gameType === "x01" ? "Restantes" : "Puntuación";

    const extraHeaders = scoreboard.headers.filter((h) => !["Jugador", "Puntos", "Puntuación", "Restantes"].includes(h));
    const hasExtraColumns = extraHeaders.length > 0 && scoreboard.rows.some((row) => row.details.length > 0);

    let headerExtraCells: ReactNode = null;
    if (hasExtraColumns) {
        headerExtraCells = extraHeaders.map((h) => (
            <th key={h} className="h-10 px-3 font-medium">
                {h}
            </th>
        ));
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="h-10 px-3 font-medium">Jugador</th>
                        <th className="h-10 px-3 font-medium">{scoreLabel}</th>
                        {headerExtraCells}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {scoreboard.rows.map((row) => {
                        let detailCells: ReactNode = null;

                        if (hasExtraColumns) {
                            detailCells = row.details.map((cell, idx) => (
                                <td key={idx} className="px-3 py-2 text-slate-700">
                                    <span className={cell.highlight ? "font-semibold text-slate-900" : ""}>{cell.value}</span>
                                </td>
                            ));
                        }

                        return (
                            <tr key={row.playerId} className={row.active ? "bg-blue-50/40" : ""}>
                                <td className="px-3 py-2 font-medium text-slate-900">{row.playerName}</td>
                                <td className="px-3 py-2 text-slate-700">{row.score}</td>
                                {detailCells}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
