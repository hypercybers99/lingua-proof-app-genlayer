import React, { useState } from "react";
import { EVIDENCE_SCENARIOS, EvidenceScenario } from "../data/evidenceScenarios";
import { CHAIN_CONFIG } from "../config/chain";
import { getFidelityColor } from "../lib/score";
import { ShieldCheck, ExternalLink, Clock, Filter, AlertCircle, Info } from "lucide-react";

export const EvidenceView: React.FC = () => {
  const [filterClass, setFilterClass] = useState<string>("ALL");

  const filtered = EVIDENCE_SCENARIOS.filter((s) => {
    if (filterClass === "ALL") return true;
    return s.fidelityClass === filterClass;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] dark:border-[#2D3339] pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950/80 text-[#0D6E6E] dark:text-teal-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          On-Chain Verification Records
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#111827] dark:text-[#F3F4F6]">
          Live On-Chain Evidence Scenarios
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Audited evidence records executed on {CHAIN_CONFIG.networkName} against contract{" "}
          <code className="font-mono text-xs text-slate-800 dark:text-slate-200">
            {CHAIN_CONFIG.activeContract}
          </code>
        </p>
      </div>

      {/* Latency Spread & Consensus Clarification Notice */}
      <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4 text-[#0D6E6E]" />
          <span>Latency Spread Analysis:</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          Audit transactions typically resolve in 25–42 seconds under active consensus on Studionet. The 118.42 second outlier recorded on transaction <code>0x7649c600...</code> during case E4 was caused by a transient Studionet RPC queue congestion event, not contract latency.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {["ALL", "FAITHFUL", "MINOR_SHIFT", "MATERIAL_LOSS"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterClass(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterClass === cat
                ? "bg-[#0D6E6E] text-white shadow-sm"
                : "bg-white dark:bg-[#181C20] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((scenario) => {
          const color = getFidelityColor(scenario.fidelityClass as any);

          return (
            <div
              key={scenario.id}
              className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Scenario {scenario.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color.badge}`}
                  >
                    {scenario.fidelityClass} ({scenario.score})
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-[#111827] dark:text-[#F3F4F6]">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                      {scenario.langPair}
                    </span>
                    <span>•</span>
                    <span>{scenario.segments} segments</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {scenario.latencySec}s
                    </span>
                  </div>
                  <div>
                    <strong>Consensus Agreement:</strong> {scenario.agreement} validators
                  </div>
                  <div>
                    <strong>Terminal Status:</strong>{" "}
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      {scenario.terminalOutcome}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hashes & Explorer Links */}
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2D3339] space-y-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-sans font-semibold">
                    Registration Tx:
                  </span>
                  <a
                    href={`${CHAIN_CONFIG.explorerUrl}/tx/${scenario.regTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0D6E6E] dark:text-teal-400 hover:underline break-all inline-flex items-center gap-1"
                  >
                    {scenario.regTxHash}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {scenario.auditTxHash && (
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-sans font-semibold">
                      Audit / Action Tx:
                    </span>
                    <a
                      href={`${CHAIN_CONFIG.explorerUrl}/tx/${scenario.auditTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0D6E6E] dark:text-teal-400 hover:underline break-all inline-flex items-center gap-1"
                    >
                      {scenario.auditTxHash}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
