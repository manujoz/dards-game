import { cookies } from "next/headers";
import Image from "next/image";

import { AdminLoginForm } from "@/components/home/AdminLoginForm";
import { StartGameButton } from "@/components/home/StartGameButton";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { sanitizeReturnTo } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";

interface HomePageProps {
    searchParams: Promise<{ returnTo?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
    const { returnTo: returnToRaw } = await searchParams;
    const returnTo = sanitizeReturnTo(returnToRaw);

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 opacity-40">
                <Image src="/assets/background.png" alt="Fondo con diana de dardos" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-950" />
            </div>

            {/* Content */}
            <main className="relative z-10 flex flex-col items-center gap-8 p-4 text-center">
                <div className="space-y-4 animate-in fade-in zoom-in duration-700">
                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-lg">
                        <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">DARDOS</span> JUEGO
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-md mx-auto drop-shadow-md">
                        Afina tu puntería. Da en el objetivo. Conviértete en el campeón.
                    </p>
                </div>

                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-1000 delay-300 w-full flex justify-center">
                    {session ? (
                        <div className="p-1 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 shadow-2xl shadow-amber-900/20 w-full max-w-md">
                            <div className="bg-slate-950 rounded-[10px] p-2">
                                <StartGameButton
                                    label="Empezar partida"
                                    className="w-full bg-transparent hover:bg-white/10 text-white border border-white/10 uppercase tracking-widest"
                                />
                            </div>
                        </div>
                    ) : (
                        <AdminLoginForm returnTo={returnTo} />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-4 z-10 text-slate-500 text-sm font-medium">© {new Date().getFullYear()} Dardos interactivos</footer>
        </div>
    );
}
