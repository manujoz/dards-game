export interface MatchDetailsThrow {
    id: string;
    matchId: string;
    participantId: string;
    roundIndex: number;
    throwIndex: number;
    segment: number;
    multiplier: number;
    points: number;
    isBust: boolean;
    isWin: boolean;
    isValid: boolean;
    timestamp: Date;
}

export interface MatchDetailsRoundGroup {
    roundIndex: number;
    displayRoundIndex: number;
    throwIds: string[];
}

export function isZeroBasedRoundIndex(throws: MatchDetailsThrow[]): boolean {
    if (throws.length === 0) return false;

    let min = Number.POSITIVE_INFINITY;
    for (const t of throws) {
        if (t.roundIndex < min) min = t.roundIndex;
    }

    return min === 0;
}

export function getDisplayRoundIndex(roundIndex: number, isZeroBased: boolean): number {
    return isZeroBased ? roundIndex + 1 : roundIndex;
}

export function groupThrowsByRound(throws: MatchDetailsThrow[]): MatchDetailsRoundGroup[] {
    const sorted = [...throws].sort((a, b) => {
        if (a.roundIndex !== b.roundIndex) return a.roundIndex - b.roundIndex;
        if (a.throwIndex !== b.throwIndex) return a.throwIndex - b.throwIndex;
        return a.timestamp.getTime() - b.timestamp.getTime();
    });

    const zeroBased = isZeroBasedRoundIndex(sorted);

    const map = new Map<number, string[]>();
    for (const t of sorted) {
        const existing = map.get(t.roundIndex);
        if (existing) {
            existing.push(t.id);
            continue;
        }

        map.set(t.roundIndex, [t.id]);
    }

    return [...map.entries()]
        .sort(([a], [b]) => a - b)
        .map(([roundIndex, throwIds]) => ({
            roundIndex,
            displayRoundIndex: getDisplayRoundIndex(roundIndex, zeroBased),
            throwIds,
        }));
}
