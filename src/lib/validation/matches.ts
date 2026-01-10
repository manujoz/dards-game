import { z } from "zod";

// --- Game Configurations ---

const teamModeSchema = z.enum(["single", "team"]);

const baseGameConfigSchema = z.object({
    teamMode: teamModeSchema,
    maxRounds: z.number().int().positive().optional(),
});

// X01
const x01ConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("x01"),
    startScore: z.union([z.literal(301), z.literal(501), z.literal(701), z.literal(901)]),
    inMode: z.enum(["straight", "double", "master"]),
    outMode: z.enum(["straight", "double", "master"]),
});

// Cricket
const cricketConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("cricket"),
    mode: z.enum(["standard", "cut_throat"]),
    numbers: z.array(z.number().int()).default([20, 19, 18, 17, 16, 15, 25]),
});

// Round The Clock
const roundTheClockConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("round_the_clock"),
    mode: z.enum(["singles", "doubles", "triples"]),
});

// High Score
const highScoreConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("high_score"),
    targetScore: z.number().int().positive().default(1000), // Example specific config
});

// Shanghai
const shanghaiConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("shanghai"),
    startNumber: z.number().int().min(1).max(20).default(1),
});

// Killer
const killerConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("killer"),
    lives: z.number().int().positive().default(5),
    killMode: z.enum(["standard", "double_to_kill"]).default("double_to_kill"), // Assuming rule variations
});

// Halve It
const halveItConfigSchema = baseGameConfigSchema.extend({
    type: z.literal("halve_it"),
    rounds: z.array(z.string()).optional(), // specific targets like "20", "19", "Double", etc.
});

export const gameConfigSchema = z.discriminatedUnion("type", [
    x01ConfigSchema,
    cricketConfigSchema,
    roundTheClockConfigSchema,
    highScoreConfigSchema,
    shanghaiConfigSchema,
    killerConfigSchema,
    halveItConfigSchema,
]);

// --- Match Creation ---

export const createMatchSchema = z.object({
    gameId: z.enum(["x01", "cricket", "round_the_clock", "high_score", "shanghai", "killer", "halve_it"]),
    config: gameConfigSchema,
    playerIds: z.array(z.string().uuid()).min(1, "At least one player is required"),
    // Optional: Pre-defined teams (array of player ID arrays)
    teams: z.array(z.array(z.string().uuid())).optional(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type GameConfigInput = z.infer<typeof gameConfigSchema>;
