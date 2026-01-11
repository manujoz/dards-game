export type RuleGameSlug = "x01" | "cricket" | "round-the-clock" | "high-score" | "shanghai" | "killer" | "halve-it";

export interface RuleGameDefinition {
    slug: RuleGameSlug;
    title: string;
    description: string;
    docFileName: string;
}

export const RULE_GAMES: RuleGameDefinition[] = [
    {
        slug: "x01",
        title: "X01",
        description: "El clásico de cuenta atrás (301/501/701/901) con variantes de entrada y salida.",
        docFileName: "x01.md",
    },
    {
        slug: "cricket",
        title: "Cricket",
        description: "Cierra 15–20 + Bull y puntúa cuando los rivales aún no han cerrado el número.",
        docFileName: "cricket.md",
    },
    {
        slug: "round-the-clock",
        title: "Round the Clock",
        description: "Avanza del 1 al 20 (y opcionalmente Bull) en orden secuencial.",
        docFileName: "round-the-clock.md",
    },
    {
        slug: "high-score",
        title: "High Score",
        description: "Suma tantos puntos como puedas durante un número fijo de rondas.",
        docFileName: "high-score.md",
    },
    {
        slug: "shanghai",
        title: "Shanghai",
        description: "Puntúa en el número activo por ronda y busca el combo de Shanghai en un turno.",
        docFileName: "shanghai.md",
    },
    {
        slug: "killer",
        title: "Killer",
        description: "Conviértete en Killer con un doble y elimina rivales reduciendo sus vidas.",
        docFileName: "killer.md",
    },
    {
        slug: "halve-it",
        title: "Halve-It",
        description: "Cumple el objetivo de la ronda o tu puntuación se divide entre 2.",
        docFileName: "halve-it.md",
    },
];

export function getRuleGameBySlug(slug: string): RuleGameDefinition | undefined {
    return RULE_GAMES.find((game) => game.slug === slug);
}
