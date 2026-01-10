import { z } from "zod";

export const playerSchema = z.object({
    nickname: z
        .string()
        .min(2, "Nickname must be at least 2 characters")
        .max(20, "Nickname must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Nickname can only contain letters, numbers, underscores and hyphens"),
    avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export type PlayerInput = z.infer<typeof playerSchema>;
