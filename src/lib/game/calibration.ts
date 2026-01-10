import { CalibrationConfig } from "@/types/models/darts";

/**
 * Transforms screen coordinates (pixels) to board coordinates (mm).
 *
 * Board Coordinates:
 * - (0, 0) is the center of the bullseye.
 * - Units are millimeters.
 * - X axis increases to the right.
 * - Y axis increases downwards.
 *
 * Transformation steps:
 * 1. Translate screen point so center is at (0, 0).
 * 2. Rotate to align alignment.
 * 3. Scale from pixels to mm.
 *
 * @param screenX The x coordinate on screen (pixels).
 * @param screenY The y coordinate on screen (pixels).
 * @param config The calibration configuration.
 * @returns {x, y} in mm.
 */
export function transformCoordinates(screenX: number, screenY: number, config: CalibrationConfig): { x: number; y: number } {
    const { centerX, centerY, scale, rotation } = config;

    // 1. Translation: Move origin to center
    const x = screenX - centerX;
    const y = screenY - centerY;

    // 2. Rotation: Counter-rotation to map screen space back to board space
    // If board is rotated +R degrees on screen, we need to rotate -R to align axis
    // Rotation is in degrees.
    const rad = (rotation * Math.PI) / 180;
    const cosString = Math.cos(-rad);
    const sinString = Math.sin(-rad);

    const xRot = x * cosString - y * sinString;
    const yRot = x * sinString + y * cosString;

    // 3. Scaling: pixels -> mm
    // config.scale is pixels per mm.
    // So mm = pixels / scale
    // Avoid division by zero
    const safeScale = scale === 0 ? 1 : scale;
    const xMm = xRot / safeScale;
    const yMm = yRot / safeScale;

    return { x: xMm, y: yMm };
}

/**
 * Transforms board coordinates (mm) to screen coordinates (pixels).
 * Useful for debugging or displaying elements on top of the board relative to hits.
 * @param boardX X in mm
 * @param boardY Y in mm
 * @param config Calibration config
 */
export function toScreenCoordinates(boardX: number, boardY: number, config: CalibrationConfig): { x: number; y: number } {
    const { centerX, centerY, scale, rotation } = config;

    // 1. Scale: mm -> pixels
    const xUnrot = boardX * scale;
    const yUnrot = boardY * scale;

    // 2. Rotate: Apply board rotation
    const rad = (rotation * Math.PI) / 180;
    const cosString = Math.cos(rad);
    const sinString = Math.sin(rad);

    const xRot = xUnrot * cosString - yUnrot * sinString;
    const yRot = xUnrot * sinString + yUnrot * cosString;

    // 3. Translate: Move to screen center
    return {
        x: xRot + centerX,
        y: yRot + centerY,
    };
}

/**
 * Computes simple calibration (Scale & Center) from two points:
 * 1. Center Point (User touches Bullseye)
 * 2. Reference Point (User touches a known location, e.g. center of Double 20)
 *
 * This assumes NO rotation for simplicity, or that rotation is handled manually.
 *
 * @param centerPoint {x, y} Screen coordinates of touches center
 * @param refPoint {x, y} Screen coordinates of touches reference point
 * @param refDistanceMm Distance in mm of the reference point from center (e.g. Double 20 center = 170mm)
 */
export function computeCalibrationFromPoints(
    centerPoint: { x: number; y: number },
    refPoint: { x: number; y: number },
    refDistanceMm: number,
): Partial<CalibrationConfig> {
    const centerX = centerPoint.x;
    const centerY = centerPoint.y;

    // Euclidean distance in pixels
    const dx = refPoint.x - centerX;
    const dy = refPoint.y - centerY;
    const distPx = Math.sqrt(dx * dx + dy * dy);

    // Scale = px / mm
    const scale = distPx / refDistanceMm;

    // Calculate rotation if we assume refPoint was supposed to be at specific angle (e.g. Up/North for D20)
    // D20 is at -90 degrees (Up) or 0 degrees (Top) depending on coordinate system.
    // In our system (Screen Y Down): Up is (0, -r). Angle is -90 deg.
    // atan2(dy, dx)
    // If user clicked D20, vector is (dx, dy).
    // Ideal vector for D20 is (0, -1).
    // Angle of click
    const clickAngle = Math.atan2(dy, dx); // radians
    // Target angle (Up) = -PI/2
    const targetAngle = -Math.PI / 2;

    // Rotation correction = clickAngle - targetAngle
    // e.g. if click was at 0 deg (Right), and should be -90.
    // we need to rotate coordinate system?
    // Let's keep it simple: just center and scale. Rotation is harder to UX single point.
    // We export rotation 0.

    return {
        centerX,
        centerY,
        scale,
        rotation: (clickAngle - targetAngle) * (180 / Math.PI),
    };
}
