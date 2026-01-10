import { describe, expect, it } from "vitest";
import { mapCoordinatesToHit } from "../../src/lib/game/score-mapper";

describe("Score Mapper", () => {
    // Helper for pure mm scale
    const map = (x: number, y: number) => mapCoordinatesToHit(x, y, { scale: 1 });

    it("should map center to Double Bull", () => {
        expect(map(0, 0)).toEqual({ segment: 25, multiplier: 2 });
    });

    it("should map slightly off center to Single Bull", () => {
        // y = 10mm (Down)
        expect(map(0, 10)).toEqual({ segment: 25, multiplier: 1 });
    });

    it("should map Top Normal (0, -50) to Single 20", () => {
        const result = map(0, -50);
        expect(result).toEqual({ segment: 20, multiplier: 1 });
    });

    it("should map Double 20", () => {
        // Radius ~165mm (Top)
        const result = map(0, -165);
        expect(result).toEqual({ segment: 20, multiplier: 2 });
    });

    it("should map Triple 20", () => {
        // Radius ~103mm (Top)
        const result = map(0, -103);
        expect(result).toEqual({ segment: 20, multiplier: 3 });
    });

    it("should map Miss (Outside Double Ring)", () => {
        const result = map(0, -200);
        expect(result).toEqual({ segment: 0, multiplier: 0 });
    });

    it("should map Right (Seg 6)", () => {
        // Radius 50mm (Single Inner)
        const result = map(50, 0); // Right, Single
        expect(result).toEqual({ segment: 6, multiplier: 1 });
    });

    it("should map Bottom (Seg 3)", () => {
        // Bottom is 180 deg. Radius 50mm
        // Order: ..., 17, 3, 19, ...
        // Let's check index. 20 is 0.
        // 180 / 18 = 10.
        // Index 10.
        // SEGMENT_ORDER[10] -> 3.
        const result = map(0, 50);
        expect(result).toEqual({ segment: 3, multiplier: 1 });
    });

    it("should map Left (Seg 11)", () => {
        // Left is 270 deg. Radius 50mm
        // 270 / 18 = 15.
        // Index 15.
        // SEGMENT_ORDER[15] -> 11.
        const result = map(-50, 0);
        expect(result).toEqual({ segment: 11, multiplier: 1 });
    });

    it("should handle angular boundaries correctly", () => {
        // Segment 20 is -9 to +9 deg.
        // At radius 100.
        // x = 100 * sin(angle)
        // y = -100 * cos(angle) (Since Y is Down, Top is -Y)

        // 8 degrees (Clockwise from Top) -> Should be 20
        let rad = (8 * Math.PI) / 180;
        let x = 100 * Math.sin(rad);
        let y = -100 * Math.cos(rad);
        expect(map(x, y).segment).toBe(20);

        // 10 degrees -> Should be 1
        rad = (10 * Math.PI) / 180;
        x = 100 * Math.sin(rad);
        y = -100 * Math.cos(rad);
        expect(map(x, y).segment).toBe(1);
    });

    it("should apply scaling", () => {
        // Input (0, -50). Scale 0.5 -> Radius 25 (Single Bull range? No, Outer Bull R is 15.9. 25 is > 15.9)
        // 25mm is Single 20/1/etc.
        const res = mapCoordinatesToHit(0, -50, { scale: 0.5 });
        expect(res.segment).not.toBe(25);
        expect(res.multiplier).toBe(1); // Single area

        // Input (0, -100). Scale 2.0 -> Radius 200 (Miss)
        const resMiss = mapCoordinatesToHit(0, -100, { scale: 2.0 });
        expect(resMiss.segment).toBe(0);
    });

    it("should apply rotation", () => {
        // Top is normally 20.
        // If we apply rotation +18 degrees (virtual board rotates clockwise? or input?)
        // Implementation: angle = getAngle(x,y) + rotation.
        // If x,y is Top (0 coord angle). +18 -> 18 deg.
        // 18 deg corresponds to Index 1 (Segment 1).
        // So hitting Top returns Segment 1 instead of 20.
        const res = mapCoordinatesToHit(0, -50, { scale: 1, rotation: 18 });
        expect(res.segment).toBe(1);
    });
});
