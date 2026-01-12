export const CONTROLLER_LEASE_TTL_MS = 60_000;

export function nextLeaseUntil(now: Date): Date {
    return new Date(now.getTime() + CONTROLLER_LEASE_TTL_MS);
}

export function isLockValid(now: Date, leaseUntil?: Date | null): boolean {
    if (!leaseUntil) return false;
    return leaseUntil.getTime() > now.getTime();
}

export function canClaimLock(now: Date, leaseUntil?: Date | null): boolean {
    if (!leaseUntil) return true;
    return leaseUntil.getTime() <= now.getTime();
}
