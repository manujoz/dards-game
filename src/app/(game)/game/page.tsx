import { GameController } from "@/components/game/GameController";
import { getMatchState } from "@/lib/game/loader";

interface PageProps {
    searchParams: Promise<{
        matchId?: string;
    }>;
}

export default async function GamePage({ searchParams }: PageProps) {
    const { matchId } = await searchParams;

    let gameState = null;

    if (matchId) {
        gameState = await getMatchState(matchId);
    }

    return <GameController initialState={gameState} />;
}
