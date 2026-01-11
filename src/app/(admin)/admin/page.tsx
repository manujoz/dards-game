import Link from "next/link";

export const dynamic = "force-dynamic";
function isSafeReturnTo(value: string): boolean {
    return value.trim().startsWith("/game");
}

interface AdminPageProps {
    searchParams: Promise<{ returnTo?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
    const { returnTo: returnToRaw } = await searchParams;
    const returnTo = typeof returnToRaw === "string" && isSafeReturnTo(returnToRaw) ? returnToRaw : "/game";

    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black">Panel</h1>
                <p className="text-slate-300 mt-2">Accesos rápidos para administrar jugadores, partidas y rankings.</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href={returnTo} className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-4 font-bold">
                        Volver al juego
                    </Link>

                    <Link href="/players" className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-4 font-bold">
                        Jugadores
                    </Link>

                    <Link href="/matches" className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-4 font-bold">
                        Partidas
                    </Link>

                    <Link href="/rankings" className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-4 font-bold">
                        Clasificación
                    </Link>

                    <Link href="/rules" className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-4 py-4 font-bold">
                        Reglas
                    </Link>
                </div>
            </div>
        </main>
    );
}
