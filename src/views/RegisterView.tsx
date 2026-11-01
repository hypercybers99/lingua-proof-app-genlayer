import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { CHAIN_CONFIG } from "../config/chain";
import { SegmentPair } from "../lib/types";
import { extractAnchors, compareAnchors } from "../lib/anchors";
import { pollTransactionReceipt } from "../lib/txLifecycle";
import { parseRevertReason } from "../lib/revertMap";
import { InAppNotice } from "../components/common/InAppNotice";
import { fetchTranslationIds, fetchTranslation } from "../lib/client";
import {
  PlusCircle,
  Trash2,
  ShieldCheck,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { getClient, isZeroBalance, balance, address } = useWallet();

  const [label, setLabel] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("vi");
  const [pairs, setPairs] = useState<SegmentPair[]>([
    { src: "", tgt: "" },
  ]);

  const [step, setStep] = useState<"idle" | "submitting" | "polling" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [agreement, setAgreement] = useState<string>("");
  const [createdId, setCreatedId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const addPair = () => {
    if (pairs.length < 12) {
      setPairs([...pairs, { src: "", tgt: "" }]);
    }
  };

  const removePair = (idx: number) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter((_, i) => i !== idx));
    }
  };

  const updatePair = (idx: number, field: "src" | "tgt", val: string) => {
    const updated = [...pairs];
    updated[idx] = { ...updated[idx], [field]: val };
    setPairs(updated);
  };

  // Pre-flight validation
  const validationError = useMemo(() => {
    if (!label.trim()) return "Please enter a translation label or title.";
    if (label.trim().length > 120) return "Label exceeds maximum length of 120 characters.";
    if (sourceLang === targetLang) return "Source and target languages must differ.";
    if (pairs.length === 0 || pairs.length > 12) return "Must provide between 1 and 12 segment pairs.";

    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (!p.src.trim()) return `Segment #${i + 1} source text cannot be empty.`;
      if (!p.tgt.trim()) return `Segment #${i + 1} target text cannot be empty.`;
      if (p.src.trim() === p.tgt.trim()) return `Segment #${i + 1} target is identical to source.`;
    }

    const totalBytes = new TextEncoder().encode(
      pairs.map((p) => p.src).join("")
    ).length;
    if (totalBytes > 65536) return "Total source text exceeds 65,536 bytes limit.";

    return null;
  }, [label, sourceLang, targetLang, pairs]);

  // Real-time anchor pre-flight
  const anchorSummary = useMemo(() => {
    return pairs.map((p, i) => {
      const sAnchors = extractAnchors(p.src);
      const tAnchors = extractAnchors(p.tgt);
      const comparison = compareAnchors(sAnchors, tAnchors);
      return { index: i, sAnchors, tAnchors, result: comparison.result, details: comparison.details };
    });
  }, [pairs]);

  const handleSubmit = async () => {
    if (validationError) {
      setErrorMessage(validationError);
      setStep("error");
      return;
    }

    setStep("submitting");
    setErrorMessage("");

    try {
      const client = getClient();
      const cleanLabel = label.trim();
      const pairsJson = JSON.stringify(
        pairs.map((p) => ({ src: p.src.trim(), tgt: p.tgt.trim() }))
      );

      // Snapshot existing IDs to detect new ID
      const priorIds = new Set(await fetchTranslationIds(0, 50).catch(() => []));

      const hash = await client.writeContract({
        address: CHAIN_CONFIG.activeContract,
        functionName: "register_translation",
        args: [cleanLabel, sourceLang, targetLang, pairsJson],
        value: 0n,
      });

      const hashStr = String(hash);
      setTxHash(hashStr);
      setStep("polling");

      const result = await pollTransactionReceipt(hashStr);

      if (result.isApplied) {
        setAgreement(result.agreement);

        // Readback to discover created ID
        let foundId = "";
        for (let attempt = 0; attempt < 8; attempt++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const currentIds = await fetchTranslationIds(0, 10);
            for (const cid of currentIds) {
              if (!priorIds.has(cid)) {
                foundId = cid;
                break;
              }
            }
            if (foundId) break;
          } catch {
            // continue
          }
        }

        setCreatedId(foundId);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] dark:border-[#2D3339] pb-5">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
          Register Translation for Audit
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Submit aligned bilingual segments to the {CHAIN_CONFIG.networkName} ledger contract.
        </p>
      </div>

      {step === "idle" && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4">
            <h2 className="text-base font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
              1. Document Metadata
            </h2>

            <div>
              <label htmlFor="translation-title-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Translation Title / Label:
              </label>
              <input
                id="translation-title-input"
                aria-label="Translation Title / Label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Governance Proposal 24 - Operational Framework"
                maxLength={120}
                className="w-full p-2.5 text-sm bg-[#FBFBFA] dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 text-right">
                {label.length} / 120 chars
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Language:
                </label>
                <select
                  aria-label="Source Language"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full p-2.5 text-sm bg-[#FBFBFA] dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  {CHAIN_CONFIG.supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Language:
                </label>
                <select
                  aria-label="Target Language"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full p-2.5 text-sm bg-[#FBFBFA] dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  {CHAIN_CONFIG.supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Segment Editor */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
                  2. Aligned Segment Pairs ({pairs.length}/12)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Each pair represents one aligned sentence or clause. Maximum 12 pairs per registration.
                </p>
              </div>
              <button
                type="button"
                onClick={addPair}
                disabled={pairs.length >= 12}
                className="px-3 py-1.5 bg-[#0D6E6E] hover:bg-[#0A5555] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Segment
              </button>
            </div>

            <div className="space-y-4">
              {pairs.map((p, idx) => {
                const summary = anchorSummary[idx];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#14181B] border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                        Segment #{idx + 1}
                      </span>
                      {pairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePair(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                          title="Remove pair"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`src-segment-${idx}`} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Source Segment ({sourceLang.toUpperCase()}):
                        </label>
                        <textarea
                          id={`src-segment-${idx}`}
                          aria-label={`Source Segment ${idx + 1} (${sourceLang.toUpperCase()})`}
                          rows={2}
                          value={p.src}
                          onChange={(e) => updatePair(idx, "src", e.target.value)}
                          placeholder="Original text..."
                          className="w-full p-2.5 text-xs bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label htmlFor={`tgt-segment-${idx}`} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Target Translation ({targetLang.toUpperCase()}):
                        </label>
                        <textarea
                          id={`tgt-segment-${idx}`}
                          aria-label={`Target Translation Segment ${idx + 1} (${targetLang.toUpperCase()})`}
                          rows={2}
                          value={p.tgt}
                          onChange={(e) => updatePair(idx, "tgt", e.target.value)}
                          placeholder="Translated text..."
                          className="w-full p-2.5 text-xs bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Real-time Anchor Check Pill */}
                    {summary && (summary.sAnchors.length > 0 || summary.tAnchors.length > 0) && (
                      <div className="pt-1 text-[11px] flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Pre-flight Anchors:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-semibold ${
                            summary.result === "ANCHORS_OK"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {summary.result}
                        </span>
                        {summary.details.length > 0 && (
                          <span className="text-slate-400">({summary.details.join("; ")})</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <InAppNotice variant="error" message={validationError} />
          )}

          {isZeroBalance && (
            <div
              role="status"
              data-testid="register-funding-notice"
              className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs"
            >
              <span className="font-semibold">Informational:</span> Faucet funding is optional on GenLayer Studionet (Preview); measured on 2026-10-31 on 4 transactions with 2 unfunded keys; Studionet Preview behavior may change.
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              disabled={!!validationError}
              onClick={handleSubmit}
              data-testid="register-submit-btn"
              className="px-6 py-2.5 bg-[#0D6E6E] hover:bg-[#0A5555] disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Register on Studionet
            </button>
          </div>
        </div>
      )}

      {/* Progress & Result States */}
      {(step === "submitting" || step === "polling") && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-[#0D6E6E] animate-spin" />
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
            {step === "submitting"
              ? "Submitting Registration Transaction..."
              : "Validators Reaching Consensus..."}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Your translation is being registered on {CHAIN_CONFIG.networkName}. Polling for majority validator agreement...
          </p>

          {txHash && (
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono break-all max-w-lg mx-auto">
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
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Accepted by validators ({agreement || "3/5"} agreed) - state applied
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Your translation has been successfully registered and assigned an on-chain ID.
          </p>

          {createdId && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-sm font-mono max-w-md mx-auto">
              Translation ID: <strong>{createdId}</strong>
            </div>
          )}

          {txHash && (
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono break-all max-w-lg mx-auto">
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

          <div className="flex justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setStep("idle");
                setPairs([{ src: "", tgt: "" }]);
                setLabel("");
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
            >
              Register Another
            </button>
            {createdId && (
              <button
                type="button"
                onClick={() => navigate(`/t/${createdId}`)}
                className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
              >
                Open Translation Detail
              </button>
            )}
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
            Registration Reverted or Failed
          </h2>
          <p className="text-sm text-rose-600 dark:text-rose-400 max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setStep("idle")}
            className="px-5 py-2 bg-[#0D6E6E] text-white rounded-lg text-xs font-semibold hover:bg-[#0A5555]"
          >
            Back to Form
          </button>
        </div>
      )}
    </div>
  );
};
