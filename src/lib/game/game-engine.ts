import { GameConfig, GameState, Player, PlayerState, Throw, Turn, X01Config } from "@/types/models/darts";

/**
 * Creates the initial state for the scoreboard/players
 */
function createInitialPlayerStates(players: Player[], config: GameConfig): PlayerState[] {
    let startScore = 0;
    if (config.type === "x01") {
        startScore = (config as X01Config).startScore;
    }
    // Cricket, Shanghai, etc usually start at 0 or specific targets.
    // We initialize to 0 for others for now.

    return players.map((p) => ({
        playerId: p.id,
        score: startScore,
        stats: {}, // Generic init
    }));
}

/**
 * Game Engine: Manages the flow of the match (Players -> Rounds -> Turns).
 * Pure functions that return a new state (immutability).
 */
export function getCurrentPlayerState(state: GameState): PlayerState {
    const ps = state.playerStates.find((p) => p.playerId === state.currentPlayerId);
    if (!ps) throw new Error("No se ha encontrado el estado del jugador actual");
    return ps;
}

export const GameEngine = {
    /**
     * Initialize a new game state
     */
    init(players: Player[], config: GameConfig): GameState {
        if (players.length === 0) {
            throw new Error("Se requiere al menos un jugador");
        }

        const firstPlayer = players[0];
        const playerStates = createInitialPlayerStates(players, config);

        const initialTurn: Turn = {
            playerId: firstPlayer.id,
            roundIndex: 1,
            throws: [],
            startScore: playerStates[0].score,
            endScore: playerStates[0].score,
            isBust: false,
        };

        return {
            id: crypto.randomUUID(),
            gameId: config.type, // types match union
            config,
            status: "active",
            players,
            playerStates,
            currentRound: 1,
            currentPlayerId: firstPlayer.id,
            currentTurn: initialTurn,
            history: [],
            startedAt: Date.now(),
        };
    },

    /**
     * Advance to the next turn/player
     */
    nextTurn(state: GameState): GameState {
        // strict copy
        const newState = structuredClone(state);

        // 1. Archive current turn
        newState.history.push(newState.currentTurn);

        // 2. Determine next player
        const currentPlayerIndex = newState.players.findIndex((p) => p.id === newState.currentPlayerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % newState.players.length;

        // 3. Determine if round increments (if we wrapped to player 0)
        if (nextPlayerIndex === 0) {
            newState.currentRound++;
        }

        const nextPlayer = newState.players[nextPlayerIndex];
        newState.currentPlayerId = nextPlayer.id;

        // 4. Create new empty turn
        // Need current score of next player for startScore
        const nextPlayerState = newState.playerStates.find((ps) => ps.playerId === nextPlayer.id);
        const startScore = nextPlayerState ? nextPlayerState.score : 0;

        newState.currentTurn = {
            playerId: nextPlayer.id,
            roundIndex: newState.currentRound,
            throws: [],
            startScore: startScore,
            endScore: startScore,
            isBust: false,
        };

        return newState;
    },

    /**
     * Add a throw to the current turn
     * NOTE: logic for calculating points/bust/win is OUTSIDE this engine (in GameRules).
     * This method assumes `throwData` is fully calculated.
     */
    addThrow(state: GameState, throwData: Throw): GameState {
        const newState = structuredClone(state);

        // Add throw
        newState.currentTurn.throws.push(throwData);

        // Update turn metadata based on the throw (if provided)
        // Note: The specific game rules should handle updating PlayerState score separately
        // or we assume the caller updates state before passing, or we need a reducer.
        // For this engine, we strictly manage the container.
        // However, we should propagate bust/win status to the Turn if applies.
        if (throwData.isBust) {
            newState.currentTurn.isBust = true;
            // Reset endScore to startScore on bust
            newState.currentTurn.endScore = newState.currentTurn.startScore;
        } else {
            // Ideally we update endScore. But X01 subtracts, others add.
            // We'll leave score calc to the rules.
            // If the throw has `points`, we *could* blindly apply it, but polarity varies.
            // We will rely on Phase 8 to refine the score update mechanism.
        }

        // Check for win condition
        if (throwData.isWin) {
            newState.status = "completed";
            newState.winnerId = newState.currentPlayerId;
            newState.endedAt = Date.now();
        }

        return newState;
    },

    /**
     * Undo the last action.
     * - If current turn has throws, remove last throw.
     * - If current turn is empty, go back to previous turn (and remove its last throw).
     */
    undo(state: GameState): GameState {
        const newState = structuredClone(state);

        // Case 1: Current turn has throws
        if (newState.currentTurn.throws.length > 0) {
            const removedThrow = newState.currentTurn.throws.pop();
            if (removedThrow?.isBust) {
                newState.currentTurn.isBust = false;
                // We cannot easily restore endScore without re-calculating from previous throws.
                // This is a limitation of not having the reducer here.
                // However, usually "Undo" implies re-evaluating state from history.
            }
            // Reset win if needed
            if (newState.status === "completed") {
                newState.status = "active";
                newState.winnerId = undefined;
                newState.endedAt = undefined;
            }
            return newState;
        }

        // Case 2: Current turn is empty, try to go back to previous turn
        if (newState.history.length === 0) {
            // Nothing to undo (start of game)
            return newState;
        }

        const prevTurn = newState.history.pop();
        if (!prevTurn) return newState; // should not happen

        // Restore previous turn as current
        newState.currentTurn = prevTurn;
        newState.currentPlayerId = prevTurn.playerId;
        newState.currentRound = prevTurn.roundIndex;

        // Also remove the last throw of that restored turn (Combined Undo)
        // Recursive call would be elegant but strict state control is safer
        if (newState.currentTurn.throws.length > 0) {
            const removed = newState.currentTurn.throws.pop();
            if (removed?.isBust) newState.currentTurn.isBust = false;
        }

        // Since we went back a turn, we are definitely 'active'
        newState.status = "active";
        newState.winnerId = undefined;
        newState.endedAt = undefined;

        return newState;
    },

    /**
     * Checks if the turn is effectively complete (3 throws, bust, or win)
     */
    isTurnComplete(state: GameState): boolean {
        const { throws, isBust } = state.currentTurn;
        if (state.status === "completed") return true;
        if (isBust) return true;
        // Standard limit. Some games (Quadrathlon?) have different throw counts?
        // Darts is almost universally 3.
        // If we need variable throws, it should go in GameConfig.
        return throws.length >= 3;
    },

    /**
     * Reconstruct state from a history of turns.
     * Useful for loading from persistence or ensuring integrity.
     */
    reconstructState(history: Turn[], config: GameConfig, players: Player[]): GameState {
        // 1. Init baseline
        const state = this.init(players, config);

        // 2. We can't just set history because 'init' creates an empty turn.
        // If we have a full history, we assume the game is potentially in progress or done.

        // Simplest approach: "Play" the history?
        // But 'undo' logic relies on popping.
        // If we have the full list of PAST turns (history),
        // we need to set the state to be "After the last turn in history".

        if (history.length === 0) {
            return state;
        }

        state.history = [...history]; // Set completed turns

        // 3. Determine pointers based on last turn
        const lastTurn = history[history.length - 1];

        // Logic to find WHO is next.
        // Index of last player
        const lastPlayerIndex = state.players.findIndex((p) => p.id === lastTurn.playerId);
        const nextPlayerIndex = (lastPlayerIndex + 1) % state.players.length;
        let nextRound = lastTurn.roundIndex;

        if (nextPlayerIndex === 0) {
            nextRound++;
        }

        const nextPlayer = state.players[nextPlayerIndex];
        state.currentPlayerId = nextPlayer.id;
        state.currentRound = nextRound;

        // 4. Create correct startScore for the active turn?
        // reconstructState typically needs to replay to get scores.
        // If we don't have reducer logic, we rely on the lastTurn.endScore of the previous time this player played?
        // If it's the first time for this player in a new round (and not round 1), we look at their last turn.

        // Find last turn for nextPlayer
        // Iterate backwards
        const lastTurnForNextPlayer = [...history].reverse().find((t) => t.playerId === nextPlayer.id);

        let startScore = 0;
        // Init default again
        const pStatus = createInitialPlayerStates(players, config).find((p) => p.playerId === nextPlayer.id);
        if (pStatus) startScore = pStatus.score; // Default start

        if (lastTurnForNextPlayer) {
            startScore = lastTurnForNextPlayer.endScore;
        }

        // Update PlayerStates based on history?
        // Yes, we should likely update the playerStates to reflect the END of the history.
        // For each player, find their last turn and update their score.
        state.players.forEach((p) => {
            const userLastTurn = [...history].reverse().find((t) => t.playerId === p.id);
            const pState = state.playerStates.find((ps) => ps.playerId === p.id);
            if (userLastTurn && pState) {
                pState.score = userLastTurn.endScore;
            }
        });

        state.currentTurn = {
            playerId: nextPlayer.id,
            roundIndex: nextRound,
            throws: [],
            startScore: startScore,
            endScore: startScore,
            isBust: false,
        };

        return state;
    },
};
