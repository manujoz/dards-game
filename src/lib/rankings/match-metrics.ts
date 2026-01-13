/**
 * Cálculo de métricas agregadas por participante a partir de throws.
 *
 * Diseñado para ser:
 * - Puro (sin Prisma ni DB)
 * - Determinista (misma entrada -> misma salida)
 * - Compatible con objetos Prisma por tipado estructural
 *
 * Notas de negocio (aprobadas):
 * - roundsPlayed = nº de valores roundIndex distintos en los throws del participante,
 *   contando throws válidos e inválidos (si no hay throws => 0).
 * - calculatePpd y calculateMpr devuelven 0 si el denominador es 0.
 * - X01 bust: si existe cualquier isBust=true en una ronda (participantId+roundIndex),
 *   entonces los puntos válidos de esa ronda cuentan como 0.
 */

export type MatchMetricsGameId = "x01" | "cricket" | string;

export interface MatchMetricsParticipant {
    id: string;
    playerId: string;
}

export interface MatchMetricsThrow {
    participantId: string;
    roundIndex: number;
    segment: number;
    multiplier: number;
    points: number;
    isBust: boolean;
    isValid: boolean;
}

export interface ParticipantMatchMetrics {
    participantId: string;
    playerId: string;
    dartsValid: number;
    pointsValid: number;
    roundsPlayed: number;
    marks?: number;
}

const CRICKET_MARK_SEGMENTS = new Set<number>([15, 16, 17, 18, 19, 20, 25]);

function isCricketMarkSegment(segment: number): boolean {
    return CRICKET_MARK_SEGMENTS.has(segment);
}

export function calculatePpd(pointsValid: number, dartsValid: number): number {
    if (dartsValid === 0) return 0;
    return pointsValid / dartsValid;
}

export function calculateMpr(marks: number, roundsPlayed: number): number {
    if (roundsPlayed === 0) return 0;
    return marks / roundsPlayed;
}

function groupThrowsByParticipant(throws: MatchMetricsThrow[]): Map<string, MatchMetricsThrow[]> {
    const map = new Map<string, MatchMetricsThrow[]>();

    for (const t of throws) {
        const list = map.get(t.participantId);
        if (list) {
            list.push(t);
        } else {
            map.set(t.participantId, [t]);
        }
    }

    return map;
}

function countDistinctRounds(throws: MatchMetricsThrow[]): number {
    if (throws.length === 0) return 0;

    const rounds = new Set<number>();
    for (const t of throws) {
        rounds.add(t.roundIndex);
    }

    return rounds.size;
}

function calculateX01PointsValid(throws: MatchMetricsThrow[]): number {
    // Regla aprobada: bust anula los puntos válidos de la ronda.
    // Agrupamos por roundIndex (dentro del participante).

    const byRound = new Map<number, MatchMetricsThrow[]>();
    for (const t of throws) {
        const list = byRound.get(t.roundIndex);
        if (list) {
            list.push(t);
        } else {
            byRound.set(t.roundIndex, [t]);
        }
    }

    let total = 0;

    for (const [, roundThrows] of byRound) {
        let hasBust = false;
        let roundValidPoints = 0;

        for (const t of roundThrows) {
            if (t.isBust) {
                hasBust = true;
            }

            if (t.isValid) {
                roundValidPoints += t.points;
            }
        }

        total += hasBust ? 0 : roundValidPoints;
    }

    return total;
}

function calculateDefaultPointsValid(throws: MatchMetricsThrow[]): number {
    let total = 0;

    for (const t of throws) {
        if (!t.isValid) continue;
        total += t.points;
    }

    return total;
}

function calculateDartsValid(throws: MatchMetricsThrow[]): number {
    let total = 0;

    for (const t of throws) {
        if (t.isValid) total += 1;
    }

    return total;
}

function calculateCricketMarks(throws: MatchMetricsThrow[]): number {
    let total = 0;

    for (const t of throws) {
        if (!t.isValid) continue;
        if (!isCricketMarkSegment(t.segment)) continue;
        total += t.multiplier;
    }

    return total;
}

/**
 * Calcula las métricas agregadas (tipo MatchResult) por participante.
 *
 * - Incluye siempre todos los participantes recibidos (aunque no tengan throws).
 * - El cálculo de marks solo aplica a cricket; para otros modos será undefined.
 */
export function calculateMatchMetricsByParticipant(params: {
    gameId: MatchMetricsGameId;
    participants: MatchMetricsParticipant[];
    throws: MatchMetricsThrow[];
}): ParticipantMatchMetrics[] {
    const { gameId, participants, throws } = params;

    const throwsByParticipant = groupThrowsByParticipant(throws);

    return participants.map((p) => {
        const myThrows = throwsByParticipant.get(p.id) ?? [];

        const dartsValid = calculateDartsValid(myThrows);
        const roundsPlayed = countDistinctRounds(myThrows);

        const pointsValid = gameId === "x01" ? calculateX01PointsValid(myThrows) : calculateDefaultPointsValid(myThrows);

        const base: ParticipantMatchMetrics = {
            participantId: p.id,
            playerId: p.playerId,
            dartsValid,
            pointsValid,
            roundsPlayed,
        };

        if (gameId === "cricket") {
            return {
                ...base,
                marks: calculateCricketMarks(myThrows),
            };
        }

        return base;
    });
}
