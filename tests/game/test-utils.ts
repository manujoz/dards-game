import { GameEngine } from "@/lib/game/game-engine";
import { GameLogic } from "@/lib/game/games/interface";
import { GameConfig, GameState, Hit, Multiplier, Player } from "@/types/models/darts";

export function createHit(segment: number, multiplier: Multiplier = 1): Hit {
    return { segment, multiplier };
}

export function createHits(hits: [number, Multiplier][]): Hit[] {
    return hits.map(([s, m]) => createHit(s, m));
}

export function createTestState(config: GameConfig, players: Player[]): GameState {
    return GameEngine.init(players, config);
}

/**
 * Simulates a turn by processing multiple hits.
 * Returns the final state after all hits are processed.
 */
export function simulateTurn(logic: GameLogic, state: GameState, hits: Hit[]): GameState {
    let currentState = state;
    for (const hit of hits) {
        const throwResult = logic.processThrow(currentState, hit);
        currentState = GameEngine.addThrow(currentState, throwResult);
        if (throwResult.isBust || throwResult.isWin) {
            break;
        }
    }
    return currentState;
}

export function mockPlayer(id: string = "p1", name: string = "Player"): Player {
    return { id, name };
}
