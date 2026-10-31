import React, { useState } from "react";
import { ModalPortal } from "../components/common/ModalPortal";
import { useWallet } from "../context/WalletContext";
import { CHAIN_CONFIG } from "../config/chain";
import { pollTransactionReceipt } from "../lib/txLifecycle";
import { parseRevertReason } from "../lib/revertMap";
import { InAppNotice } from "../components/common/InAppNotice";
import { ShieldCheck, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  translationId: string;
  onAuditComplete: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  translationId,
  onAuditComplete,
}) => {
  const { getClient, isZeroBalance, balance } = useWallet();
  const [step, setStep] = useState<"idle" | "submitting" | "polling" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [agreement, setAgreement] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  const handleStartAudit = async () => {
    setStep("submitting");
    setErrorMessage("");
    setElapsedSec(0);

    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    try {
      const client = getClient();
      const hash = await client.writeContract({
        address: CHAIN_CONFIG.activeContract,
        functionName: "audit_translation",
        args: [translationId],
        value: 0n,
      });

      const hashStr = String(hash);
      setTxHash(hashStr);
      setStep("polling");

      // Poll transaction receipt
      const result = await pollTransactionReceipt(hashStr);

      if (result.isApplied) {
        setAgreement(result.agreement);
        setStep("success");
        onAuditComplete();
      } else {
        const parsed = parseRevertReason(result.error || "Execution failed");
        setErrorMessage(`${parsed.title}: ${parsed.message} (${parsed.actionable})`);
        setStep("error");
      }
    } catch (err: any) {
      const parsed = parseRevertReason(err?.message || "Transaction reverted");
      setErrorMessage(`${parsed.title}: ${parsed.message} (${parsed.actionable})`);
      setStep("error");
    } finally {
      clearInterval(timer);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setTxHash("");
    setErrorMessage("");
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={handleReset} title="Trigger Validator Consensus Audit">
      <div className="space-y-5 text-sm">
        {step === "idle" && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Triggering an audit will dispatch a consensus task to validators on {CHAIN_CONFIG.networkName}. Validators will execute blind back-translation and score each aligned segment against the official rubric.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121518] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div>
                <strong>Translation ID:</strong> <span className="font-mono">{translationId}</span>
              </div>
              <div>
                <strong>Current Balance:</strong>{" "}
                <span className="font-mono">
                  {balance !== null ? `${(Number(balance) / 1e18).toFixed(4)} GEN` : "..."}
                </span>
              </div>
            </div>

            {isZeroBalance && (
              <div
                role="status"
                data-testid="audit-funding-notice"
                className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs"
              >
                <span className="font-semibold">Informational:</span> Faucet funding is optional on GenLayer Studionet (Preview); transactions succeed with 0 GEN balance. (Studionet Preview behavior may change).
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                data-testid="audit-cancel-btn"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartAudit}
                data-testid="audit-submit-btn"
                className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirm &amp; Audit
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
                  ? "Submitting Audit Transaction..."
                  : "Validators Reaching Consensus..."}
              </h3>
              <p className="text-xs text-slate-500">
                Elapsed: {elapsedSec}s • Typical audit latency: 25–42s
              </p>
            </div>

            {txHash && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono break-all text-slate-700 dark:text-slate-300">
                <div>Transaction Hash:</div>
                <a
                  href={`${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0D6E6E] dark:text-teal-400 hover:underline inline-flex items-center gap-1 mt-1"
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
                Consensus evaluation completed and notarized on {CHAIN_CONFIG.networkName}.
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
              Done &amp; View Audit
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
                Audit Transaction Not Applied
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
                onClick={handleStartAudit}
                className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
              >
                Retry Audit
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};
