import Link from "next/link";
import { notFound } from "next/navigation";

import { RulesMarkdown } from "@/components/admin/RulesMarkdown";
import { loadRuleMarkdown } from "@/lib/rules/load-rule-markdown";
import { getRuleGameBySlug, RULE_GAMES } from "@/lib/rules/rules-registry";

export function generateStaticParams() {
    return RULE_GAMES.map((game) => ({ game: game.slug }));
}

export default async function RulePage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params;
    const rule = getRuleGameBySlug(game);

    if (!rule) {
        notFound();
    }

    const loaded = await loadRuleMarkdown(rule);

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto w-full max-w-4xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href="/rules" className="font-bold text-slate-900 underline underline-offset-4">
                            Reglas
                        </Link>
                        <span className="text-slate-400">/</span>
                        <span className="font-semibold text-slate-700">{loaded.title}</span>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <RulesMarkdown rule={rule} markdown={loaded.markdown} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {RULE_GAMES.map((g) => (
                        <Link
                            key={g.slug}
                            href={`/rules/${g.slug}`}
                            className={
                                "rounded-full border px-3 py-1 text-sm font-bold " +
                                (g.slug === rule.slug
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50")
                            }
                        >
                            {g.title}
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
