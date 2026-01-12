import { describe, expect, it } from "vitest";

import { createVariantKey, getVariantLabel } from "@/lib/rankings/variant-key";

describe("rankings/variant-key", () => {
    it("es estable con distinto orden de keys y campos extra (x01)", () => {
        const jsonA = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
            outMode: "double",
        });

        const jsonB = JSON.stringify({
            outMode: "double",
            inMode: "straight",
            startScore: 501,
            teamMode: "single",
            type: "x01",
            cualquierCosa: { anidado: true },
        });

        expect(createVariantKey("x01", jsonA)).toBe(createVariantKey("x01", jsonB));
    });

    it("distingue cambios relevantes (x01): startScore/outMode", () => {
        const base = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
            outMode: "double",
        });

        const changedStart = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 301,
            inMode: "straight",
            outMode: "double",
        });

        const changedOut = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
            outMode: "master",
        });

        expect(createVariantKey("x01", base)).not.toBe(createVariantKey("x01", changedStart));
        expect(createVariantKey("x01", base)).not.toBe(createVariantKey("x01", changedOut));
    });

    it("es estable si el orden de 'numbers' cambia (cricket)", () => {
        const jsonA = JSON.stringify({
            type: "cricket",
            teamMode: "single",
            mode: "standard",
            numbers: [20, 19, 18, 17, 16, 15, 25],
        });

        const jsonB = JSON.stringify({
            type: "cricket",
            mode: "standard",
            numbers: [25, 15, 16, 17, 18, 19, 20],
            teamMode: "single",
        });

        expect(createVariantKey("cricket", jsonA)).toBe(createVariantKey("cricket", jsonB));
    });

    it("distingue cambios relevantes (cricket): mode / contenido numbers", () => {
        const base = JSON.stringify({
            type: "cricket",
            teamMode: "single",
            mode: "standard",
            numbers: [20, 19, 18, 17, 16, 15, 25],
        });

        const changedMode = JSON.stringify({
            type: "cricket",
            teamMode: "single",
            mode: "cut_throat",
            numbers: [20, 19, 18, 17, 16, 15, 25],
        });

        const changedNumbers = JSON.stringify({
            type: "cricket",
            teamMode: "single",
            mode: "standard",
            numbers: [20, 19, 18, 17, 16, 15],
        });

        expect(createVariantKey("cricket", base)).not.toBe(createVariantKey("cricket", changedMode));
        expect(createVariantKey("cricket", base)).not.toBe(createVariantKey("cricket", changedNumbers));
    });

    it("fallback: JSON inválido → unknown", () => {
        expect(createVariantKey("x01", "{nope")).toBe("unknown");
    });

    it("fallback: JSON válido pero sin campos requeridos → unknown", () => {
        const jsonMissingOut = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
        });

        expect(createVariantKey("x01", jsonMissingOut)).toBe("unknown");
    });

    it("legibilidad: x01 produce una key determinista con prefijo y pares key=value (incluye maxRounds si existe)", () => {
        const json = JSON.stringify({
            type: "x01",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
            outMode: "double",
            maxRounds: 10,
        });

        expect(createVariantKey("x01", json)).toBe("x01|start=501|in=straight|out=double|team=single|maxRounds=10");
    });

    it("fallback: gameId no soportado → unknown", () => {
        const json = JSON.stringify({ type: "round_the_clock", teamMode: "single" });
        expect(createVariantKey("round_the_clock", json)).toBe("unknown");
    });

    it("fallback: type del JSON inconsistente con gameId → unknown", () => {
        const json = JSON.stringify({
            type: "cricket",
            teamMode: "single",
            startScore: 501,
            inMode: "straight",
            outMode: "double",
        });

        expect(createVariantKey("x01", json)).toBe("unknown");
    });

    it("label: x01 incluye startScore y salida, e incluye entrada si no es straight", () => {
        const keyStraightIn = "x01|start=501|in=straight|out=double|team=single";
        const labelA = getVariantLabel("x01", keyStraightIn);
        expect(labelA).toContain("501");
        expect(labelA).toContain("Salida doble");
        expect(labelA).not.toContain("Entrada");

        const keyDoubleIn = "x01|start=501|in=double|out=double|team=single";
        const labelB = getVariantLabel("x01", keyDoubleIn);
        expect(labelB).toContain("Entrada doble");
    });
});
