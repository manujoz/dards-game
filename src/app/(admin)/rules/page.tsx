import Link from "next/link";

import { RULE_GAMES } from "@/lib/rules/rules-registry";

export default function RulesIndexPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto w-full max-w-5xl p-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Reglas</h1>
                        <p className="mt-2 max-w-2xl text-slate-600">
                            Documentación de reglas por modo de juego. El contenido se extrae de <code>docs/rules</code>.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {RULE_GAMES.map((game) => (
                        <Link
                            key={game.slug}
                            href={`/rules/${game.slug}`}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 group-hover:underline group-hover:underline-offset-4">
                                        {game.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{game.description}</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">v1</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
