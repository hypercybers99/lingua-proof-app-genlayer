import React, { useState } from "react";
import { ModalPortal } from "../components/common/ModalPortal";
import { useWallet } from "../context/WalletContext";
import { CHAIN_CONFIG } from "../config/chain";
import { pollTransactionReceipt } from "../lib/txLifecycle";
import { parseRevertReason } from "../lib/revertMap";
import { InAppNotice } from "../components/common/InAppNotice";
import { Scale, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  translationId: string;
  segmentIndex: number;
  onChallengeComplete: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  translationId,
  segmentIndex,
  onChallengeComplete,
}) => {
  const { getClient, isZeroBalance, balance } = useWallet();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"idle" | "submitting" | "polling" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [agreement, setAgreement] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const minLen = CHAIN_CONFIG.limits.minReasonLen;
  const maxLen = CHAIN_CONFIG.limits.maxReasonLen;
  const isReasonValid = reason.trim().length >= minLen && reason.trim().length <= maxLen;

  const handleStartChallenge = async () => {
    if (!isReasonValid) return;

    setStep("submitting");
    setErrorMessage("");

    try {
      const client = getClient();
      const hash = await client.writeContract({
        address: CHAIN_CONFIG.activeContract,
        functionName: "challenge_segment",
        args: [translationId, segmentIndex, reason.trim()],
        value: 0n,
      });

      const hashStr = String(hash);
      setTxHash(hashStr);
      setStep("polling");

      const result = await pollTransactionReceipt(hashStr);

      if (result.isApplied) {
        setAgreement(result.agreement);
        setStep("success");
      } else {
        const parsed = parseRevertReason(result.error || "Execution failed");
        setErrorMessage(`${parsed.title}: ${parsed.message} (${parsed.actionable})`);
        setStep("error");
      }
    } catch (err: any) {
      const parsed = parseRevertReason(err?.message || "Transaction reverted");
      setErrorMessage(`${parsed.title}: ${parsed.message} (${parsed.actionable})`);
      setStep("error");
    }
  };

  const handleReset = () => {
    const wasSuccess = step === "success";
    setStep("idle");
    setTxHash("");
    setErrorMessage("");
    setReason("");
    onClose();
    if (wasSuccess) {
      onChallengeComplete();
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleReset}
      title={`Challenge Segment #${segmentIndex + 1}`}
    >
      <div className="space-y-4 text-sm">
        {step === "idle" && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Dispute a defect or false-positive verdict for this segment. Validator models will independently review your reasoning and re-evaluate this specific segment under consensus.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="challenge-reason-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Justification &amp; Linguistic Reasoning:
              </label>
              <textarea
                id="challenge-reason-input"
                aria-label="Justification & Linguistic Reasoning"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this segment is faithful or identify the exact semantic / anchor error (10–1,000 characters)..."
                className="w-full p-3 text-xs bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-500 font-sans text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Min {minLen} chars, Max {maxLen} chars</span>
                <span
                  className={
                    reason.trim().length < minLen || reason.trim().length > maxLen
                      ? "text-rose-500 font-semibold"
                      : "text-slate-500"
                  }
                >
                  {reason.trim().length} / {maxLen}
                </span>
              </div>
            </div>

            {isZeroBalance && (
              <div
                role="status"
                data-testid="challenge-funding-notice"
                className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs"
              >
                <span className="font-semibold">Informational:</span> Faucet funding is optional on GenLayer Studionet (Preview); transactions succeed with 0 GEN balance. (Studionet Preview behavior may change).
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                data-testid="challenge-cancel-btn"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isReasonValid}
                onClick={handleStartChallenge}
                data-testid="challenge-submit-btn"
                className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <Scale className="w-4 h-4" />
                Submit Challenge
              </button>
            </div>
          </div>
        )}

        {(step === "submitting" || step === "polling") && (
          <div className="py-6 text-center space-y-4">
            <Loader2 className="w-10 h-10 mx-auto text-[#0D6E6E] animate-spin" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                {step === "submitting"
                  ? "Submitting Challenge..."
                  : "Validators Evaluating Contestation..."}
              </h3>
              <p className="text-xs text-slate-500">
                Re-evaluating segment #{segmentIndex + 1} under majority consensus
              </p>
            </div>

            {txHash && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono break-all">
                <a
                  href={`${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0D6E6E] dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                >
                  {txHash}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                Accepted by validators ({agreement || "3/5"} agreed) - state applied
              </h3>
              <p className="text-xs text-slate-500">
                Challenge processed. Translation effective score overlay updated.
              </p>
            </div>

            {txHash && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono break-all">
                <a
                  href={`${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0D6E6E] dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                >
                  View on Explorer: {txHash}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
            >
              Done &amp; Close
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Challenge Not Applied
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {errorMessage}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleStartChallenge}
                data-testid="challenge-retry-btn"
                className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};
