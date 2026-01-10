import { History, Shield, Trophy, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-slate-50">
            <aside className="hidden w-64 flex-col bg-slate-900 text-slate-50 md:flex">
                <div className="flex h-14 items-center border-b border-slate-800 px-6 bg-slate-950/50">
                    <Shield className="mr-2 h-6 w-6" />
                    <span className="font-bold">Admin Panel</span>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    <a
                        href="/players"
                        className="flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-800/80"
                    >
                        <Users className="h-4 w-4" />
                        Players
                    </a>
                    <a
                        href="/matches"
                        className={
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 " +
                            "hover:bg-slate-800 hover:text-slate-50"
                        }
                    >
                        <History className="h-4 w-4" />
                        Matches
                    </a>
                    <a
                        href="/rankings"
                        className={
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 " +
                            "hover:bg-slate-800 hover:text-slate-50"
                        }
                    >
                        <Trophy className="h-4 w-4" />
                        Rankings
                    </a>
                </nav>
            </aside>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </main>
        </div>
    );
}
