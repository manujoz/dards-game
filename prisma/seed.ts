/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    const player1 = await prisma.player.upsert({
        where: { nickname: "Player 1" },
        update: {},
        create: {
            nickname: "Player 1",
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player1",
        },
    });

    const player2 = await prisma.player.upsert({
        where: { nickname: "Player 2" },
        update: {},
        create: {
            nickname: "Player 2",
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player2",
        },
    });

    // Ensure Default Device Config exists
    await prisma.deviceConfig.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            calibration: JSON.stringify({
                centerX: 0.5,
                centerY: 0.5,
                radius: 0.4,
            }),
            preferences: JSON.stringify({
                soundEnabled: true,
                theme: "dark",
            }),
        },
    });

    console.log({ player1, player2 });
    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
