import { hash } from "bcryptjs";

async function main() {
    const password = process.argv[2];

    if (!password || password.trim().length === 0) {
        process.stderr.write("Uso: pnpm tsx scripts/hash-password.ts 'mi-password'\n");
        process.exitCode = 1;
        return;
    }

    const hashedPassword = await hash(password, 12);
    process.stdout.write(`${hashedPassword}\n`);
}

void main().catch((error) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 1;
});
