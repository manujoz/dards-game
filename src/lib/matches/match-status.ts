export function deriveMatchStatus(status: string, hasWinner: boolean): string {
    if (hasWinner) {
        return "completed";
    }

    return status;
}

export function deriveWinnerId(winnerId: string | null | undefined, winningThrowPlayerId: string | null | undefined): string | undefined {
    if (winnerId) {
        return winnerId;
    }

    if (winningThrowPlayerId) {
        return winningThrowPlayerId;
    }

    return undefined;
}
