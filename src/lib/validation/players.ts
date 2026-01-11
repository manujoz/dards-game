import { z } from "zod";

const AVATAR_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;

export const playerSchema = z.object({
    nickname: z
        .string()
        .min(2, "El apodo debe tener al menos 2 caracteres")
        .max(20, "El apodo debe tener como máximo 20 caracteres")
        .regex(/^[a-zA-Z0-9_-]+$/, "El apodo solo puede contener letras, números, guiones bajos y guiones"),
    avatarUrl: z
        .union([z.string().url("URL de avatar inválida"), z.string().regex(AVATAR_DATA_URL_REGEX, "Imagen de avatar inválida"), z.literal("")])
        .optional(),
});

export type PlayerInput = z.infer<typeof playerSchema>;
