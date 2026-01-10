import { getCurrentPlayerState } from "@/lib/game/game-engine";
import { GameConfig, GameState, HalveItConfig, Hit, Multiplier, Player, Scoreboard, Throw } from "@/types/models/darts";
import { GameLogic } from "./interface";

export class HalveItGame implements GameLogic {
    init(config: GameConfig, players: Player[]): Partial<GameState> {
        return {
            playerStates: players.map((p) => ({
                playerId: p.id,
                score: 0,
                stats: {},
            })),
        };
    }

    processThrow(state: GameState, hit: Hit): Throw {
        const playerState = getCurrentPlayerState(state);
        const config = state.config as HalveItConfig;
        const targets = config.targets || ["20", "16", "D7", "14", "18", "T10", "25"];

        const targetStr = targets[(state.currentRound - 1) % targets.length];
        const { segment: targetSeg, multiplier: targetMult } = parseTarget(targetStr);

        let points = 0;
        let isValid = false;

        // Check Hit
        // For D/T prefix, multiplier must match. For pure number, assume Any?
        // Let's assume strict logic:
        // If targetMult is 0 (Any), then just segment match.
        // If targetMult > 0, strict match.
        const isHit = hit.segment === targetSeg && (targetMult === 0 || hit.multiplier === targetMult);

        if (isHit) {
            isValid = true;
            points = hit.segment * hit.multiplier;
            // In Halve-it, do multipliers count double points? Yes.
        }

        const throwsSoFar = state.currentTurn.throws;
        const isThirdThrow = throwsSoFar.length === 2;

        if (isThirdThrow) {
            const anyHitPrevious = throwsSoFar.some((t) => t.isValid);
            const anyHitCurrent = isValid;

            if (!anyHitPrevious && !anyHitCurrent) {
                const currentScore = playerState.score;
                const newScore = Math.floor(currentScore / 2);
                const penalty = currentScore - newScore;

                points = -penalty;
            }
        }

        return {
            hit,
            points, // Additive to score
            isBust: false,
            isWin: false,
            isValid,
            timestamp: Date.now(),
        };
    }

    getScoreboard(state: GameState): Scoreboard {
        const config = state.config as HalveItConfig;
        const targets = config.targets || ["20", "16", "D7", "14", "18", "T10", "25"];
        const targetStr = targets[(state.currentRound - 1) % targets.length] || "End";

        return {
            gameType: "halve_it",
            roundIndicator: `Round ${state.currentRound} (Target: ${targetStr})`,
            headers: ["Score"],
            rows: state.playerStates.map((ps) => {
                const player = state.players.find((p) => p.id === ps.playerId)!;
                return {
                    playerId: ps.playerId,
                    playerName: player.name,
                    score: ps.score,
                    active: state.currentPlayerId === ps.playerId,
                    details: [],
                };
            }),
        };
    }
}

function parseTarget(str: string): { segment: number; multiplier: Multiplier | 0 } {
    let s = str.toUpperCase();
    let mult: Multiplier | 0 = 0;

    if (s.startsWith("D")) {
        mult = 2;
        s = s.substring(1);
    } else if (s.startsWith("T")) {
        mult = 3;
        s = s.substring(1);
    }

    let seg = 0;
    if (s === "BULL" || s === "B" || s === "25") seg = 25;
    else seg = parseInt(s, 10);

    return { segment: seg, multiplier: mult };
}
