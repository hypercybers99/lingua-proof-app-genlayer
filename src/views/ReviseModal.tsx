import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalPortal } from "../components/common/ModalPortal";
import { useWallet } from "../context/WalletContext";
import { CHAIN_CONFIG } from "../config/chain";
import { StoredTranslation, SegmentPair } from "../lib/types";
import { pollTransactionReceipt } from "../lib/txLifecycle";
import { parseRevertReason } from "../lib/revertMap";
import { InAppNotice } from "../components/common/InAppNotice";
import { fetchTranslation } from "../lib/client";
import { GitBranch, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface ReviseModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTranslation: StoredTranslation;
}

export const ReviseModal: React.FC<ReviseModalProps> = ({
  isOpen,
  onClose,
  parentTranslation,
}) => {
  const navigate = useNavigate();
  const { getClient, isZeroBalance } = useWallet();
  const [pairs, setPairs] = useState<SegmentPair[]>(
    parentTranslation.pairs.map((p) => ({ ...p }))
  );
  const [step, setStep] = useState<"idle" | "submitting" | "polling" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [agreement, setAgreement] = useState<string>("");
  const [childId, setChildId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleTargetChange = (idx: number, newTgt: string) => {
    const updated = [...pairs];
    updated[idx] = { ...updated[idx], tgt: newTgt };
    setPairs(updated);
  };

  const isIdentical =
    JSON.stringify(pairs) === JSON.stringify(parentTranslation.pairs);

  const handleStartRevise = async () => {
    if (isIdentical) {
      setErrorMessage("Revision is identical to parent. Please modify at least one target segment.");
      setStep("error");
      return;
    }

    setStep("submitting");
    setErrorMessage("");

    try {
      const client = getClient();
      const pairsJson = JSON.stringify(pairs);

      const hash = await client.writeContract({
        address: CHAIN_CONFIG.activeContract,
        functionName: "revise_translation",
        args: [parentTranslation.id, pairsJson],
        value: 0n,
      });

      const hashStr = String(hash);
      setTxHash(hashStr);
      setStep("polling");

      const result = await pollTransactionReceipt(hashStr);

      if (result.isApplied) {
        setAgreement(result.agreement);

        // State readback: re-fetch parent to discover new childId
        let foundChild = "";
        for (let attempt = 0; attempt < 8; attempt++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const updatedParent = await fetchTranslation(parentTranslation.id);
            if (updatedParent.childId) {
              foundChild = updatedParent.childId;
              break;
            }
          } catch {
            // continue
          }
        }

        setChildId(foundChild);
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
    setStep("idle");
    setTxHash("");
    setErrorMessage("");
    onClose();
  };

  const handleGoToChild = () => {
    handleReset();
    if (childId) {
      navigate(`/t/${childId}`);
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleReset}
      title={`Publish Revision for ${parentTranslation.id}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-sm">
        {step === "idle" && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Create an updated version of this translation. Source segments remain locked to preserve semantic alignment. Edit the target segments below to repair fidelity issues.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {pairs.map((p, idx) => {
                const origTgt = parentTranslation.pairs[idx]?.tgt;
                const isChanged = origTgt !== p.tgt;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      isChanged
                        ? "border-teal-400 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121518]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span>Segment #{idx + 1}</span>
                      {isChanged && (
                        <span className="text-teal-600 dark:text-teal-400 font-semibold font-sans">
                          Modified
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 dark:text-slate-400">
                      <strong>Source:</strong> {p.src}
                    </div>

                    <div>
                      <label htmlFor={`revised-target-${idx}`} className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Revised Target Translation:
                      </label>
                      <textarea
                        id={`revised-target-${idx}`}
                        aria-label={`Revised Target Translation for Segment ${idx + 1}`}
                        rows={2}
                        value={p.tgt}
                        onChange={(e) => handleTargetChange(idx, e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-[#161A1D] text-slate-900 dark:text-slate-100 font-sans focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {isZeroBalance && (
              <div
                role="status"
                data-testid="revise-funding-notice"
                className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs"
              >
                <span className="font-semibold">Informational:</span> Faucet funding is optional on GenLayer Studionet (Preview); transactions succeed with 0 GEN balance. (Studionet Preview behavior may change).
              </div>
            )}

            {isIdentical && (
              <InAppNotice
                variant="info"
                message="No modifications detected yet. Please edit at least one target translation segment to create a revision."
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                data-testid="revise-cancel-btn"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isIdentical}
                onClick={handleStartRevise}
                data-testid="revise-submit-btn"
                className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <GitBranch className="w-4 h-4" />
                Publish Linked Revision
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
                  ? "Submitting Revision Transaction..."
                  : "Validators Confirming State..."}
              </h3>
              <p className="text-xs text-slate-500">
                Registering child translation linked to parent {parentTranslation.id}
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
                Revised translation successfully registered with linked parent lineage.
              </p>
            </div>

            {childId && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-lg text-xs font-mono">
                New Child Translation ID: <strong>{childId}</strong>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              {childId && (
                <button
                  type="button"
                  onClick={handleGoToChild}
                  className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
                >
                  View Revised Translation
                </button>
              )}
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Revision Not Applied
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
                onClick={handleStartRevise}
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
