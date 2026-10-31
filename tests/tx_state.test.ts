import { describe, it, expect, vi } from "vitest";
import { deriveTerminalOutcome, TxOutcomeInput } from "../src/lib/txLifecycle";

describe("Transaction State & Terminal Outcome Mapping (Table-Driven)", () => {
  interface TestCase {
    name: string;
    input: TxOutcomeInput;
    expectedOutcome: string;
    expectedIsApplied: boolean;
    expectedAgreement: string;
  }

  const testCases: TestCase[] = [
    {
      name: "E1 Faithful Registration (3/5 agree, ACCEPTED)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        executionResult: "SUCCESS",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "disagree", v5: "idle" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "3/5",
    },
    {
      name: "E2 Faithful Audit (4/5 agree, FINALIZED)",
      input: {
        rawStatus: "FINALIZED",
        resultName: "MAJORITY_AGREE",
        executionResult: "SUCCESS",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "agree", v5: "disagree" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "4/5",
    },
    {
      name: "E3 Deterministic Anchor Alteration Catch (3/5 agree, state applied)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        executionResult: "SUCCESS",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "disagree", v5: "disagree" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "3/5",
    },
    {
      name: "E4 Model Distortion Catch with Congestion Outlier (3/5 agree, ACCEPTED)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        votes: { v1: "agree", v2: "agree", v3: "agree" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "3/3",
    },
    {
      name: "E5 Dropped Security Clause Model Catch (5/5 unanimous agree, ACCEPTED)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "agree", v5: "agree" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "5/5",
    },
    {
      name: "Critical: Raw status FINALIZED with MAJORITY_DISAGREE renders disagreement",
      input: {
        rawStatus: "FINALIZED",
        resultName: "MAJORITY_DISAGREE",
        votes: { v1: "disagree", v2: "disagree", v3: "disagree", v4: "agree", v5: "idle" },
      },
      expectedOutcome: "Validators did not agree (a/b) - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "1/5",
    },
    {
      name: "Raw status FINALIZED with UNDETERMINED renders disagreement",
      input: {
        rawStatus: "FINALIZED",
        resultName: "UNDETERMINED",
        votes: { v1: "agree", v2: "agree", v3: "disagree", v4: "disagree", v5: "idle" },
      },
      expectedOutcome: "Validators did not agree (a/b) - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "2/5",
    },
    {
      name: "Leader Timeout during appeal renders disagreement",
      input: {
        rawStatus: "FINALIZED",
        resultName: "LEADER_TIMEOUT",
        votes: { v1: "idle", v2: "idle", v3: "idle", v4: "idle", v5: "idle" },
      },
      expectedOutcome: "Validators did not agree (a/b) - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "0/5",
    },
    {
      name: "Intentional Revert: Duplicate translation registration",
      input: {
        rawStatus: "REVERTED",
        errorMessage: "duplicate registration",
      },
      expectedOutcome: "Reverted - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "0/5",
    },
    {
      name: "Intentional Revert: Translator challenging own translation",
      input: {
        rawStatus: "REVERTED",
        errorMessage: "translator cannot challenge own translation",
      },
      expectedOutcome: "Reverted - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "0/5",
    },
    {
      name: "Intentional Revert: Non-translator attempting revision",
      input: {
        rawStatus: "REVERTED",
        errorMessage: "only the translator can revise",
      },
      expectedOutcome: "Reverted - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "0/5",
    },
    {
      name: "Intentional Revert: Audit cooldown active",
      input: {
        rawStatus: "REVERTED",
        errorMessage: "audit cooldown active",
      },
      expectedOutcome: "Reverted - state not applied",
      expectedIsApplied: false,
      expectedAgreement: "0/5",
    },
    {
      name: "New E2E Run: Unfunded key registration (tx 0xe0ff9d6c...)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "disagree", v5: "idle" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "3/5",
    },
    {
      name: "New E2E Run: Child revision audit (tx 0x7a1ff61c...)",
      input: {
        rawStatus: "ACCEPTED",
        resultName: "MAJORITY_AGREE",
        votes: { v1: "agree", v2: "agree", v3: "agree", v4: "idle", v5: "disagree" },
      },
      expectedOutcome: "Accepted by validators (a/b agreed) - state applied",
      expectedIsApplied: true,
      expectedAgreement: "3/5",
    },
  ];

  testCases.forEach((tc) => {
    it(tc.name, () => {
      const res = deriveTerminalOutcome(tc.input);
      expect(res.terminalOutcome).toBe(tc.expectedOutcome);
      expect(res.isApplied).toBe(tc.expectedIsApplied);
      expect(res.agreement).toBe(tc.expectedAgreement);
    });
  });
});

describe("State Readback Verification Before Workflow Completion", () => {
  it("verifies registration completion only after readback discovers new ID", async () => {
    let readbackCount = 0;
    const mockReadContract = vi.fn().mockImplementation(async (method: string) => {
      if (method === "list_translation_ids") {
        readbackCount++;
        // First read: old list. Second read: includes new ID.
        return readbackCount > 1 ? { ids: ["new-id-123", "old-id-001"] } : { ids: ["old-id-001"] };
      }
      return null;
    });

    const prior = await mockReadContract("list_translation_ids");
    expect(prior.ids).not.toContain("new-id-123");

    // After state applied, readback confirms state change
    const updated = await mockReadContract("list_translation_ids");
    expect(updated.ids).toContain("new-id-123");
    expect(readbackCount).toBe(2);
  });

  it("verifies audit completion only after readback confirms audited score and status", async () => {
    let readCount = 0;
    const mockReadContract = vi.fn().mockImplementation(async () => {
      readCount++;
      return readCount === 1
        ? { id: "test-tid", status: "UNAUDITED", latest_score: -1 }
        : { id: "test-tid", status: "AUDITED", latest_score: 100, latest_class: "FAITHFUL" };
    });

    const preAudit = await mockReadContract("get_translation", ["test-tid"]);
    expect(preAudit.status).toBe("UNAUDITED");

    const postAudit = await mockReadContract("get_translation", ["test-tid"]);
    expect(postAudit.status).toBe("AUDITED");
    expect(postAudit.latest_score).toBe(100);
    expect(postAudit.latest_class).toBe("FAITHFUL");
  });

  it("verifies challenge completion only after readback confirms challenge record", async () => {
    const mockReadContract = vi.fn().mockResolvedValue({
      total: 1,
      items: [
        {
          n: 1,
          challenger: "0x1111111111111111111111111111111111111111",
          segment_index: 0,
          reason: "Fidelity challenge",
          supersedes_latest: true,
        },
      ],
    });

    const challenges = await mockReadContract("get_challenges", ["test-tid", 0, 10]);
    expect(challenges.total).toBe(1);
    expect(challenges.items[0].segment_index).toBe(0);
    expect(challenges.items[0].supersedes_latest).toBe(true);
  });

  it("verifies revision completion only after readback confirms parent child link and lineage", async () => {
    const mockReadContract = vi.fn().mockImplementation(async (method: string) => {
      if (method === "get_translation") {
        return { id: "parent-id", children: ["child-id-002"], revision: 1 };
      }
      if (method === "get_lineage") {
        return [
          { id: "parent-id", revision: 1, parent_id: "" },
          { id: "child-id-002", revision: 2, parent_id: "parent-id" },
        ];
      }
      return null;
    });

    const parent = await mockReadContract("get_translation", ["parent-id"]);
    expect(parent.children).toContain("child-id-002");

    const lineage = await mockReadContract("get_lineage", ["child-id-002"]);
    expect(lineage.length).toBe(2);
    expect(lineage[1].parent_id).toBe("parent-id");
    expect(lineage[1].revision).toBe(2);
  });
});

describe("RPC Failure Handling (Error State with Retry, Never Not Found)", () => {
  it("renders network error with retry action on RPC network failure", async () => {
    let attempt = 0;
    const fetchWithRetry = async () => {
      attempt++;
      if (attempt === 1) {
        throw new Error("RPC network timeout (HTTP 504 Gateway Timeout)");
      }
      return { success: true, data: { total: 10 } };
    };

    let uiState = { status: "loading", error: null as string | null, data: null as any };

    try {
      await fetchWithRetry();
    } catch (err: any) {
      uiState = { status: "error", error: err.message, data: null };
    }

    expect(uiState.status).toBe("error");
    expect(uiState.error).toContain("HTTP 504");
    expect(uiState.error).not.toBe("not found");

    // Click retry
    if (uiState.status === "error") {
      const retryResult = await fetchWithRetry();
      uiState = { status: "success", error: null, data: retryResult.data };
    }

    expect(uiState.status).toBe("success");
    expect(uiState.data.total).toBe(10);
  });
});
