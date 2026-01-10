export const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

// Radii in mm (WDF Standards)
export const BOARD_DIMENSIONS_MM = {
    INNER_BULL_R: 6.35,
    OUTER_BULL_R: 15.9,
    TRIPLE_INNER_R: 99.0,
    TRIPLE_OUTER_R: 107.0,
    DOUBLE_INNER_R: 162.0,
    DOUBLE_OUTER_R: 170.0,
} as const;

/**
 * Calculates the angle in degrees [0, 360) for a given point (x, y).
 * Assumes (0,0) is center.
 * Assumes standard screen coordinates: X+ Right, Y+ Down.
 * Returns 0 for Top (Network), 90 for Right.
 */
export function getAngle(x: number, y: number): number {
    // Math.atan2(y, x) -> 0 is East (Right), PI/2 is South (Down), -PI/2 is North (Up)
    // We want North to be 0
    // atan2(y, x) gives radians from X axis towards Y axis.
    // Right (1, 0) -> 0
    // Down (0, 1) -> PI/2
    // Left (-1, 0) -> PI
    // Up (0, -1) -> -PI/2

    // Convert to degrees
    const deg = Math.atan2(y, x) * (180 / Math.PI);

    // Transform so -90 (Up) becomes 0
    // 0 (Right) -> 90
    // 90 (Down) -> 180

    let angle = deg + 90;

    // Normalize to [0, 360)
    if (angle < 0) {
        angle += 360;
    }
    if (angle >= 360) {
        angle -= 360;
    }

    return angle;
}

/**
 * Calculates Euclidean distance from center (0,0)
 */
export function getRadius(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
}
