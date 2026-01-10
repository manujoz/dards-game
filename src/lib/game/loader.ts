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
        console.error("Failed to parse match config", e);
        return null;
    }

    // Ensure `type` exists (older rows or mismatched payloads)
    if (!toGameId((config as { type?: string }).type ?? "")) {
        const fallbackType = toGameId(match.gameId);
        if (!fallbackType) {
            console.error("Invalid match.gameId", match.gameId);
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
        console.error("Failed to init engine", e);
        return null;
    }

    // Restore ID and other DB metadata
    gameState.id = match.id;
    // Status might be "active" or "completed" in DB.
    // We trust the Engine derivation mostly, but if DB says completed, we should respect it?
    // Actually, replaying the throws should naturally lead to "completed" status if a winning throw exists.

    const gameLogic = getGameLogic(config.type);

    // 4. Replay Throws
    for (const dbThrow of match.throws) {
        const multiplier = toHitMultiplier(dbThrow.multiplier);

        // Map DB Throw to Hit (input for processThrow)
        const hit: Hit = {
            segment: dbThrow.segment,
            multiplier,
        };

        // Process Throw (IMPORTANT: This mutates gameState player scores internally for 'x01' etc)
        const resultThrow = gameLogic.processThrow(gameState, hit);

        // Override result values with DB values if necessary to ensure exact history match?
        // Ideally they match. If we changed logic, using DB values for 'points' might be safer for history preservation,
        // but 'processThrow' is needed to mutate the state (score) correctly for the current code version.
        // Let's trust processThrow for state mutation, but maybe use DB for history consistency?
        // Actually, let's use the result from processThrow to be consistent with current code instructions.

        // Force timestamp from DB to preserve timeline
        resultThrow.timestamp = dbThrow.timestamp.getTime();

        // Add to Engine State (history/turn management)
        gameState = GameEngine.addThrow(gameState, resultThrow);

        // Update Turn End Score (Engine doesn't do this automatically for standard throws, only busts)
        const currentPlayer = gameState.playerStates.find((p) => p.playerId === gameState.currentPlayerId);
        if (currentPlayer) {
            gameState.currentTurn.endScore = currentPlayer.score;
        }

        // Automatic Turn Switching Logic
        // Replicate the client-side auto-switch rules
        if (resultThrow.isWin) {
            gameState.status = "completed";
            gameState.winnerId = gameState.currentPlayerId;
            gameState.endedAt = dbThrow.timestamp.getTime(); // Use DB time
            break; // Stop processing if won
        } else if (gameState.currentTurn.throws.length >= 3 || resultThrow.isBust) {
            // Check if this is the generic end of turn.
            // We only switch turn if the match continued or if there are more throws in DB.
            // But 'nextTurn' creates a new empty turn.
            // If we are at the end of the list, we should still be in "waiting for next turn" state
            // unless the match ended.

            // If this is the last throw in DB, and match.status is active,
            // we should probably switch turn so the UI shows the NEXT player ready to throw.
            // If match is completed, we don't need to switch.

            if (match.status !== "completed") {
                gameState = GameEngine.nextTurn(gameState);
            } else {
                // Even if completed, if this throw didn't win, maybe someone resigned?
                // Assuming standard flow:
                gameState = GameEngine.nextTurn(gameState);
            }
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
