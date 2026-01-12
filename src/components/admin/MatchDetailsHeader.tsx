import type { MatchDetailsHeaderProps } from "@/types/components";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";

function formatDateTime(value: Date | null | undefined): string {
    if (!value) return "-";
    return format(value, "d MMM yyyy HH:mm", { locale: es });
}

export function MatchDetailsHeader({
    gameLabel,
    statusLabel,
    status,
    startedAt,
    endedAt,
    lastActivityAt,
    players,
    winnerName,
    winnerAvatarUrl,
    backHref,
}: MatchDetailsHeaderProps) {
    return (
        <div className="rounded-md border bg-white shadow">
            <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                        <ChevronLeft className="h-4 w-4" />
                        Volver
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">{gameLabel}</h1>
                        <StatusPill status={status} label={statusLabel} />
                    </div>

                    <p className="text-sm text-slate-500">
                        Inicio: <span className="font-medium text-slate-700">{formatDateTime(startedAt)}</span> · Última actividad:{" "}
                        <span className="font-medium text-slate-700">{formatDateTime(lastActivityAt ?? null)}</span> · Fin:{" "}
                        <span className="font-medium text-slate-700">{formatDateTime(endedAt ?? null)}</span>
                    </p>
                </div>

                {winnerName ? (
                    <div className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2">
                        <Trophy className="h-4 w-4 text-green-600" />
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border bg-white">
                            {winnerAvatarUrl ? (
                                <img src={winnerAvatarUrl} alt={`Avatar de ${winnerName}`} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xs font-extrabold text-slate-700">{(winnerName.trim().charAt(0) || "?").toUpperCase()}</span>
                            )}
                        </div>
                        <div className="text-sm">
                            <span className="text-slate-500">Ganador:</span> <span className="font-semibold text-slate-900">{winnerName}</span>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-wrap gap-2 px-4 py-3">
                {players.map((p) => (
                    <span
                        key={p.id}
                        className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border bg-slate-50">
                            {p.avatarUrl ? <img src={p.avatarUrl} alt={`Avatar de ${p.nickname}`} className="h-full w-full object-cover" /> : null}
                        </span>
                        {p.nickname}
                    </span>
                ))}
            </div>
        </div>
    );
}

function StatusPill({ status, label }: { status: string; label: string }) {
    const styles: Record<string, string> = {
        completed: "bg-green-100 text-green-700",
        ongoing: "bg-blue-100 text-blue-700",
        aborted: "bg-red-100 text-red-700",
        setup: "bg-amber-100 text-amber-800",
    };

    const style = styles[status] ?? "bg-slate-100 text-slate-700";

    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}
