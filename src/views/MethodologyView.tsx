import React from "react";
import { CHAIN_CONFIG } from "../config/chain";
import { BookOpen, ShieldCheck, Scale, AlertTriangle, Layers, CheckCircle2 } from "lucide-react";

export const MethodologyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] dark:border-[#2D3339] pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950/80 text-[#0D6E6E] dark:text-teal-300">
          <BookOpen className="w-3.5 h-3.5" />
          Protocol Specification &amp; Rubric
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#111827] dark:text-[#F3F4F6]">
          LinguaProof Auditing Methodology
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          How decentralized validator consensus achieves unbiased translation fidelity notarization on {CHAIN_CONFIG.networkName}.
        </p>
      </div>

      {/* 1. Two-Step LLM Validator Protocol */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0D6E6E] text-white text-xs flex items-center justify-center font-sans font-semibold">
            1
          </span>
          The Two-Step Validator Protocol
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Evaluating translations directly by comparing source and target creates confirmation bias: LLMs often assume a human translator translated competently. LinguaProof eliminates this through a strict two-step execution pipeline:
        </p>

        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] space-y-2 shadow-sm">
            <div className="text-xs font-bold text-[#0D6E6E] dark:text-teal-400 uppercase tracking-wider">
              Step A: Blind Back-Translation
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Validators receive <em>only</em> the candidate target translation. Without ever seeing the original source segment, the validator reverse-translates the text back into the source language. This produces an unanchored semantic representation of what the target text actually conveys.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] space-y-2 shadow-sm">
            <div className="text-xs font-bold text-[#0D6E6E] dark:text-teal-400 uppercase tracking-wider">
              Step B: Monolingual Rubric Comparison
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The original source segment is compared against the back-translation produced in Step A. Both texts now exist in the <em>same</em> language, turning cross-lingual evaluation into a deterministic semantic comparison governed by a closed defect rubric.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Defect Rubric & Severities */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0D6E6E] text-white text-xs flex items-center justify-center font-sans font-semibold">
            2
          </span>
          Closed-Enumeration Defect Rubric
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Validators classify each segment into exactly one closed-enumeration verdict. Any non-preserved finding mandates explicit quote extraction from both source and back-translation to provide evidentiary auditability:
        </p>

        <div tabIndex={0} role="region" aria-label="Rubric classification table" className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#2D3339] bg-white dark:bg-[#181C20] shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F0] dark:bg-[#13171A] text-slate-700 dark:text-slate-300 font-semibold border-b border-[#E5E7EB] dark:border-[#2D3339]">
              <tr>
                <th className="py-2.5 px-4">Verdict Label</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Evaluation Definition</th>
                <th className="py-2.5 px-4">Preserved Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2D3339] text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">PRESERVED</td>
                <td className="py-2.5 px-4">0</td>
                <td className="py-2.5 px-4">All semantic propositions, entities, and conditions accurately maintained.</td>
                <td className="py-2.5 px-4">1.0 segment</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">SHIFTED</td>
                <td className="py-2.5 px-4">1</td>
                <td className="py-2.5 px-4">Minor tone, register, or stylistic divergence without altering substantive obligations.</td>
                <td className="py-2.5 px-4">0.0 segments</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-orange-700 dark:text-orange-400">DISTORTED</td>
                <td className="py-2.5 px-4">2</td>
                <td className="py-2.5 px-4">Core semantic assertion altered, inverted, or substantive clause reversed.</td>
                <td className="py-2.5 px-4">0.0 segments</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">OMITTED</td>
                <td className="py-2.5 px-4">3</td>
                <td className="py-2.5 px-4">Essential condition, actor, threshold, or consequence missing from target.</td>
                <td className="py-2.5 px-4">0.0 segments</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">ADDED</td>
                <td className="py-2.5 px-4">3</td>
                <td className="py-2.5 px-4">Extraneous claim, condition, or obligation inserted that does not exist in source.</td>
                <td className="py-2.5 px-4">0.0 segments</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-purple-700 dark:text-purple-400">ANCHOR_ALTERED</td>
                <td className="py-2.5 px-4">4</td>
                <td className="py-2.5 px-4">Deterministic entity (hex address, URL, amount, ISO date) altered or substituted.</td>
                <td className="py-2.5 px-4">0.0 segments</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">UNCLEAR</td>
                <td className="py-2.5 px-4">0</td>
                <td className="py-2.5 px-4">Ambiguous phrasing. Counts as 0.5 preserved segment. Triggers INCONCLUSIVE if &gt;25%.</td>
                <td className="py-2.5 px-4">0.5 segment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Score Formula & Classification */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0D6E6E] text-white text-xs flex items-center justify-center font-sans font-semibold">
            3
          </span>
          Score Formula &amp; Fidelity Classification
        </h2>
        <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] font-mono text-xs space-y-2">
          <div className="text-slate-900 dark:text-slate-100 font-bold">
            Score Calculation:
          </div>
          <div className="p-2.5 bg-white dark:bg-black/30 rounded border border-slate-200 dark:border-slate-800">
            <code>round_half_to_even(100 * (count(PRESERVED) + 0.5 * count(UNCLEAR)) / total_segments)</code>
          </div>
          <p className="text-[11px] font-sans text-slate-700 dark:text-slate-300">
            Python 3 round-half-to-even is applied identically across contract execution, unit tests, and the dApp UI.
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
            <div className="font-bold text-emerald-800 dark:text-emerald-200">FAITHFUL</div>
            <div className="text-emerald-800 dark:text-emerald-300 font-medium mt-1">Score: 90–100</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">High fidelity audit record</div>
          </div>
          <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
            <div className="font-bold text-amber-800 dark:text-amber-200">MINOR_SHIFT</div>
            <div className="text-amber-900 dark:text-amber-300 font-medium mt-1">Score: 70–89</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Subtle tone or stylistic nuance</div>
          </div>
          <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40">
            <div className="font-bold text-rose-800 dark:text-rose-200">MATERIAL_LOSS</div>
            <div className="text-rose-800 dark:text-rose-300 font-medium mt-1">Score: &lt; 70</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Substantive distortion or entity alteration</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <div className="font-bold text-slate-800 dark:text-slate-200">INCONCLUSIVE</div>
            <div className="text-slate-800 dark:text-slate-300 font-medium mt-1">UNCLEAR &gt; 25%</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Excessive linguistic ambiguity</div>
          </div>
        </div>
      </section>

      {/* 4. Honest Calibration Disclosure */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0D6E6E] text-white text-xs flex items-center justify-center font-sans font-semibold">
            4
          </span>
          Calibration Findings &amp; Known Limitations
        </h2>

        <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 font-serif font-bold text-amber-900 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Transparent Calibration Accounting
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            During pre-deployment calibration on Studionet across 42 faithful control trials (14 control items × 3 repetitions):
          </p>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <li><strong>Per-Trial:</strong> 40 of 42 trials PRESERVED (95.2% fidelity across trials).</li>
            <li><strong>Per-Control:</strong> 12 of 14 controls 100% stable; 2 of 14 controls produced a false positive (F8 and F10).</li>
            <li><strong>Target Status:</strong> The per-control target (&le; 1 of 14 controls) was <strong>NOT MET</strong>.</li>
          </ul>

          <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-amber-200 dark:border-amber-900/60">
            <strong>Why did F8 and F10 diverge?</strong>
            <br />
            Control <strong>F8</strong> (vi → en) involved a shift from Vietnamese passive voice (<em>Biên bản này đã được hội đồng phê duyệt...</em>) to English active voice (<em>The council approved...</em>), which back-translated into Vietnamese active voice. The validator model flagged this topic-prominence change as a register shift (<code>SHIFTED</code>).
            <br />
            Control <strong>F10</strong> (en → vi) produced a subtle verbal aspect shift from past simple (<em>allocated</em>) to present perfect (<em>has allocated</em>), which the validator flagged as <code>SHIFTED</code>.
          </div>

          <div className="p-3 bg-white/80 dark:bg-black/30 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-sans">
            <strong>Implication for Users:</strong> An on-chain audit score is an automated fidelity audit signal, not an absolute certainty. Subtle stylistic voice or tense shifts may occasionally lower a score from 100 to 70–80. This is why LinguaProof provides built-in <strong>segment challenges</strong> and <strong>linked revisions</strong>, allowing translators to dispute false positives or refine phrasing transparently.
          </div>
        </div>
      </section>
    </div>
  );
};
