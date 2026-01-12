import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";

import type { MatchWithDetails } from "@/app/actions/matches";
import type { GameConfig, GameId, GameState, Hit, Player, TeamMode } from "@/types/models/darts";

function toHitMultiplier(value: number): Hit["multiplier"] {
    switch (value) {
        case 0:
            return 0;
        case 1:
            return 1;
        case 2:
            return 2;
        case 3:
            return 3;
        default:
            return 0;
    }
}

function toGameId(value: string): GameId | null {
    switch (value) {
        case "x01":
        case "cricket":
        case "round_the_clock":
        case "high_score":
        case "shanghai":
        case "killer":
        case "halve_it":
            return value;
        default:
            return null;
    }
}

function toTeamMode(value: unknown): TeamMode | null {
    return value === "single" || value === "team" ? value : null;
}

export function getMatchStateFromDetails(match: MatchWithDetails): GameState | null {
    // 1) Reconstruct Config
    let config: GameConfig;
    try {
        config = JSON.parse(match.variant) as GameConfig;
    } catch (error) {
        console.error("No se ha podido interpretar la configuración de la partida", error);
        return null;
    }

    if (!toGameId((config as { type?: string }).type ?? "")) {
        const fallbackType = toGameId(match.gameId);
        if (!fallbackType) {
            console.error("match.gameId inválido", match.gameId);
            return null;
        }

        config = {
            ...(config as Omit<GameConfig, "type">),
            type: fallbackType,
        } as GameConfig;
    }

    try {
        const parsedFormat = JSON.parse(match.format) as { teamMode?: unknown };
        const formatTeamMode = toTeamMode(parsedFormat.teamMode);
        if (formatTeamMode) {
            config = {
                ...config,
                teamMode: formatTeamMode,
            };
        }
    } catch {
        // ignore invalid format
    }

    // 2) Reconstruct Players (ordered)
    const orderedParticipants = [...match.participants].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const players: Player[] = orderedParticipants.map((p) => ({
        id: p.player.id,
        name: p.player.nickname,
        avatarUrl: p.player.avatarUrl || undefined,
        isGuest: false,
    }));

    // 3) Init Engine & Logic
    let gameState: GameState;
    try {
        gameState = GameEngine.init(players, config);
    } catch (error) {
        console.error("No se ha podido inicializar el motor", error);
        return null;
    }

    gameState.id = match.id;

    const participantIdToPlayerId = new Map<string, string>();
    for (const p of orderedParticipants) {
        participantIdToPlayerId.set(p.id, p.playerId);
    }

    const gameLogic = getGameLogic(config.type);

    // 4) Replay Throws
    let currentTurnKey: string | null = `${gameState.currentTurn.roundIndex}:${gameState.currentTurn.playerId}`;

    const orderedThrows = [...match.throws].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const dbThrow of orderedThrows) {
        const playerId = participantIdToPlayerId.get(dbThrow.participantId);
        if (!playerId) {
            console.error("No se ha podido mapear participantId a playerId", dbThrow.participantId);
            continue;
        }

        const turnKey = `${dbThrow.roundIndex}:${playerId}`;
        if (turnKey !== currentTurnKey) {
            if (gameState.currentTurn.throws.length > 0) {
                gameState.history.push(gameState.currentTurn);
            }

            const playerState = gameState.playerStates.find((ps) => ps.playerId === playerId);
            const startScore = playerState ? playerState.score : 0;

            gameState.currentPlayerId = playerId;
            gameState.currentRound = dbThrow.roundIndex;
            gameState.currentTurn = {
                playerId,
                roundIndex: dbThrow.roundIndex,
                throws: [],
                startScore,
                endScore: startScore,
                isBust: false,
            };
            currentTurnKey = turnKey;
        }

        const multiplier = toHitMultiplier(dbThrow.multiplier);
        const hit: Hit = {
            segment: dbThrow.segment,
            multiplier,
        };

        const resultThrow = gameLogic.processThrow(gameState, hit);
        resultThrow.timestamp = dbThrow.timestamp.getTime();

        gameState = GameEngine.addThrow(gameState, resultThrow);

        const currentPlayer = gameState.playerStates.find((p) => p.playerId === gameState.currentPlayerId);
        if (currentPlayer) {
            gameState.currentTurn.endScore = currentPlayer.score;
        }

        if (resultThrow.isWin) {
            gameState.status = "completed";
            gameState.winnerId = gameState.currentPlayerId;
            gameState.endedAt = dbThrow.timestamp.getTime();
            break;
        }
    }

    // 5) Sync status with DB when needed
    if (match.status === "completed" && gameState.status !== "completed") {
        gameState.status = "completed";
        gameState.winnerId = match.winnerId || undefined;
    } else if (match.status === "aborted") {
        gameState.status = "aborted";
        gameState.winnerId = undefined;
        gameState.endedAt = match.endedAt ? match.endedAt.getTime() : gameState.endedAt;
    } else if (match.status === "setup") {
        gameState.status = "setup";
    }

    return gameState;
}
