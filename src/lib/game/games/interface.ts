import { GameConfig, GameState, Hit, Player, Scoreboard, Throw } from "@/types/models/darts";

export interface GameLogic {
    /**
     * Initializes the game state statistics and scores for players.
     * Returns a partial GameState merging into the default initialization.
     */
    init(config: GameConfig, players: Player[]): Partial<GameState>;

    /**
     * Processes a hit and returns the calculated Throw result.
     *
     * IMPORTANT: This method is responsibly for calculating the points, validity,
     * bust status, and win status of the throw.
     *
     * For games with complex state (like Cricket marks), this method is expected
     * to mutate the `state` object passed as argument directly to update
     * player statistics, OR relies on the GameEngine to handle standard scoring
     * via the returned `Throw` object points.
     */
    processThrow(state: GameState, hit: Hit): Throw;

    /**
     * Generates the Scoreboard for the UI based on the current state and game rules.
     */
    getScoreboard(state: GameState): Scoreboard;
}
