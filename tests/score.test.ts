import { describe, it, expect } from "vitest";
import { computeFidelityScore, roundHalfToEven, getFidelityColor } from "../src/lib/score";

describe("Fidelity Score Arithmetic & Python 3 Rounding", () => {
  it("rounds half-to-even (Banker's rounding)", () => {
    expect(roundHalfToEven(0.5)).toBe(0);
    expect(roundHalfToEven(1.5)).toBe(2);
    expect(roundHalfToEven(2.5)).toBe(2);
    expect(roundHalfToEven(3.5)).toBe(4);
    expect(roundHalfToEven(62.5)).toBe(62);
    expect(roundHalfToEven(57.14)).toBe(57);
    expect(roundHalfToEven(50.0)).toBe(50);
  });

  it("scores 100% when all segments are PRESERVED", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
    ]);
    expect(res.score).toBe(100);
    expect(res.fidelityClass).toBe("FAITHFUL");
    expect(res.formulaDisplay).toBe("round(100 * 2 / 2) = 100");
  });

  it("scores 0% when all segments are defective", () => {
    const res = computeFidelityScore([
      { label: "DISTORTED", severity: 2 },
      { label: "ANCHOR_ALTERED", severity: 4 },
    ]);
    expect(res.score).toBe(0);
    expect(res.fidelityClass).toBe("MATERIAL_LOSS");
  });

  it("scores 50% for 1 preserved and 1 defective segment (E3–E6 & E8 case)", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "DISTORTED", severity: 2 },
    ]);
    expect(res.score).toBe(50);
    expect(res.fidelityClass).toBe("MATERIAL_LOSS");
    expect(res.formulaDisplay).toBe("round(100 * 1 / 2) = 50");
  });

  it("scores 57% for 4 preserved out of 7 segments (E1 initial case)", () => {
    const res = computeFidelityScore([
      { label: "SHIFTED", severity: 1 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "SHIFTED", severity: 1 },
      { label: "SHIFTED", severity: 1 },
    ]);
    expect(res.score).toBe(57);
    expect(res.fidelityClass).toBe("MATERIAL_LOSS");
  });

  it("scores 62% for 5 preserved out of 8 segments (E10 scale test case)", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "SHIFTED", severity: 1 },
      { label: "DISTORTED", severity: 2 },
      { label: "OMITTED", severity: 3 },
    ]);
    expect(res.score).toBe(62); // 5/8 * 100 = 62.5 -> rounds half to even 62
    expect(res.fidelityClass).toBe("MATERIAL_LOSS");
  });

  it("counts UNCLEAR as 0.5 segment", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "UNCLEAR", severity: 0 },
      { label: "PRESERVED", severity: 0 },
    ]);
    // 5 total, 1 unclear (20% <= 25%), 4 preserved:
    // (4 + 0.5) / 5 * 100 = 4.5 / 5 * 100 = 90
    expect(res.score).toBe(90);
    expect(res.fidelityClass).toBe("FAITHFUL");
    expect(res.formulaDisplay).toContain("0.5 * 1");
  });

  it("classifies as INCONCLUSIVE when UNCLEAR segments exceed 25%", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "UNCLEAR", severity: 0 },
      { label: "UNCLEAR", severity: 0 },
      { label: "PRESERVED", severity: 0 },
    ]);
    // 4 total, 2 unclear (50% > 25%)
    expect(res.unclearRatio).toBe(0.5);
    expect(res.fidelityClass).toBe("INCONCLUSIVE");
  });

  it("classifies FAITHFUL for scores >= 90", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
    ]);
    expect(res.score).toBe(100);
    expect(res.fidelityClass).toBe("FAITHFUL");
  });

  it("classifies MINOR_SHIFT for scores between 70 and 89", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "SHIFTED", severity: 1 },
    ]);
    // 4/5 = 80
    expect(res.score).toBe(80);
    expect(res.fidelityClass).toBe("MINOR_SHIFT");
  });

  it("classifies MATERIAL_LOSS for scores < 70", () => {
    const res = computeFidelityScore([
      { label: "PRESERVED", severity: 0 },
      { label: "PRESERVED", severity: 0 },
      { label: "DISTORTED", severity: 2 },
      { label: "DISTORTED", severity: 2 },
    ]);
    // 2/4 = 50
    expect(res.score).toBe(50);
    expect(res.fidelityClass).toBe("MATERIAL_LOSS");
  });

  it("returns appropriate badge colors for each fidelity class", () => {
    const faithful = getFidelityColor("FAITHFUL");
    expect(faithful.badge).toContain("emerald");

    const shift = getFidelityColor("MINOR_SHIFT");
    expect(shift.badge).toContain("amber");

    const loss = getFidelityColor("MATERIAL_LOSS");
    expect(loss.badge).toContain("rose");

    const inconclusive = getFidelityColor("INCONCLUSIVE");
    expect(inconclusive.badge).toContain("slate");
  });
});
