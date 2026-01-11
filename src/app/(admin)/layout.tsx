import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Suspense } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-slate-50">
            <Suspense fallback={<aside className="hidden w-72 bg-slate-900 md:block" />}>
                <AdminSidebar title="Panel" />
            </Suspense>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </main>
        </div>
    );
}
