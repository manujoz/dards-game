/**
 * Helpers para generar una clave estable de variante (variantKey) a partir de:
 * - gameId (fuente de verdad)
 * - Match.variant (JSON como string)
 *
 * Objetivo: separar rankings “pro” por variante sin depender de Prisma ni del motor.
 *
 * Reglas importantes:
 * - La key debe ser determinista (mismo input lógico → mismo output)
 * - Ignora campos irrelevantes / extra (no deben afectar a la key)
 * - Si no se puede interpretar el JSON o faltan campos relevantes, devuelve "unknown"
 */

const UNKNOWN_VARIANT_KEY = "unknown" as const;

type KeyValueMap = Map<string, string>;

type X01CheckMode = "straight" | "double" | "master";

type TeamMode = "single" | "team";

type CricketMode = "standard" | "cut_throat";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTeamMode(value: unknown): TeamMode | null {
    return value === "single" || value === "team" ? value : null;
}

function toX01CheckMode(value: unknown): X01CheckMode | null {
    return value === "straight" || value === "double" || value === "master" ? value : null;
}

function toCricketMode(value: unknown): CricketMode | null {
    return value === "standard" || value === "cut_throat" ? value : null;
}

function toPositiveInt(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    if (!Number.isInteger(value)) return null;
    if (value <= 0) return null;
    return value;
}

function toX01StartScore(value: unknown): number | null {
    const n = toPositiveInt(value);
    if (n === 301 || n === 501 || n === 701 || n === 901) return n;
    return null;
}

function normalizeCricketNumbers(value: unknown): string | null {
    if (!Array.isArray(value)) return null;

    const numbers: number[] = [];
    for (const item of value) {
        if (typeof item !== "number" || !Number.isFinite(item) || !Number.isInteger(item)) return null;
        numbers.push(item);
    }

    // El orden en el array no debería importar: ordenamos de forma canónica.
    // Regla: 25 (bull) al final; el resto en orden descendente.
    const unique = Array.from(new Set(numbers));
    unique.sort((a, b) => {
        if (a === 25 && b === 25) return 0;
        if (a === 25) return 1;
        if (b === 25) return -1;
        return b - a;
    });

    return unique.join(",");
}

function parseVariantJson(variantJson: string): Record<string, unknown> | null {
    try {
        const parsed = JSON.parse(variantJson) as unknown;
        if (!isRecord(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
}

function createVariantKeyPartsForX01(parsed: Record<string, unknown>): string | null {
    const startScore = toX01StartScore(parsed.startScore);
    const inMode = toX01CheckMode(parsed.inMode);
    const outMode = toX01CheckMode(parsed.outMode);
    const teamMode = toTeamMode(parsed.teamMode);

    if (!startScore || !inMode || !outMode || !teamMode) return null;

    const maxRounds = toPositiveInt(parsed.maxRounds);

    const parts: string[] = ["x01", `start=${startScore}`, `in=${inMode}`, `out=${outMode}`, `team=${teamMode}`];

    // Se incluye maxRounds solo si existe, ya que afecta a la duración y puede influir en el rendimiento/ranking.
    if (maxRounds) {
        parts.push(`maxRounds=${maxRounds}`);
    }

    return parts.join("|");
}

function createVariantKeyPartsForCricket(parsed: Record<string, unknown>): string | null {
    const mode = toCricketMode(parsed.mode);
    const teamMode = toTeamMode(parsed.teamMode);
    const numbers = normalizeCricketNumbers(parsed.numbers);

    if (!mode || !teamMode || !numbers) return null;

    const parts: string[] = ["cricket", `mode=${mode}`, `numbers=${numbers}`, `team=${teamMode}`];

    return parts.join("|");
}

/**
 * Genera una key de variante determinista y legible.
 *
 * Nota: el `gameId` es la fuente de verdad. Si el JSON incluye `type`, se valida
 * que sea consistente; si no existe, se intenta continuar igualmente.
 */
export function createVariantKey(gameId: string, variantJson: string): string {
    const parsed = parseVariantJson(variantJson);
    if (!parsed) return UNKNOWN_VARIANT_KEY;

    const parsedType = typeof parsed.type === "string" ? parsed.type : null;
    if (parsedType && parsedType !== gameId) return UNKNOWN_VARIANT_KEY;

    if (gameId === "x01") {
        return createVariantKeyPartsForX01(parsed) ?? UNKNOWN_VARIANT_KEY;
    }

    if (gameId === "cricket") {
        return createVariantKeyPartsForCricket(parsed) ?? UNKNOWN_VARIANT_KEY;
    }

    return UNKNOWN_VARIANT_KEY;
}

function parseKeyValueParts(variantKey: string): { prefix: string; kv: KeyValueMap } | null {
    if (!variantKey || variantKey === UNKNOWN_VARIANT_KEY) return null;

    const parts = variantKey.split("|").filter(Boolean);
    if (parts.length === 0) return null;

    const prefix = parts[0];
    const kv = new Map<string, string>();

    for (const part of parts.slice(1)) {
        const eqIndex = part.indexOf("=");
        if (eqIndex <= 0) continue;
        const key = part.slice(0, eqIndex);
        const value = part.slice(eqIndex + 1);
        if (!key || !value) continue;
        kv.set(key, value);
    }

    return { prefix, kv };
}

function labelX01(kv: KeyValueMap): string {
    const start = kv.get("start");
    const inMode = kv.get("in");
    const outMode = kv.get("out");
    const team = kv.get("team");
    const maxRounds = kv.get("maxRounds");

    if (!start || !outMode) return "Variante X01";

    const parts: string[] = [start];

    // Entrada
    if (inMode && inMode !== "straight") {
        parts.push(`Entrada ${inMode === "double" ? "doble" : "maestra"}`);
    }

    // Salida
    if (outMode === "straight") {
        parts.push("Salida directa");
    } else if (outMode === "double") {
        parts.push("Salida doble");
    } else if (outMode === "master") {
        parts.push("Salida maestra");
    }

    if (team === "team") {
        parts.push("Equipos");
    }

    if (maxRounds) {
        parts.push(`Máx. ${maxRounds} rondas`);
    }

    return parts.join(" · ");
}

function labelCricket(kv: KeyValueMap): string {
    const mode = kv.get("mode");
    const team = kv.get("team");
    const numbers = kv.get("numbers");

    const parts: string[] = ["Cricket"];

    if (mode === "standard") {
        parts.push("Estándar");
    } else if (mode === "cut_throat") {
        parts.push("Contra todos");
    }

    // Solo mostramos números si parece una variante no estándar.
    const defaultNumbers = "20,19,18,17,16,15,25";
    if (numbers && numbers !== defaultNumbers) {
        parts.push(`Números ${numbers}`);
    }

    if (team === "team") {
        parts.push("Equipos");
    }

    return parts.join(" · ");
}

/**
 * Convierte `(gameId, variantKey)` en una etiqueta humana para UI.
 *
 * Si no puede interpretarse, devuelve un fallback razonable en español.
 */
export function getVariantLabel(gameId: string, variantKey: string): string {
    if (variantKey === UNKNOWN_VARIANT_KEY) {
        if (gameId !== "x01" && gameId !== "cricket") return "Por defecto";
        return "Variante desconocida";
    }

    const parsed = parseKeyValueParts(variantKey);
    if (!parsed) return "Variante";

    // La key incluye prefijo (p.ej. x01|...), pero preferimos usar gameId como fuente de verdad.
    if (gameId === "x01") {
        return labelX01(parsed.kv);
    }

    if (gameId === "cricket") {
        return labelCricket(parsed.kv);
    }

    return "Variante";
}

export const __testing = {
    UNKNOWN_VARIANT_KEY,
};
