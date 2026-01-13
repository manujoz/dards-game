/**
 * Implementación pura de ELO para rankings.
 *
 * Phase 4 (Step 4.1 y 4.2):
 * - Multi-jugador (winner-only): se modela como ganador vs cada perdedor.
 * - Equipos: si existe teamId, se calcula rating de equipo como la media de sus miembros
 *   y se aplica el mismo delta a cada miembro del equipo.
 *
 * NOTA (Step 4.3): el rating global "Todos" se definirá como:
 * - gameId = "all"
 * - variantKey = "__all__"
 *
 * La integración real (actualizar también ese rating al finalizar partidas) se hará en Phase 5.
 */

export const GAME_ID_ALL = "all" as const;
export const VARIANT_KEY_ALL = "__all__" as const;

const ELO_SCALE = 400;

export interface EloCompetitor {
    playerId: string;
    ratingElo: number;
    matchesPlayed: number;
    teamId?: string | null;
}

export interface EloUpdate {
    playerId: string;
    oldRatingElo: number;
    newRatingElo: number;
    delta: number;
}

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`ELO: '${fieldName}' debe ser un string no vacío.`);
    }
}

function assertFiniteNumber(value: unknown, fieldName: string): asserts value is number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`ELO: '${fieldName}' debe ser un número finito.`);
    }
}

function assertNonNegativeInt(value: unknown, fieldName: string): asserts value is number {
    assertFiniteNumber(value, fieldName);
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`ELO: '${fieldName}' debe ser un entero >= 0.`);
    }
}

function validateCompetitors(competitors: EloCompetitor[]): void {
    const seen = new Set<string>();

    for (const competitor of competitors) {
        assertNonEmptyString(competitor.playerId, "playerId");
        assertFiniteNumber(competitor.ratingElo, "ratingElo");
        assertNonNegativeInt(competitor.matchesPlayed, "matchesPlayed");

        if (seen.has(competitor.playerId)) {
            // Preferimos fallar pronto: duplicar jugadores haría el resultado ambiguo.
            throw new Error(`ELO: playerId duplicado '${competitor.playerId}'.`);
        }
        seen.add(competitor.playerId);
    }
}

/**
 * Expected score clásico.
 *
 * $$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$$
 */
function expectedScore(ratingA: number, ratingB: number): number {
    const exponent = (ratingB - ratingA) / ELO_SCALE;
    return 1 / (1 + Math.pow(10, exponent));
}

/**
 * K dinámico por tramos (simple, determinista y fácil de razonar):
 * - 0..10 partidas: K=40 (rápida convergencia para nuevos jugadores)
 * - 11..30 partidas: K=24
 * - 31+ partidas: K=16 (más estable)
 */
function kFactor(matchesPlayed: number): number {
    if (matchesPlayed <= 10) return 40;
    if (matchesPlayed <= 30) return 24;
    return 16;
}

/**
 * Redondeo de rating a entero.
 *
 * Decisión: usamos `Math.round` (round half away from zero) porque:
 * - es estable/determinista
 * - minimiza el sesgo sistemático vs floor/ceil
 */
function roundRating(value: number): number {
    return Math.round(value);
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
}

function sortedByPlayerId<T extends { playerId: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.playerId.localeCompare(b.playerId));
}

function buildZeroDeltaMap(competitors: EloCompetitor[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const c of competitors) {
        map.set(c.playerId, 0);
    }
    return map;
}

function toUpdates(competitors: EloCompetitor[], deltasRaw: Map<string, number>): EloUpdate[] {
    const sorted = sortedByPlayerId(competitors);

    return sorted.map((c) => {
        const rawDelta = deltasRaw.get(c.playerId) ?? 0;
        const oldRating = c.ratingElo;
        const newRating = roundRating(oldRating + rawDelta);

        return {
            playerId: c.playerId,
            oldRatingElo: oldRating,
            newRatingElo: newRating,
            delta: newRating - oldRating,
        };
    });
}

function computeFreeForAllWinnerOnly(params: { competitors: EloCompetitor[]; winnerPlayerId: string }): EloUpdate[] {
    const competitorsById = new Map(params.competitors.map((c) => [c.playerId, c] as const));
    const winner = competitorsById.get(params.winnerPlayerId);
    if (!winner) return [];

    const losers = sortedByPlayerId(params.competitors.filter((c) => c.playerId !== winner.playerId));
    if (losers.length === 0) return [];

    const deltasRaw = buildZeroDeltaMap(params.competitors);

    for (const loser of losers) {
        const averageMatchesPlayed = Math.round((winner.matchesPlayed + loser.matchesPlayed) / 2);
        const k = kFactor(averageMatchesPlayed);
        const eWinner = expectedScore(winner.ratingElo, loser.ratingElo);

        // Winner-only: ganador siempre S=1, perdedor siempre S=0.
        const deltaWinner = k * (1 - eWinner);
        const deltaLoser = -deltaWinner;

        deltasRaw.set(winner.playerId, (deltasRaw.get(winner.playerId) ?? 0) + deltaWinner);
        deltasRaw.set(loser.playerId, (deltasRaw.get(loser.playerId) ?? 0) + deltaLoser);
    }

    return toUpdates(params.competitors, deltasRaw);
}

function computeTeamsWinnerOnly(params: { competitors: EloCompetitor[]; winnerPlayerId: string }): EloUpdate[] {
    const winner = params.competitors.find((c) => c.playerId === params.winnerPlayerId);
    if (!winner) return [];

    // Si hay equipos, exigimos que TODOS tengan teamId válido (string no vacío).
    const teamIdValues: string[] = [];
    for (const c of params.competitors) {
        if (typeof c.teamId !== "string" || c.teamId.trim().length === 0) return [];
        teamIdValues.push(c.teamId);
    }

    const winnerTeamId = winner.teamId;
    if (!winnerTeamId) return [];

    const teams = new Map<string, EloCompetitor[]>();
    for (const c of params.competitors) {
        const list = teams.get(c.teamId as string);
        if (list) {
            list.push(c);
        } else {
            teams.set(c.teamId as string, [c]);
        }
    }

    const loserTeamIds = Array.from(teams.keys())
        .filter((teamId) => teamId !== winnerTeamId)
        .sort((a, b) => a.localeCompare(b));

    // Caso degenerado: no hay rivales.
    if (loserTeamIds.length === 0) return [];

    const winnerTeamMembers = teams.get(winnerTeamId);
    if (!winnerTeamMembers || winnerTeamMembers.length === 0) return [];

    const winnerTeamRating = mean(winnerTeamMembers.map((m) => m.ratingElo));
    const winnerTeamMatches = mean(winnerTeamMembers.map((m) => m.matchesPlayed));

    const deltasRaw = buildZeroDeltaMap(params.competitors);

    for (const loserTeamId of loserTeamIds) {
        const loserTeamMembers = teams.get(loserTeamId);
        if (!loserTeamMembers || loserTeamMembers.length === 0) continue;

        const loserTeamRating = mean(loserTeamMembers.map((m) => m.ratingElo));
        const loserTeamMatches = mean(loserTeamMembers.map((m) => m.matchesPlayed));

        // K común para el matchup equipo-vs-equipo: usamos la media de experiencia de ambos equipos.
        const averageMatchesPlayed = Math.round((winnerTeamMatches + loserTeamMatches) / 2);
        const k = kFactor(averageMatchesPlayed);

        const eWinnerTeam = expectedScore(winnerTeamRating, loserTeamRating);
        const deltaWinnerTeam = k * (1 - eWinnerTeam);
        const deltaLoserTeam = -deltaWinnerTeam;

        // Aplicamos el mismo delta a todos los miembros del equipo.
        for (const member of winnerTeamMembers) {
            deltasRaw.set(member.playerId, (deltasRaw.get(member.playerId) ?? 0) + deltaWinnerTeam);
        }

        for (const member of loserTeamMembers) {
            deltasRaw.set(member.playerId, (deltasRaw.get(member.playerId) ?? 0) + deltaLoserTeam);
        }
    }

    return toUpdates(params.competitors, deltasRaw);
}

export function computeEloUpdatesWinnerOnly(params: { competitors: EloCompetitor[]; winnerPlayerId?: string | null }): EloUpdate[] {
    const { competitors, winnerPlayerId } = params;

    if (!winnerPlayerId) return [];
    if (competitors.length < 2) return [];

    validateCompetitors(competitors);

    const hasTeams = competitors.some((c) => c.teamId !== null && c.teamId !== undefined);

    if (hasTeams) {
        return computeTeamsWinnerOnly({ competitors, winnerPlayerId });
    }

    return computeFreeForAllWinnerOnly({ competitors, winnerPlayerId });
}

export const __testing = {
    expectedScore,
    kFactor,
    roundRating,
};
