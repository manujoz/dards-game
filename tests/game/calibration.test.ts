import { describe, expect, it } from "vitest";
import { computeCalibrationFromPoints, toScreenCoordinates, transformCoordinates } from "../../src/lib/game/calibration";
import { CalibrationConfig } from "../../src/types/models/darts";

describe("Calibration Logic", () => {
    const config: CalibrationConfig = {
        centerX: 500,
        centerY: 500,
        scale: 2, // 2 pixels per mm
        rotation: 0,
    };

    it("should transform center coordinates correctly", () => {
        const result = transformCoordinates(500, 500, config);
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it("should transform coordinates with scaling", () => {
        // Point at (600, 500) -> 100px right
        // 100px / 2 = 50mm
        const result = transformCoordinates(600, 500, config);
        expect(result.x).toBeCloseTo(50);
        expect(result.y).toBeCloseTo(0);
    });

    it("should transform coordinates with rotation", () => {
        // Rotate 90 degrees clockwise
        const rotConfig = { ...config, rotation: 90 };
        // Point at (600, 500) - original Right.
        // If board is rotated 90 deg, "Right" on screen corresponds to "Down" on board (if we rotate axes)?
        // Let's trace logic:
        // x = 100, y = 0
        // rotation = 90
        // rad = PI/2 from rotation
        // cos(-rad) = 0, sin(-rad) = -1
        // xRot = 100 * 0 - 0 * (-1) = 0
        // yRot = 100 * (-1) + 0 * 0 = -100
        // mm = -50
        // So (600, 500) maps to (0, -50)mm
        // (0, -50) is actually Up in standard (x right, y down) system? NO.
        // standard: y down. -50 y is Up.
        // So hitting Right on screen -> Up on board.
        // This means Screen Right maps to Board Up (Top 20).
        // Correct?
        // If Board is rotated 90 deg clockwise. Top 20 (Up) moves to Right.
        // So if I throw at Right, I hit Top 20.
        // Logic seems correct.

        const result = transformCoordinates(600, 500, rotConfig);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(-50);
    });

    it("should inverse transform (board -> screen)", () => {
        const boardX = 50;
        const boardY = 0;
        const screen = toScreenCoordinates(boardX, boardY, config);
        expect(screen.x).toBeCloseTo(600);
        expect(screen.y).toBeCloseTo(500);
    });

    it("should compute calibration from points", () => {
        const center = { x: 100, y: 100 };
        // D20 is usually at 170mm radius UP (y = -170 in board coords)
        // Let's say user clicks at (100, 10) -> 90px Up.
        // Distance is 90px.
        // Real distance is 170mm (Double Outer Ring).

        const refD20 = { x: 100, y: 10 };
        const d20Dist = 170;

        const cal = computeCalibrationFromPoints(center, refD20, d20Dist);

        expect(cal.centerX).toBe(100);
        expect(cal.centerY).toBe(100);
        expect(cal.scale).toBeCloseTo(90 / 170); // 0.529
        // Click angle: (0, -90) -> -90 deg.
        // Target angle: -90 deg.
        // Rotation should be 0.
        expect(cal.rotation).toBeCloseTo(0);
    });

    it("should compute calibration with rotation from points", () => {
        const center = { x: 100, y: 100 };
        // D20 (Target -90 deg) is clicked at Right (0 deg) -> (190, 100)
        // Means board is rotated 90 deg clockwise?
        // If D20 is at Right, user sees D20 at Right.
        // clickAngle = 0. target = -90.
        // diff = 0 - (-90) = 90.

        const refD20 = { x: 190, y: 100 };
        const d20Dist = 90; // 90 px distance

        const cal = computeCalibrationFromPoints(center, refD20, d20Dist);

        expect(cal.centerX).toBe(100);
        expect(cal.centerY).toBe(100);
        expect(cal.scale).toBeCloseTo(1);
        expect(cal.rotation).toBeCloseTo(90);
    });
});
