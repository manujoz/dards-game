import { prisma } from "@/lib/db/prisma";
import { GameEngine } from "@/lib/game/game-engine";
import { getGameLogic } from "@/lib/game/games";
import { GameConfig, GameId, GameState, Hit, Player, TeamMode } from "@/types/models/darts";

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

export async function getMatchState(matchId: string): Promise<GameState | null> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            participants: {
                include: {
                    player: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            throws: {
                include: {
                    participant: {
                        include: {
                            player: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: "asc",
                },
            },
        },
    });

    if (!match) return null;

    // 1. Reconstruct Config
    let config: GameConfig;
    try {
        // `variant` stores the game config payload (JSON)
        config = JSON.parse(match.variant) as GameConfig;
    } catch (e) {
        console.error("No se ha podido interpretar la configuración de la partida", e);
        return null;
    }

    // Ensure `type` exists (older rows or mismatched payloads)
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

    // Merge teamMode from `format` if present
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

    // 2. Reconstruct Players (ordered)
    const players: Player[] = match.participants.map((p) => ({
        id: p.player.id,
        name: p.player.nickname, // assuming nickname is the name
        avatarUrl: p.player.avatarUrl || undefined,
        isGuest: false,
    }));

    // 3. Init Engine & Logic
    let gameState: GameState;
    try {
        gameState = GameEngine.init(players, config);
    } catch (e) {
        console.error("No se ha podido inicializar el motor", e);
        return null;
    }

    // Restore ID and other DB metadata
    gameState.id = match.id;
    // Status might be "active" or "completed" in DB.
    // We trust the Engine derivation mostly, but if DB says completed, we should respect it?
    // Actually, replaying the throws should naturally lead to "completed" status if a winning throw exists.

    const gameLogic = getGameLogic(config.type);

    // 4. Replay Throws
    // IMPORTANT: Turn advancement is user-confirmed. To restore accurately after refresh,
    // we reconstruct turns from persisted (roundIndex, player) rather than auto-advancing after 3 darts.
    let currentTurnKey: string | null = `${gameState.currentTurn.roundIndex}:${gameState.currentTurn.playerId}`;

    for (const dbThrow of match.throws) {
        const playerId = dbThrow.participant?.player?.id;
        if (!playerId) {
            console.error("Al tiro le falta la relación participant.player", dbThrow.id);
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

    // Final generic sync
    if (match.status === "completed" && gameState.status !== "completed") {
        // Force completion if DB says so but replay didn't (e.g. manual abort)
        gameState.status = "completed";
        gameState.winnerId = match.winnerId || undefined;
    }

    return gameState;
}
