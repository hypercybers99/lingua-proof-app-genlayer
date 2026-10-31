import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { REVERT_MAP, parseRevertReason } from "../src/lib/revertMap";

function extractAllUserErrors(code: string): string[] {
  const errorRegex = /raise\s+gl\.vm\.UserError\(\s*["']([^"']+)["']\s*\)/g;
  const errors = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = errorRegex.exec(code)) !== null) {
    errors.add(match[1]);
  }

  return Array.from(errors).sort();
}

describe("RevertMap Completeness vs Canonical Contract", () => {
  const contractPath = path.join(process.cwd(), "contracts-reference", "linguaproof.py");
  const contractCode = fs.readFileSync(contractPath, "utf8");
  const contractErrors = extractAllUserErrors(contractCode);

  it("extracts non-empty list of UserError strings from contract", () => {
    expect(contractErrors.length).toBeGreaterThan(25);
  });

  it("asserts that EVERY contract UserError string is mapped in REVERT_MAP", () => {
    for (const errorStr of contractErrors) {
      expect(REVERT_MAP, `Missing mapping for contract error: "${errorStr}"`).toHaveProperty(errorStr);
      const entry = REVERT_MAP[errorStr];
      expect(entry.title).toBeTruthy();
      expect(entry.message).toBeTruthy();
      expect(entry.actionable).toBeTruthy();
    }
  });

  it("parses known contract error into friendly guidance", () => {
    const res = parseRevertReason("Execution failed: only the translator can revise");
    expect(res.title).toBe("Unauthorized Revision");
    expect(res.actionable).toContain("wallet that registered");
  });

  it("parses cooldown error into friendly guidance", () => {
    const res = parseRevertReason("audit cooldown active");
    expect(res.title).toBe("Audit Cooldown Active");
    expect(res.actionable).toContain("60 seconds");
  });

  it("parses identical revision error", () => {
    const res = parseRevertReason("revision is identical to parent");
    expect(res.title).toBe("Unchanged Revision");
    expect(res.actionable).toContain("at least one correction");
  });

  it("parses challenge limit error", () => {
    const res = parseRevertReason("challenge limit reached for translation");
    expect(res.title).toBe("Translation Challenge Cap Reached");
  });

  it("falls back gracefully on unknown runtime revert", () => {
    const res = parseRevertReason("Some completely unknown VM panic");
    expect(res.title).toBe("Transaction Reverted");
    expect(res.actionable).toBeTruthy();
  });
});
