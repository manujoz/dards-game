import type { RulesMarkdownProps } from "@/types/components/rules";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function RulesMarkdown({ rule, markdown }: RulesMarkdownProps) {
    return (
        <section aria-label={`Reglas: ${rule.title}`} className="w-full">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="text-3xl font-black tracking-tight">{children}</h1>,
                    h2: ({ children }) => <h2 className="mt-8 text-2xl font-extrabold tracking-tight">{children}</h2>,
                    h3: ({ children }) => <h3 className="mt-6 text-xl font-bold tracking-tight">{children}</h3>,
                    p: ({ children }) => <p className="mt-3 leading-7 text-slate-800">{children}</p>,
                    ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-800">{children}</ul>,
                    ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-800">{children}</ol>,
                    li: ({ children }) => <li className="leading-7">{children}</li>,
                    hr: () => <hr className="my-8 border-slate-200" />,
                    a: ({ children, href }) => (
                        <a href={href} className="font-semibold text-slate-900 underline underline-offset-4">
                            {children}
                        </a>
                    ),
                    code: ({ children }) => (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900">{children}</code>
                    ),
                    pre: ({ children }) => (
                        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-50">{children}</pre>
                    ),
                    table: ({ children }) => (
                        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full border-collapse text-left">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900">{children}</th>
                    ),
                    td: ({ children }) => <td className="border-b border-slate-200 px-3 py-2 text-sm text-slate-800">{children}</td>,
                }}
            >
                {markdown}
            </ReactMarkdown>
        </section>
    );
}
