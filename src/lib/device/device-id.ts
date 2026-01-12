import "client-only";

const DEVICE_ID_STORAGE_KEY = "dards_device_id";

let sessionDeviceId: string | null = null;

function isUuid(value: string): boolean {
    // RFC 4122 (version 1-5). We generate v4, but accept any valid UUID.
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function bytesToHex(bytes: Uint8Array): string {
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) {
        out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
}

function generateUuidV4FromRandomValues(cryptoObj: Crypto): string {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);

    // Per RFC 4122:
    // - set version to 4 (0100)
    // - set variant to 10xx
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytesToHex(bytes);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateUuidV4(): string {
    const cryptoObj = globalThis.crypto;

    if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
        return cryptoObj.randomUUID();
    }

    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
        return generateUuidV4FromRandomValues(cryptoObj);
    }

    // Ultimate fallback for very old runtimes.
    // Not cryptographically secure, but keeps the app functional.
    const random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        .toString(16)
        .padStart(12, "0");
    const time = Date.now().toString(16).padStart(12, "0");
    const hex = (time + random).padEnd(32, "0").slice(0, 32);

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function tryReadFromLocalStorage(): string | null {
    try {
        const value = globalThis.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (typeof value === "string" && isUuid(value)) {
            return value;
        }
        return null;
    } catch {
        return null;
    }
}

function tryWriteToLocalStorage(deviceId: string): void {
    try {
        globalThis.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    } catch {
        // localStorage might be denied/unavailable (privacy mode, blocked, etc.).
        // In that case, we silently fallback to session-only stability.
    }
}

/**
 * Returns a stable device identifier for this browser.
 *
 * - Prefers persisted `localStorage` under a stable key.
 * - Uses `crypto.randomUUID()` when available, with a secure fallback.
 * - If `localStorage` is not available, returns a stable UUID for the session (module cache).
 */
export function getOrCreateDeviceId(): string {
    if (sessionDeviceId) {
        return sessionDeviceId;
    }

    // Even though this is client-only, keep it robust against accidental server execution.
    if (typeof window === "undefined") {
        sessionDeviceId = generateUuidV4();
        return sessionDeviceId;
    }

    const existing = tryReadFromLocalStorage();
    if (existing) {
        sessionDeviceId = existing;
        return sessionDeviceId;
    }

    const created = generateUuidV4();
    tryWriteToLocalStorage(created);

    sessionDeviceId = created;
    return sessionDeviceId;
}
