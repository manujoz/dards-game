import { Hit } from "@/types/models/darts";
import { BOARD_DIMENSIONS_MM, SEGMENT_ORDER, getAngle, getRadius } from "./board-geometry";

export interface Calibration {
    scale: number; // mm per input unit
    rotation?: number; // degrees to adjust (default 0)
    xOffset?: number; // x translation in input units (default 0)
    yOffset?: number; // y translation in input units (default 0)
}

/**
 * Maps relative coordinates (x,y) to a Dart Hit.
 * (0,0) is assumed to be the center of the board.
 * @param x x coordinate (Right+)
 * @param y y coordinate (Down+)
 * @param calibration Optional calibration settings
 */
export function mapCoordinatesToHit(x: number, y: number, calibration: Calibration = { scale: 1 }): Hit {
    // Apply offset if needed
    const effX = x - (calibration.xOffset ?? 0);
    const effY = y - (calibration.yOffset ?? 0);

    // Calculate radius in mm
    const r = getRadius(effX, effY) * calibration.scale;

    // Check for Miss (Outside Double Ring)
    if (r > BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R) {
        return { segment: 0, multiplier: 0 };
    }

    // Check for Bullseye
    if (r <= BOARD_DIMENSIONS_MM.INNER_BULL_R) {
        return { segment: 25, multiplier: 2 }; // Double Bull
    }
    if (r <= BOARD_DIMENSIONS_MM.OUTER_BULL_R) {
        return { segment: 25, multiplier: 1 }; // Single Bull (Outer)
    }

    // Determine Multiplier based on Ring
    let multiplier: 1 | 2 | 3 = 1;

    if (r >= BOARD_DIMENSIONS_MM.TRIPLE_INNER_R && r <= BOARD_DIMENSIONS_MM.TRIPLE_OUTER_R) {
        multiplier = 3;
    } else if (r >= BOARD_DIMENSIONS_MM.DOUBLE_INNER_R && r <= BOARD_DIMENSIONS_MM.DOUBLE_OUTER_R) {
        multiplier = 2;
    }

    // Calculate Angle and Segment
    // Apply rotation correction to the raw angle
    let angle = getAngle(effX, effY) + (calibration.rotation ?? 0);

    // Normalize angle [0, 360)
    angle = angle % 360;
    if (angle < 0) angle += 360;

    // Each segment is 18 degrees.
    // Segment 20 is at 0 degrees, spanning -9 to +9 (so 351 to 9).
    // We can offset by 9 degrees to make the math simpler (floor).
    // (angle + 9) / 18
    const sliceIndex = Math.floor((angle + 9) / 18) % 20;

    const segment = SEGMENT_ORDER[sliceIndex];

    return {
        segment,
        multiplier: multiplier as 1 | 2 | 3,
    };
}
