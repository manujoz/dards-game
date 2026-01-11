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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel</h1>
                <p className="text-slate-500">Accesos rápidos para administrar jugadores, partidas, rankings y reglas.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <QuickLink href={returnTo} title="Volver al juego" description="Regresa a la partida en curso." />
                <QuickLink href="/players" title="Jugadores" description="Crear, editar y borrar jugadores." />
                <QuickLink href="/matches" title="Partidas" description="Ver historial y estado de partidas." />
                <QuickLink href="/rankings" title="Clasificación" description="Ranking por modo de juego." />
                <QuickLink href="/rules" title="Reglas" description="Documentación de reglas por modo." />
            </div>
        </div>
    );
}

interface QuickLinkProps {
    href: string;
    title: string;
    description: string;
}

function QuickLink({ href, title, description }: QuickLinkProps) {
    return (
        <Link
            href={href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
        >
            <div className="flex flex-col gap-1">
                <div className="text-base font-extrabold text-slate-900 group-hover:underline group-hover:underline-offset-4">{title}</div>
                <div className="text-sm text-slate-600">{description}</div>
            </div>
        </Link>
    );
}
