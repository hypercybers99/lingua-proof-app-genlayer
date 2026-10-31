import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Expected public methods exposed to UI from contracts-reference/linguaproof.py
const EXPECTED_CONTRACT_METHODS: Record<string, string[]> = {
  register_translation: ["label", "source_lang", "target_lang", "pairs_json"],
  audit_translation: ["translation_id"],
  revise_translation: ["translation_id", "pairs_json"],
  challenge_segment: ["translation_id", "segment_index", "reason"],
  get_translation: ["translation_id"],
  get_audits: ["translation_id", "offset", "limit"],
  get_challenges: ["translation_id", "offset", "limit"],
  get_lineage: ["translation_id"],
  list_translation_ids: ["offset", "limit"],
  get_translator_board: ["limit"],
  get_rubric: [],
  get_meta: [],
};

function parsePythonContractMethods(code: string): Record<string, string[]> {
  const methods: Record<string, string[]> = {};
  const methodRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = methodRegex.exec(code)) !== null) {
    const methodName = match[1];
    const rawArgs = match[2];

    if (!methodName.startsWith("_") && !methodName.includes("leader") && !methodName.includes("validator")) {
      const params = rawArgs
        .split(",")
        .map((p) => p.split(":")[0].trim())
        .filter((p) => p && p !== "self");
      methods[methodName] = params;
    }
  }

  return methods;
}

describe("Contract Method Name & Arity Cross-Check", () => {
  const contractPath = path.join(process.cwd(), "contracts-reference", "linguaproof.py");
  const contractCode = fs.readFileSync(contractPath, "utf8");
  const actualMethods = parsePythonContractMethods(contractCode);

  it("parses all public user-facing methods from contract file", () => {
    for (const [expectedName, expectedArgs] of Object.entries(EXPECTED_CONTRACT_METHODS)) {
      expect(actualMethods).toHaveProperty(expectedName);
      expect(actualMethods[expectedName]).toEqual(expectedArgs);
    }
  });

  it("verifies register_translation accepts exactly 4 arguments", () => {
    expect(actualMethods.register_translation).toHaveLength(4);
    expect(actualMethods.register_translation).toEqual([
      "label",
      "source_lang",
      "target_lang",
      "pairs_json",
    ]);
  });

  it("verifies revise_translation accepts exactly 2 arguments", () => {
    expect(actualMethods.revise_translation).toHaveLength(2);
    expect(actualMethods.revise_translation).toEqual(["translation_id", "pairs_json"]);
  });

  it("verifies challenge_segment accepts exactly 3 arguments", () => {
    expect(actualMethods.challenge_segment).toHaveLength(3);
    expect(actualMethods.challenge_segment).toEqual([
      "translation_id",
      "segment_index",
      "reason",
    ]);
  });

  it("verifies audit_translation accepts exactly 1 argument", () => {
    expect(actualMethods.audit_translation).toHaveLength(1);
    expect(actualMethods.audit_translation).toEqual(["translation_id"]);
  });

  it("verifies get_translation accepts exactly 1 argument", () => {
    expect(actualMethods.get_translation).toHaveLength(1);
    expect(actualMethods.get_translation).toEqual(["translation_id"]);
  });

  it("verifies get_audits accepts exactly 3 arguments", () => {
    expect(actualMethods.get_audits).toHaveLength(3);
    expect(actualMethods.get_audits).toEqual(["translation_id", "offset", "limit"]);
  });

  it("verifies get_challenges accepts exactly 3 arguments", () => {
    expect(actualMethods.get_challenges).toHaveLength(3);
    expect(actualMethods.get_challenges).toEqual(["translation_id", "offset", "limit"]);
  });

  it("NEGATIVE TEST: asserts mismatch on intentional method typo", () => {
    const bogusMethod = "register_translations_typo";
    expect(actualMethods).not.toHaveProperty(bogusMethod);
  });

  it("NEGATIVE TEST: asserts mismatch on intentional arity error", () => {
    const actualArgs = actualMethods.revise_translation;
    const bogusArgs = ["translation_id", "label", "pairs_json"]; // 3 args instead of 2
    expect(actualArgs).not.toEqual(bogusArgs);
  });
});
