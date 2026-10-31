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
            let vmError = tx.error || tx.genvm_result?.error_code;
            if (!vmError && Array.isArray(tx.consensus_data?.validators)) {
              for (const val of tx.consensus_data.validators) {
                if (val.vote === "agree" && typeof val.result === "string" && val.result) {
                  try {
                    let firstByte = -1;
                    let msg = "";
                    if (typeof atob === "function") {
                      const binary = atob(val.result);
                      if (binary.length > 0) {
                        firstByte = binary.charCodeAt(0);
                        msg = binary.slice(1);
                      }
                    } else if (typeof Buffer !== "undefined") {
                      const buf = Buffer.from(val.result, "base64");
                      if (buf.length > 0) {
                        firstByte = buf[0];
                        msg = buf.slice(1).toString("utf8");
                      }
                    }
                    if (firstByte === 1 || firstByte === 2) {
                      vmError = msg || "Contract reverted with UserError";
                      break;
                    }
                  } catch {}
                }
              }
            }

            const outcome = deriveTerminalOutcome({
              rawStatus,
              resultName,
              executionResult: tx.execution_result,
              votes,
              errorMessage: vmError,
            });

            return {
              terminalOutcome: outcome.terminalOutcome,
              agreement: outcome.agreement,
              rawStatus,
              isApplied: outcome.isApplied,
              error: vmError,
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
