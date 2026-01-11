import { z } from "zod";

const NICKNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const loginAdminSchema = z.object({
    nickname: z
        .string()
        .trim()
        .min(2, "El apodo debe tener al menos 2 caracteres")
        .max(20, "El apodo debe tener como máximo 20 caracteres")
        .regex(NICKNAME_REGEX, "El apodo solo puede contener letras, números, guiones bajos y guiones"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72, "La contraseña debe tener como máximo 72 caracteres"),
});

export type LoginAdminInput = z.infer<typeof loginAdminSchema>;

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "La contraseña actual es obligatoria")
            .max(72, "La contraseña actual debe tener como máximo 72 caracteres"),
        newPassword: z
            .string()
            .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
            .max(72, "La nueva contraseña debe tener como máximo 72 caracteres"),
        confirmPassword: z
            .string()
            .min(6, "La confirmación debe tener al menos 6 caracteres")
            .max(72, "La confirmación debe tener como máximo 72 caracteres"),
    })
    .superRefine((data, ctx) => {
        if (data.newPassword !== data.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "Las contraseñas no coinciden",
            });
        }
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function isSafeReturnTo(value: string): boolean {
    const normalized = value.trim();

    if (!normalized.startsWith("/")) {
        return false;
    }

    if (normalized.startsWith("//")) {
        return false;
    }

    return true;
}

export function sanitizeReturnTo(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    return isSafeReturnTo(value) ? value.trim() : null;
}
