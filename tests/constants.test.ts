import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CHAIN_CONFIG } from "../src/config/chain";

function extractContractConstant(code: string, constantName: string): number {
  const regex = new RegExp(`\\b${constantName}\\s*=\\s*(\\d+(?:\\.\\d+)?)`);
  const match = regex.exec(code);
  if (!match) {
    throw new Error(`Constant ${constantName} not found in contract`);
  }
  return parseFloat(match[1]);
}

describe("UI Limits vs Contract Constants Equality", () => {
  const contractPath = path.join(process.cwd(), "contracts-reference", "linguaproof.py");
  const contractCode = fs.readFileSync(contractPath, "utf8");

  it("verifies MAX_SEGMENTS equality (12)", () => {
    const contractVal = extractContractConstant(contractCode, "MAX_SEGMENTS");
    expect(CHAIN_CONFIG.limits.maxSegments).toBe(12);
    expect(CHAIN_CONFIG.limits.maxSegments).toBe(contractVal);
  });

  it("verifies MIN_SEGMENTS equality (1)", () => {
    const contractVal = extractContractConstant(contractCode, "MIN_SEGMENTS");
    expect(CHAIN_CONFIG.limits.minSegments).toBe(1);
    expect(CHAIN_CONFIG.limits.minSegments).toBe(contractVal);
  });

  it("verifies SRC_MIN equality (3)", () => {
    const contractVal = extractContractConstant(contractCode, "SRC_MIN");
    expect(CHAIN_CONFIG.limits.srcMin).toBe(3);
    expect(CHAIN_CONFIG.limits.srcMin).toBe(contractVal);
  });

  it("verifies SRC_MAX equality (400)", () => {
    const contractVal = extractContractConstant(contractCode, "SRC_MAX");
    expect(CHAIN_CONFIG.limits.srcMax).toBe(400);
    expect(CHAIN_CONFIG.limits.srcMax).toBe(contractVal);
  });

  it("verifies TGT_MIN equality (1)", () => {
    const contractVal = extractContractConstant(contractCode, "TGT_MIN");
    expect(CHAIN_CONFIG.limits.tgtMin).toBe(1);
    expect(CHAIN_CONFIG.limits.tgtMin).toBe(contractVal);
  });

  it("verifies TGT_MAX equality (600)", () => {
    const contractVal = extractContractConstant(contractCode, "TGT_MAX");
    expect(CHAIN_CONFIG.limits.tgtMax).toBe(600);
    expect(CHAIN_CONFIG.limits.tgtMax).toBe(contractVal);
  });

  it("verifies MAX_TOTAL_SRC equality (2400)", () => {
    const contractVal = extractContractConstant(contractCode, "MAX_TOTAL_SRC");
    expect(CHAIN_CONFIG.limits.maxTotalSrc).toBe(2400);
    expect(CHAIN_CONFIG.limits.maxTotalSrc).toBe(contractVal);
  });

  it("verifies LABEL_MIN equality (3)", () => {
    const contractVal = extractContractConstant(contractCode, "LABEL_MIN");
    expect(CHAIN_CONFIG.limits.labelMin).toBe(3);
    expect(CHAIN_CONFIG.limits.labelMin).toBe(contractVal);
  });

  it("verifies LABEL_MAX equality (80)", () => {
    const contractVal = extractContractConstant(contractCode, "LABEL_MAX");
    expect(CHAIN_CONFIG.limits.labelMax).toBe(80);
    expect(CHAIN_CONFIG.limits.labelMax).toBe(contractVal);
  });

  it("verifies CHALLENGE_REASON_MIN equality (10)", () => {
    const contractVal = extractContractConstant(contractCode, "CHALLENGE_REASON_MIN");
    expect(CHAIN_CONFIG.limits.minReasonLen).toBe(10);
    expect(CHAIN_CONFIG.limits.minReasonLen).toBe(contractVal);
  });

  it("verifies CHALLENGE_REASON_MAX equality (200)", () => {
    const contractVal = extractContractConstant(contractCode, "CHALLENGE_REASON_MAX");
    expect(CHAIN_CONFIG.limits.maxReasonLen).toBe(200);
    expect(CHAIN_CONFIG.limits.maxReasonLen).toBe(contractVal);
  });

  it("verifies PAGE_LIMIT_MAX equality (50)", () => {
    const contractVal = extractContractConstant(contractCode, "PAGE_LIMIT_MAX");
    expect(CHAIN_CONFIG.limits.pageLimitMax).toBe(50);
    expect(CHAIN_CONFIG.limits.pageLimitMax).toBe(contractVal);
  });

  it("verifies UNCLEAR_INCONCLUSIVE_FRACTION equality (0.25)", () => {
    const contractVal = extractContractConstant(contractCode, "UNCLEAR_INCONCLUSIVE_FRACTION");
    expect(CHAIN_CONFIG.limits.unclearInconclusiveFraction).toBe(0.25);
    expect(CHAIN_CONFIG.limits.unclearInconclusiveFraction).toBe(contractVal);
  });

  it("verifies MAX_AUDITS_PER_TRANSLATION equality (8)", () => {
    const contractVal = extractContractConstant(contractCode, "MAX_AUDITS_PER_TRANSLATION");
    expect(CHAIN_CONFIG.limits.maxAuditsPerTranslation).toBe(8);
    expect(CHAIN_CONFIG.limits.maxAuditsPerTranslation).toBe(contractVal);
  });
});
