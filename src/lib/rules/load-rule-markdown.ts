import fs from "node:fs/promises";
import path from "node:path";

import type { RuleGameDefinition } from "@/lib/rules/rules-registry";

export interface LoadedRuleMarkdown {
    title: string;
    markdown: string;
}

function isSafeDocFileName(fileName: string): boolean {
    return /^[a-z0-9-]+\.md$/u.test(fileName);
}

export function stripRulesMarkdownChrome(source: string): string {
    const normalized = source.replace(/\r\n/g, "\n").trim();
    const lines = normalized.split("\n");

    // Quita la navegación tipo "[← Volver ...]" (primera línea) si existe.
    const firstLine = lines[0] ?? "";
    const withoutNav = firstLine.startsWith("[") && firstLine.includes("←") ? lines.slice(1) : lines;

    // Quita separadores iniciales sobrantes
    const withoutLeadingRules = (() => {
        const copy = [...withoutNav];
        while (copy.length > 0 && (copy[0] ?? "").trim() === "") {
            copy.shift();
        }
        while (copy.length > 0 && (copy[0] ?? "").trim() === "---") {
            copy.shift();
            while (copy.length > 0 && (copy[0] ?? "").trim() === "") {
                copy.shift();
            }
        }
        return copy;
    })();

    return withoutLeadingRules.join("\n").trim();
}

export async function loadRuleMarkdown(rule: RuleGameDefinition): Promise<LoadedRuleMarkdown> {
    if (!isSafeDocFileName(rule.docFileName)) {
        throw new Error("Invalid rules doc filename");
    }

    const absolutePath = path.join(process.cwd(), "docs", "rules", rule.docFileName);
    const raw = await fs.readFile(absolutePath, "utf-8");

    return {
        title: rule.title,
        markdown: stripRulesMarkdownChrome(raw),
    };
}
