/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_DEVICE_ID = "00000000-0000-0000-0000-000000000000";

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
        where: { deviceId: DEFAULT_DEVICE_ID },
        update: {},
        create: {
            deviceId: DEFAULT_DEVICE_ID,
            calibration: JSON.stringify(null),
            preferences: JSON.stringify({
                soundVolume: 50,
                brightness: 100,
                language: "es",
                theme: "dark",
                animationsEnabled: true,
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
