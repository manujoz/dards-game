export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="rounded-md border bg-white p-6 shadow">
                <div className="h-5 w-64 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="h-16 animate-pulse rounded bg-slate-100" />
                    <div className="h-16 animate-pulse rounded bg-slate-100" />
                    <div className="h-16 animate-pulse rounded bg-slate-100" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-md border bg-white p-6 shadow lg:col-span-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="mt-4 h-40 animate-pulse rounded bg-slate-100" />
                </div>

                <div className="space-y-6">
                    <div className="rounded-md border bg-white p-6 shadow">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                        <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
                    </div>
                    <div className="rounded-md border bg-white p-6 shadow">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                        <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white p-6 shadow">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 h-64 animate-pulse rounded bg-slate-100" />
            </div>
        </div>
    );
}
