/**
 * Política STRICT de “match contabilizable” para rankings.
 *
 * Solo se cuentan partidas con status "completed".
 * Se excluyen explícitamente "aborted" y cualquier otro estado.
 *
 * Nota: existe un caso conocido en el código donde pueden aparecer partidas "ongoing"
 * con throws ganadores (`Throw.isWin=true`) por desfases de estado; para rankings NO se cuentan.
 */
export const COUNTABLE_MATCH_STATUS = "completed" as const;

export function isCountableMatchStatus(status: string): boolean {
    return status === COUNTABLE_MATCH_STATUS;
}
