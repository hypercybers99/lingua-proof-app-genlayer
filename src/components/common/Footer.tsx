import React from "react";
import { CHAIN_CONFIG } from "../../config/chain";
import { ExternalLink, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] dark:border-[#2D3339] bg-[#F5F5F0]/60 dark:bg-[#13171A]/60 py-8 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D6E6E]" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              LinguaProof Notary
            </span>
            <span>—</span>
            <span>{CHAIN_CONFIG.networkName} (Chain ID {CHAIN_CONFIG.chainId})</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.activeContract}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#0D6E6E] dark:hover:text-teal-300 underline underline-offset-2"
            >
              Active Notary Contract
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.diagnosticContract}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
            >
              Calibration Probe (Diagnostic Only)
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={CHAIN_CONFIG.faucetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#0D6E6E] dark:hover:text-teal-300 underline underline-offset-2"
            >
              Studionet Faucet
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#2D3339]/60 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          <p>
            <strong>Transparency Notice:</strong> LinguaProof generates automated translation fidelity notary signals using non-deterministic LLM consensus validators on {CHAIN_CONFIG.networkName}. Scores and verdicts represent a probabilistic fidelity signal from validator agreement, not a formal mathematical certificate or assurance of absolute translation perfection. Translators retain recourse through built-in segment challenges and linked version revisions.
          </p>
        </div>
      </div>
    </footer>
  );
};
