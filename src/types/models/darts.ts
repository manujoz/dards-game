// Domain Models for Darts Game

export type GameId = "x01" | "cricket" | "round_the_clock" | "high_score" | "shanghai" | "killer" | "halve_it";

export type Multiplier = 0 | 1 | 2 | 3;

export interface Hit {
    segment: number; // 1-20, 25 (Bull), 0 (Miss)
    multiplier: Multiplier;
}

export interface Throw {
    hit: Hit;
    points: number; // Calculated points for this throw
    isBust: boolean; // If this throw caused a bust
    isWin: boolean; // If this throw won the game
    isValid: boolean; // If the throw counted towards the game goals (e.g. correct number in Shanghai)
    timestamp: number;
}

export interface Player {
    id: string; // UUID
    name: string;
    avatarUrl?: string; // Optional
    email?: string;
    isGuest?: boolean;
}

// Game-specific configurations

export type TeamMode = "single" | "team";

export interface BaseGameConfig {
    teamMode: TeamMode;
    maxRounds?: number;
}

export type X01StartScore = 301 | 501 | 701 | 901;
export type X01CheckMode = "straight" | "double" | "master";

export interface X01Config extends BaseGameConfig {
    type: "x01";
    startScore: X01StartScore;
    inMode: X01CheckMode;
    outMode: X01CheckMode;
}

export type CricketMode = "standard" | "cut_throat";

export interface CricketConfig extends BaseGameConfig {
    type: "cricket";
    mode: CricketMode;
    numbers: number[]; // [20, 19, 18, 17, 16, 15, 25] by default
}

export type RoundTheClockMode = "singles" | "doubles" | "triples";

export interface RoundTheClockConfig extends BaseGameConfig {
    type: "round_the_clock";
    mode: RoundTheClockMode;
    startNumber: number;
    endNumber: number | 25; // 25 for Bull
}

export interface HighScoreConfig extends BaseGameConfig {
    type: "high_score";
    rounds: number;
}

export interface ShanghaiConfig extends BaseGameConfig {
    type: "shanghai";
    rounds: number; // 7
    startNumber: number; // 1
}

export interface KillerConfig extends BaseGameConfig {
    type: "killer";
    lives: number;
    perPlayerLives: boolean; // true: each player has lives, false: team pool
    selfSuicide: boolean;
}

export interface HalveItConfig extends BaseGameConfig {
    type: "halve_it";
    targets: string[]; // encoded targets, e.g. "20", "D7", "T10"
}

export type GameConfig = X01Config | CricketConfig | RoundTheClockConfig | HighScoreConfig | ShanghaiConfig | KillerConfig | HalveItConfig;

// Variants helper type (union of all specific mode strings)
export type GameVariant = X01StartScore | CricketMode | RoundTheClockMode | string;

// State Tracking

export type GameStatus = "setup" | "active" | "completed" | "aborted";

// Stats Definitions
export interface X01PlayerStats {
    ppd: number; // Points Per Dart
    first9Average?: number;
    checkoutPercent?: number;
    highestTurn?: number;
}

export interface CricketPlayerStats {
    mpr: number; // Marks Per Round
    marks: Record<number, number>; // segment -> count (0-3 or more if scoring)
    closedNumbers: number[]; // List of numbers this player has closed
    score: number; // Points scored
}

export interface KillerStats {
    lives: number;
    isKiller: boolean;
    assignedNumber: number;
}

export interface RoundTheClockStats {
    target: number;
}

export type PlayerStats = X01PlayerStats | CricketPlayerStats | KillerStats | RoundTheClockStats | Record<string, unknown>;

export interface PlayerState {
    playerId: string;
    score: number; // General score used for display sorting or main metric
    rank?: number; // Final rank if finished
    stats: PlayerStats;
}

export interface Turn {
    playerId: string;
    roundIndex: number; // 1-based
    throws: Throw[];
    startScore: number;
    endScore: number;
    isBust: boolean;
}

export interface GameState {
    id: string;
    gameId: GameId;
    config: GameConfig;
    status: GameStatus;

    // Players sequence
    players: Player[];
    playerStates: PlayerState[];

    // Progress
    currentRound: number;
    currentPlayerId: string;
    currentTurn: Turn; // The turn currently in progress (mutable inputs)

    // History
    history: Turn[]; // Completed turns

    winnerId?: string;
    startedAt?: number;
    endedAt?: number;
}

// Scoreboard / UI Types

export interface ScoreboardCell {
    label?: string;
    value: string | number;
    highlight?: boolean;
}

/**
 * Represents a row in the scoreboard (one per player)
 */
export interface ScoreboardRow {
    playerId: string;
    playerName: string;
    rank?: number;
    score: number | string; // Main score to display
    active: boolean; // Is currently throwing

    // Detailed columns usually for Round history or specific marks
    details: ScoreboardCell[];

    // Game specific visual data (e.g. Cricket marks matrix)
    marks?: Record<string, number>; // segment -> count
}

/**
 * Standardized structure for displaying game progress
 */
export interface Scoreboard {
    headers: string[]; // Column headers
    rows: ScoreboardRow[];
    // Useful logic hints for UI
    gameType: GameId;
    roundIndicator: string; // "Round 5/10" or "Round 5"
}

// Calibration Types

export interface CalibrationConfig {
    centerX: number;
    centerY: number;
    scale: number;
    rotation: number;
    aspectRatio?: number;
}
