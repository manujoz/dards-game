import { getRankingVariants, getRankings } from "@/app/actions/rankings";
import { cn } from "@/lib/utils";
import type { RankingEntry, RankingGameType } from "@/types/actions/rankings";
import { Medal, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isSafeReturnTo(value: string): boolean {
    return value.trim().startsWith("/game");
}

function withReturnTo(path: string, returnTo: string): string {
    const [base, query] = path.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("returnTo", returnTo);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

export default async function RankingsPage(props: { searchParams: Promise<{ type?: string; variant?: string; returnTo?: string }> }) {
    const searchParams = await props.searchParams;

    const supportedTypes: RankingGameType[] = ["all", "x01", "cricket", "round_the_clock", "high_score", "shanghai", "killer", "halve_it"];

    const rawType = typeof searchParams.type === "string" ? searchParams.type : "";
    const type: RankingGameType = supportedTypes.includes(rawType as RankingGameType) ? (rawType as RankingGameType) : "all";

    const returnTo = typeof searchParams.returnTo === "string" && isSafeReturnTo(searchParams.returnTo) ? searchParams.returnTo : null;

    const variantFromQuery = typeof searchParams.variant === "string" ? searchParams.variant.trim() : "";

    const variantsResult = type === "all" ? null : await getRankingVariants(type);
    const variants = variantsResult?.success ? (variantsResult.data ?? []) : [];

    const requestedVariantKey = variantFromQuery.length > 0 ? variantFromQuery : null;
    const defaultVariantKey = variants[0]?.variantKey ?? null;
    const canUseRequestedVariant = requestedVariantKey ? variants.some((option) => option.variantKey === requestedVariantKey) : false;

    // Decisión cerrada:
    // - Si NO hay `variant` en querystring, usamos la primera opción como default para pedir datos.
    // - NO redirigimos para escribir `variant` en la URL.
    const effectiveVariantKey = type === "all" ? null : canUseRequestedVariant ? requestedVariantKey : defaultVariantKey;
    const effectiveVariantLabel =
        type === "all" || !effectiveVariantKey ? null : (variants.find((option) => option.variantKey === effectiveVariantKey)?.label ?? null);

    const result = type === "all" ? await getRankings("all") : await getRankings({ gameType: type, variantKey: effectiveVariantKey ?? undefined });
    const rankings = result.success ? result.data : [];

    const emptyMessage = result.success ? (result.message ?? "No hay datos de clasificación.") : "No se han podido cargar los rankings.";

    const showPpd = type !== "cricket";
    const showMpr = type === "cricket";
    const columnCount = 6 + (showPpd ? 1 : 0) + (showMpr ? 1 : 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clasificación</h1>
                    <p className="text-slate-500">
                        Mejores jugadores por modo de juego.
                        {type !== "all" && effectiveVariantLabel ? (
                            <span className="ml-2 text-slate-600">Variante: {effectiveVariantLabel}</span>
                        ) : null}
                    </p>
                </div>
            </div>

            <div>
                <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 w-fit">
                    <TabLink current={type} target="all" label="Todos" returnTo={returnTo} />
                    <TabLink current={type} target="x01" label="X01" returnTo={returnTo} />
                    <TabLink current={type} target="cricket" label="Cricket" returnTo={returnTo} />
                    <TabLink current={type} target="round_the_clock" label="Round the Clock" returnTo={returnTo} />
                    <TabLink current={type} target="high_score" label="High Score" returnTo={returnTo} />
                    <TabLink current={type} target="shanghai" label="Shanghai" returnTo={returnTo} />
                    <TabLink current={type} target="halve_it" label="Halve It" returnTo={returnTo} />
                    <TabLink current={type} target="killer" label="Killer" returnTo={returnTo} />
                </div>
            </div>

            {type !== "all" && variants.length > 0 ? (
                <div className="rounded-md border bg-white p-4 shadow">
                    <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="variant" className="text-sm font-medium text-slate-900">
                                Variante
                            </label>
                            <div className="flex items-center gap-3">
                                <input type="hidden" name="type" value={type} />
                                {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                                <select
                                    id="variant"
                                    name="variant"
                                    defaultValue={effectiveVariantKey ?? ""}
                                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                                >
                                    {variants.map((option) => (
                                        <option key={option.variantKey} value={option.variantKey}>
                                            {option.label} ({option.matchCount})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
                                >
                                    Aplicar
                                </button>
                                {requestedVariantKey ? (
                                    <Link
                                        href={returnTo ? withReturnTo(`/rankings?type=${type}`, returnTo) : `/rankings?type=${type}`}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Quitar filtro
                                    </Link>
                                ) : null}
                            </div>
                        </div>

                        {result.success ? null : <p className="text-sm text-slate-600">No se han podido cargar los rankings.</p>}
                    </form>
                </div>
            ) : null}

            <div className="rounded-md border bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="h-12 w-12 px-4 font-medium">#</th>
                                <th className="h-12 px-4 font-medium">Jugador</th>
                                <th className="h-12 px-4 font-medium text-right">ELO</th>
                                <th className="h-12 px-4 font-medium text-right">{type === "cricket" ? "Marcas" : "Puntos"}</th>
                                <th className="h-12 px-4 font-medium text-right">% victorias</th>
                                <th className="h-12 px-4 font-medium text-right">Partidas</th>
                                {showPpd ? <th className="h-12 px-4 font-medium text-right">PPD</th> : null}
                                {showMpr ? <th className="h-12 px-4 font-medium text-right">MPR</th> : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rankings?.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="h-24 text-center text-slate-500">
                                        {emptyMessage}
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

function TabLink({ current, target, label, returnTo }: { current: string; target: string; label: string; returnTo: string | null }) {
    const isActive = current === target;

    const hrefBase = `/rankings?type=${target}`;
    const href = returnTo ? withReturnTo(hrefBase, returnTo) : hrefBase;

    return (
        <Link
            href={href}
            className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900",
            )}
        >
            {label}
        </Link>
    );
}

function RankingRow({ entry, type }: { entry: RankingEntry; type: string }) {
    const winRate = entry.matchesPlayed > 0 ? Math.round((entry.matchesWon / entry.matchesPlayed) * 100) : 0;
    const showPpd = type !== "cricket";
    const showMpr = type === "cricket";

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
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                        {entry.player.avatarUrl ? (
                            <img src={entry.player.avatarUrl} alt={entry.player.name} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{entry.player.name}</span>
                        {entry.isProvisional ? (
                            <span
                                title="Rating provisional: menos de 10 partidas"
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                            >
                                Provisional
                            </span>
                        ) : null}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-right font-mono text-slate-700">{entry.ratingElo}</td>
            <td className="px-4 py-3 text-right text-slate-600">
                {type === "cricket" ? (entry.marksAggregated !== null ? entry.marksAggregated : "-") : entry.pointsAggregated}
            </td>
            <td className="px-4 py-3 text-right text-slate-600">{winRate}%</td>
            <td className="px-4 py-3 text-right text-slate-600">{entry.matchesPlayed}</td>
            {showPpd ? <td className="px-4 py-3 text-right text-slate-600">{entry.ppd !== null ? entry.ppd.toFixed(1) : "-"}</td> : null}
            {showMpr ? <td className="px-4 py-3 text-right text-slate-600">{entry.mpr !== null ? entry.mpr.toFixed(1) : "-"}</td> : null}
        </tr>
    );
}
