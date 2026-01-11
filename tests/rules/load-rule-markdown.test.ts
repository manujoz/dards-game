import { describe, expect, it } from "vitest";

import { stripRulesMarkdownChrome } from "@/lib/rules/load-rule-markdown";

describe("stripRulesMarkdownChrome", () => {
    it("elimina la línea de navegación inicial y separadores sobrantes", () => {
        const input = ["[← Volver al Principal](../README.md) | [X01](./x01.md)", "", "---", "", "# Reglas de X01", "", "Texto."].join("\n");

        const output = stripRulesMarkdownChrome(input);
        expect(output.startsWith("# Reglas de X01")).toBe(true);
        expect(output).toContain("Texto.");
        expect(output).not.toContain("Volver al Principal");
    });

    it("no toca markdown si no hay navegación inicial", () => {
        const input = ["# Reglas de Cricket", "", "Contenido"].join("\n");
        expect(stripRulesMarkdownChrome(input)).toBe(input);
    });
});
