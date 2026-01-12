import type { MatchDetailsThrowItem, MatchDetailsThrowsProps } from "@/types/components";

import type { ReactNode } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatHit(throwItem: MatchDetailsThrowItem): string {
    if (throwItem.segment === 0 || throwItem.multiplier === 0) return "Fallo";

    if (throwItem.segment === 25) {
        if (throwItem.multiplier === 2) return "Bull (50)";
        return "Bull (25)";
    }

    const prefix = throwItem.multiplier === 3 ? "T" : throwItem.multiplier === 2 ? "D" : "";
    return `${prefix}${throwItem.segment}`;
}

export function MatchDetailsThrows({ rounds }: MatchDetailsThrowsProps) {
    if (rounds.length === 0) {
        return <p className="text-sm text-slate-600">Todavía no hay tiros registrados.</p>;
    }

    return (
        <div className="space-y-4">
            {rounds.map((round) => {
                const totalPoints = round.throws.reduce((acc, t) => acc + t.points, 0);

                return (
                    <details key={round.roundIndex} className="rounded-md border bg-white" open>
                        <summary className="cursor-pointer select-none list-none px-3 py-2 text-sm font-semibold text-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>Ronda {round.displayRoundIndex}</span>
                                <span className="text-xs font-medium text-slate-500">
                                    {round.throws.length} tiros · {totalPoints} pts
                                </span>
                            </div>
                        </summary>
                        <div className="overflow-x-auto border-t">
                            <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="h-10 w-[110px] px-3 font-medium">Hora</th>
                                        <th className="h-10 w-[160px] px-3 font-medium">Jugador</th>
                                        <th className="h-10 w-[70px] px-3 font-medium">Tiro</th>
                                        <th className="h-10 w-[140px] px-3 font-medium">Impacto</th>
                                        <th className="h-10 w-[90px] px-3 font-medium">Puntos</th>
                                        <th className="h-10 w-[220px] px-3 font-medium">Notas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {round.throws.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50">
                                            <td className="w-[110px] px-3 py-2 text-slate-600">{format(t.timestamp, "HH:mm:ss", { locale: es })}</td>
                                            <td className="w-[160px] px-3 py-2 font-medium text-slate-900">{t.playerName}</td>
                                            <td className="w-[70px] px-3 py-2 text-slate-700">#{t.throwIndex}</td>
                                            <td className="w-[140px] px-3 py-2 text-slate-700">{formatHit(t)}</td>
                                            <td className="w-[90px] px-3 py-2 text-slate-700">{t.points}</td>
                                            <td className="w-[220px] px-3 py-2">
                                                <div className="flex min-h-6 flex-wrap gap-2">
                                                    {t.isBust ? <Pill variant="red">Bust</Pill> : null}
                                                    {t.isWin ? <Pill variant="green">Ganador</Pill> : null}
                                                    {!t.isValid ? <Pill variant="amber">No válido</Pill> : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                );
            })}
        </div>
    );
}

function Pill({ children, variant }: { children: ReactNode; variant: "red" | "green" | "amber" }) {
    const styles: Record<typeof variant, string> = {
        red: "bg-red-100 text-red-700",
        green: "bg-green-100 text-green-700",
        amber: "bg-amber-100 text-amber-800",
    };

    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[variant]}`}>{children}</span>;
}
