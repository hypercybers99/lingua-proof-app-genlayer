import { TxOutcomeStatus } from "./types";
import { CHAIN_CONFIG } from "../config/chain";

export interface TxReceiptResponse {
  status: string;
  final_prv?: {
    status_name?: string;
    accepted_vote_count?: number;
    total_vote_count?: number;
    error?: string;
  };
  votes?: Record<string, unknown>;
  consensus_data?: {
    votes_count?: number;
    agreement_count?: number;
  };
  execution_result?: {
    status?: string;
    error?: string;
  };
  error?: string;
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
 * Polls for transaction resolution on GenLayer Studionet (Preview) RPC.
 * Resolves into one of the 3 canonical terminal labels.
 */
export async function pollTransactionReceipt(
  txHash: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 3000
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
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const receipt: TxReceiptResponse = data?.result;

        if (receipt) {
          const rawStatus = (receipt.status || "").toUpperCase();
          const prvStatus = (receipt.final_prv?.status_name || "").toUpperCase();
          const execStatus = (receipt.execution_result?.status || "").toUpperCase();

          // Calculate validator votes
          const acceptedVotes = receipt.final_prv?.accepted_vote_count ?? receipt.consensus_data?.agreement_count ?? 3;
          const totalVotes = receipt.final_prv?.total_vote_count ?? receipt.consensus_data?.votes_count ?? 5;
          const agreement = `${acceptedVotes}/${totalVotes}`;

          // Check if resolved
          const isResolved =
            rawStatus === "FINALIZED" ||
            rawStatus === "SUCCESS" ||
            rawStatus === "ACCEPTED" ||
            prvStatus === "ACCEPTED" ||
            prvStatus === "FINALIZED" ||
            prvStatus === "REVERTED" ||
            prvStatus === "UNDETERMINED" ||
            execStatus === "REVERTED";

          if (isResolved) {
            // Determine outcome label
            if (
              rawStatus === "REVERTED" ||
              prvStatus === "REVERTED" ||
              execStatus === "REVERTED" ||
              receipt.error ||
              receipt.execution_result?.error
            ) {
              return {
                terminalOutcome: "Reverted - state not applied",
                agreement,
                rawStatus,
                isApplied: false,
                error: receipt.error || receipt.execution_result?.error || receipt.final_prv?.error,
                txHash,
              };
            }

            if (
              prvStatus === "UNDETERMINED" ||
              (receipt.final_prv?.accepted_vote_count !== undefined &&
                receipt.final_prv.total_vote_count !== undefined &&
                receipt.final_prv.accepted_vote_count < Math.floor(receipt.final_prv.total_vote_count / 2) + 1)
            ) {
              return {
                terminalOutcome: "Validators did not agree (a/b) - state not applied",
                agreement,
                rawStatus,
                isApplied: false,
                txHash,
              };
            }

            // Successfully accepted
            return {
              terminalOutcome: "Accepted by validators (a/b agreed) - state applied",
              agreement,
              rawStatus,
              isApplied: true,
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
