import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let prismaClient = null;

function loadEnvLocalIfPresent() {
    const doubleQuoteChar = String.fromCharCode(34);
    const singleQuoteChar = String.fromCharCode(39);

    const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.length === 0) continue;
        if (line.startsWith("#")) continue;

        const eqIndex = line.indexOf("=");
        if (eqIndex <= 0) continue;

        const key = line.slice(0, eqIndex).trim();
        if (key.length === 0) continue;

        let value = line.slice(eqIndex + 1).trim();
        if (value.startsWith(doubleQuoteChar) && value.endsWith(doubleQuoteChar)) {
            value = value.slice(1, -1);
        } else if (value.startsWith(singleQuoteChar) && value.endsWith(singleQuoteChar)) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

async function loadRuntimeModules() {
    const prismaModule = await import("../src/lib/db/prisma.ts");
    const recomputeModule = await import("../src/lib/rankings/recompute.ts");
    const variantKeyModule = await import("../src/lib/rankings/variant-key.ts");

    const prisma = prismaModule.prisma ?? prismaModule.default?.prisma;
    const recomputeRankingsScope = recomputeModule.recomputeRankingsScope ?? recomputeModule.default?.recomputeRankingsScope;
    const createVariantKey = variantKeyModule.createVariantKey ?? variantKeyModule.default?.createVariantKey;

    if (!prisma) {
        throw new Error("No se pudo cargar Prisma (export prisma) desde src/lib/db/prisma.ts");
    }

    if (!recomputeRankingsScope) {
        throw new Error("No se pudo cargar recomputeRankingsScope desde src/lib/rankings/recompute.ts");
    }

    if (!createVariantKey) {
        throw new Error("No se pudo cargar createVariantKey desde src/lib/rankings/variant-key.ts");
    }

    return {
        prisma,
        recomputeRankingsScope,
        createVariantKey,
    };
}

function printUsage() {
    process.stderr.write(
        [
            "Uso:",
            "  pnpm tsx scripts/recompute-rankings.mjs --gameId x01 [--variantKey <key>]",
            "",
            "Ejemplos:",
            "  pnpm tsx scripts/recompute-rankings.mjs --gameId x01",
            "  pnpm tsx scripts/recompute-rankings.mjs --gameId x01 --variantKey 'x01|start=501|in=straight|out=double|team=single'",
        ].join("\n") + "\n",
    );
}

function parseArgs(argv) {
    let gameId = null;
    let variantKey = null;
    let help = false;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i] ?? "";

        if (arg === "--help" || arg === "-h") {
            help = true;
            continue;
        }

        if (arg === "--gameId") {
            const value = argv[i + 1];
            if (!value) {
                return { gameId, variantKey, help, error: "Falta valor para --gameId." };
            }
            gameId = value;
            i += 1;
            continue;
        }

        if (arg.startsWith("--gameId=")) {
            gameId = arg.slice("--gameId=".length);
            continue;
        }

        if (arg === "--variantKey") {
            const value = argv[i + 1];
            if (!value) {
                return { gameId, variantKey, help, error: "Falta valor para --variantKey." };
            }
            variantKey = value;
            i += 1;
            continue;
        }

        if (arg.startsWith("--variantKey=")) {
            variantKey = arg.slice("--variantKey=".length);
            continue;
        }

        return { gameId, variantKey, help, error: `Argumento no reconocido: ${arg}` };
    }

    if (gameId && gameId.trim().length === 0) {
        return { gameId: null, variantKey, help, error: "--gameId no puede estar vacío." };
    }

    if (variantKey && variantKey.trim().length === 0) {
        return { gameId, variantKey: null, help, error: "--variantKey no puede estar vacío." };
    }

    return { gameId, variantKey, help, error: null };
}

async function listVariantKeysFromCompletedMatches({ prisma, createVariantKey, gameId }) {
    const matches = await prisma.match.findMany({
        where: {
            gameId,
            status: "completed",
        },
        select: {
            variant: true,
        },
    });

    const keys = new Set();
    for (const m of matches) {
        keys.add(createVariantKey(gameId, m.variant));
    }

    return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

async function main() {
    const { gameId, variantKey, help, error } = parseArgs(process.argv.slice(2));

    if (help) {
        printUsage();
        process.exitCode = 0;
        return;
    }

    if (error) {
        process.stderr.write(`${error}\n\n`);
        printUsage();
        process.exitCode = 1;
        return;
    }

    if (!gameId) {
        process.stderr.write("Falta --gameId.\n\n");
        printUsage();
        process.exitCode = 1;
        return;
    }

    loadEnvLocalIfPresent();

    const { prisma, recomputeRankingsScope, createVariantKey } = await loadRuntimeModules();
    prismaClient = prisma;

    let requestedVariantKeys;
    if (variantKey) {
        requestedVariantKeys = [variantKey];
    } else {
        requestedVariantKeys = await listVariantKeysFromCompletedMatches({
            prisma,
            createVariantKey,
            gameId,
        });
    }

    if (requestedVariantKeys.length === 0) {
        process.stderr.write(`No se encontraron partidas completed para gameId="${gameId}".\n`);
        process.exitCode = 1;
        return;
    }

    process.stdout.write(
        `Recompute de rankings: gameId="${gameId}"${variantKey ? ` variantKey="${variantKey}"` : " (todas las variantes detectadas)"}\n`,
    );

    for (const key of requestedVariantKeys) {
        process.stdout.write(`- Recomputando scope: gameId="${gameId}", variantKey="${key}"...\n`);
        const result = await recomputeRankingsScope({ gameId, variantKey: key });
        process.stdout.write(`  OK: matchesConsidered=${result.matchesConsidered}, participantsConsidered=${result.participantsConsidered}\n`);
    }

    process.stdout.write("Hecho.\n");
}

void main()
    .catch((err) => {
        const message = err instanceof Error ? err.message : "Error desconocido";
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            if (prismaClient) {
                await prismaClient.$disconnect();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            process.stderr.write(`Error cerrando Prisma: ${message}\n`);
            process.exitCode = process.exitCode ?? 1;
        }
    });
