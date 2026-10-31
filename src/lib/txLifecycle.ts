import { TxOutcomeStatus } from "./types";
import { CHAIN_CONFIG } from "../config/chain";

export interface TxOutcomeInput {
  rawStatus?: string;
  resultName?: string;
  executionResult?: string;
  votes?: Record<string, string | { vote?: string }>;
  receiptStatus?: string | number;
  errorMessage?: string;
}

export interface PollingResult {
  terminalOutcome: TxOutcomeStatus;
  agreement: string;
  rawStatus: string;
  isApplied: boolean;
  error?: string;
  txHash: string;
}

/**
 * Pure mapping function deriving one of the three canonical terminal labels
 * based on transaction status, result name, execution result, and validator votes.
 */
export function deriveTerminalOutcome(input: TxOutcomeInput): {
  terminalOutcome: TxOutcomeStatus;
  isApplied: boolean;
  agreement: string;
} {
  const rawStatus = (input.rawStatus || "").toUpperCase();
  const resultName = (input.resultName || "").toUpperCase();
  const execResult = (input.executionResult || "").toUpperCase();

  // Compute vote agreement
  const votes = input.votes || {};
  const voteEntries = Object.values(votes);
  const agreeCount = voteEntries.filter((v) =>
    typeof v === "string" ? v.toLowerCase() === "agree" : v?.vote?.toLowerCase() === "agree"
  ).length;
  const totalVotes = voteEntries.length > 0 ? voteEntries.length : 5;
  const agreement = `${agreeCount}/${totalVotes}`;

  // 1. Revert Check: If status or execution result indicates revert/error
  if (
    rawStatus === "REVERTED" ||
    execResult === "REVERTED" ||
    execResult === "ERROR" ||
    input.receiptStatus === "0x0" ||
    input.receiptStatus === 0 ||
    resultName.includes("REVERT") ||
    Boolean(input.errorMessage)
  ) {
    return {
      terminalOutcome: "Reverted - state not applied",
      isApplied: false,
      agreement: agreement !== "0/5" ? agreement : "0/5",
    };
  }

  // 2. Disagreement Check: Even if rawStatus is FINALIZED/ACCEPTED, if resultName is DISAGREE
  // or votes failed to reach majority quorum, validators did not agree.
  if (
    resultName.includes("DISAGREE") ||
    resultName.includes("UNDETERMINED") ||
    resultName.includes("TIMEOUT") ||
    (agreeCount > 0 && agreeCount < Math.floor(totalVotes / 2) + 1)
  ) {
    return {
      terminalOutcome: "Validators did not agree (a/b) - state not applied",
      isApplied: false,
      agreement,
    };
  }

  // 3. Accepted by validators: Majority agreed and state applied
  if (
    rawStatus === "ACCEPTED" ||
    rawStatus === "FINALIZED" ||
    rawStatus === "SUCCESS" ||
    resultName.includes("AGREE") ||
    input.receiptStatus === "0x1" ||
    input.receiptStatus === 1
  ) {
    return {
      terminalOutcome: "Accepted by validators (a/b agreed) - state applied",
      isApplied: true,
      agreement,
    };
  }

  return {
    terminalOutcome: "Validators did not agree (a/b) - state not applied",
    isApplied: false,
    agreement,
  };
}

/**
 * Polls for transaction resolution on GenLayer Studionet (Preview) RPC.
 * Resolves into one of the 3 canonical terminal labels.
 */
export async function pollTransactionReceipt(
  txHash: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 4000
): Promise<PollingResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const resp = await fetch(CHAIN_CONFIG.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "eth_getTransactionByHash",
          params: [txHash],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const tx = data?.result;

        if (tx) {
          const rawStatus = (tx.status || tx.status_name || "").toUpperCase();
          const resultName = (tx.result_name || "").toUpperCase();

          if (rawStatus === "ACCEPTED" || rawStatus === "FINALIZED" || rawStatus === "REVERTED") {
            const votes = tx.consensus_data?.votes || {};
            const outcome = deriveTerminalOutcome({
              rawStatus,
              resultName,
              executionResult: tx.execution_result,
              votes,
              errorMessage: tx.error || tx.genvm_result?.error_code,
            });

            return {
              terminalOutcome: outcome.terminalOutcome,
              agreement: outcome.agreement,
              rawStatus,
              isApplied: outcome.isApplied,
              error: tx.error || tx.genvm_result?.error_code,
              txHash,
            };
          }
        }
      }
    } catch {
      // Continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Transaction confirmation timed out after ${Math.round(maxWaitMs / 1000)}s.`);
}
