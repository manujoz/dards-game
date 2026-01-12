/**
 * Tipos de dominio para dispositivos.
 *
 * Nota: evitamos colisión nominal con el modelo Prisma `Device`.
 */

export type DeviceId = string; // UUID

export interface DeviceModel {
    id: DeviceId;
    name?: string | null;
    createdAt: Date;
    lastSeenAt: Date;
}
