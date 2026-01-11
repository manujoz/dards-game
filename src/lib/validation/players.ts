import { z } from "zod";

const AVATAR_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;

export const playerSchema = z.object({
    nickname: z
        .string()
        .min(2, "Nickname must be at least 2 characters")
        .max(20, "Nickname must be at most 20 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Nickname can only contain letters, numbers, underscores and hyphens"),
    avatarUrl: z
        .union([z.string().url("Invalid avatar URL"), z.string().regex(AVATAR_DATA_URL_REGEX, "Invalid avatar image"), z.literal("")])
        .optional(),
});

export type PlayerInput = z.infer<typeof playerSchema>;
