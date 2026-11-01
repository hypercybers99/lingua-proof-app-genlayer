import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchTranslation, fetchAudits, fetchChallenges } from "../lib/client";
import { StoredTranslation, AuditRecord, ChallengeRecord, StoredSegmentPair } from "../lib/types";
import { getFidelityColor, computeFidelityScore } from "../lib/score";
import { extractAnchors, compareAnchors } from "../lib/anchors";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { CHAIN_CONFIG } from "../config/chain";
import { AuditModal } from "./AuditModal";
import { ChallengeModal } from "./ChallengeModal";
import { ReviseModal } from "./ReviseModal";
import {
  ShieldCheck,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Layers,
  Info,
} from "lucide-react";

export const TranslationDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [translation, setTranslation] = useState<StoredTranslation | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [challengeTargetIndex, setChallengeTargetIndex] = useState<number | null>(null);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);

  // Expanded quotes drawers for segments
  const [expandedDrawers, setExpandedDrawers] = useState<Record<number, boolean>>({});

  const toggleDrawer = (idx: number) => {
    setExpandedDrawers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTranslation(id);
      setTranslation(t);

      const [aList, cList] = await Promise.all([
        fetchAudits(id, 0, 20).catch(() => []),
        fetchChallenges(id, 0, 20).catch(() => []),
      ]);
      setAudits(aList);
      setChallenges(cList);
    } catch (err: any) {
      setError(err?.message || "Failed to load translation record from contract.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  if (loading) {
    return (
      <div className="py-8 space-y-6">
        <SkeletonLoader count={1} className="h-10 w-1/3" />
        <SkeletonLoader count={3} className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-4" data-testid="rpc-error-state">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
          RPC Network Communication Error
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {error}
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            data-testid="rpc-retry-btn"
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D6E6E] text-white rounded-lg text-sm font-semibold hover:bg-[#0A5656]"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Request
          </button>
          <Link
            to="/translations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold"
          >
            <Layers className="w-4 h-4" />
            Back to Explorer
          </Link>
        </div>
      </div>
    );
  }

  if (!translation) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
          No Record Associated With This Identifier
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested identifier "{id}" returned an empty translation record from GenLayer Studionet (Preview).
        </p>
        <Link
          to="/translations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D6E6E] text-white rounded-lg text-sm font-semibold"
        >
          <Layers className="w-4 h-4" />
          Back to Explorer
        </Link>
      </div>
    );
  }

  const latestAudit = audits[0];
  const color = getFidelityColor(translation.effectiveFidelityClass || translation.latestFidelityClass);

  // Merge segments with audit information and challenges
  const enrichedSegments: StoredSegmentPair[] = translation.pairs.map((p, idx) => {
    const auditLabel = latestAudit?.labels?.[idx];
    const severity = latestAudit?.severities?.[idx];
    const quote = latestAudit?.quotes?.[idx];
    const backTranslation = latestAudit?.backTranslations?.[idx];

    const srcAnchors = extractAnchors(p.src);
    const tgtAnchors = extractAnchors(p.tgt);
    const anchorComp = compareAnchors(srcAnchors, tgtAnchors);

    // Check if this segment was challenged
    const challenge = challenges.find((c) => c.segmentIndex === idx);

    return {
      index: idx,
      src: p.src,
      tgt: p.tgt,
      auditLabel,
      severity,
      quotes: quote ? { srcQuote: quote.src, backQuote: quote.back } : undefined,
      backTranslation,
      anchors: {
        srcAnchors,
        tgtAnchors,
        result: anchorComp.result,
      },
      effectiveChallenged: challenge?.challengerAgreed,
      challengeReason: challenge?.reason,
    };
  });

  // Calculate score breakdown
  const scoreBreakdown = computeFidelityScore(
    enrichedSegments.map((s) => ({
      label: s.auditLabel || "PRESERVED",
      severity: s.severity ?? 0,
    }))
  );

  return (
    <div className="space-y-8 py-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#2D3339] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/translations" className="hover:underline">
              Translations
            </Link>
            <span>/</span>
            <span className="font-mono">{translation.id}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
            {translation.label}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              ID: {translation.id}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {translation.sourceLang} → {translation.targetLang}
            </span>
            <span>•</span>
            <span>Submitted by {translation.translator.substring(0, 10)}...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="open-audit-modal-btn"
            onClick={() => setIsAuditModalOpen(true)}
            className="px-4 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Audit Translation
          </button>

          <button
            type="button"
            data-testid="open-revise-modal-btn"
            onClick={() => setIsReviseModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-[#1A1D20] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <GitBranch className="w-4 h-4 text-teal-600" />
            Revise Translation
          </button>
        </div>
      </div>

      {/* Score & Fidelity Banner */}
      <div className={`p-6 rounded-xl border ${color.border} ${color.bg} shadow-sm space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Consensus Fidelity Verdict
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-serif font-extrabold text-slate-900 dark:text-white">
                {translation.effectiveScore !== null ? translation.effectiveScore : "Unaudited"}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color.badge}`}>
                {translation.effectiveFidelityClass || translation.latestFidelityClass || "UNAUDITED"}
              </span>
            </div>
          </div>

          <div className="text-right sm:text-right text-xs text-slate-500 space-y-1">
            <div>
              <strong>Audits Conducted:</strong> {translation.auditCount}
            </div>
            <div>
              <strong>Segment Challenges:</strong> {translation.challengeCount}
            </div>
            {latestAudit && (
              <div className="font-mono">
                Agreement: {latestAudit.agreement} validators
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown & Exact Formula */}
        <div className="p-3.5 bg-white/80 dark:bg-black/20 rounded-lg text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 font-sans font-semibold text-slate-800 dark:text-slate-200">
            <Info className="w-4 h-4 text-[#0D6E6E]" />
            <span>Fidelity Formula:</span>
          </div>
          <div>
            Formula:{" "}
            <code>
              round(100 * (preserved_segments + 0.5 * unclear) / total_segments)
            </code>
          </div>
          <div>
            Computed:{" "}
            <strong>
              round(100 * ({scoreBreakdown.preservedSegments} + 0.5 *{" "}
              {scoreBreakdown.unclearSegments}) / {scoreBreakdown.totalSegments}) ={" "}
              {scoreBreakdown.score}
            </strong>
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Preserved segments: {scoreBreakdown.preservedSegments} | Defective segments:{" "}
            {scoreBreakdown.defectiveSegments} | Unclear: {scoreBreakdown.unclearSegments}
          </div>
        </div>
      </div>

      {/* Side-by-Side Segment Aligner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
            Aligned Segments ({translation.pairs.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click &apos;View Quotes&apos; to inspect validator evidence
          </span>
        </div>

        <div className="space-y-4">
          {enrichedSegments.map((seg) => {
            const isDrawerOpen = !!expandedDrawers[seg.index];
            const isPreserved = seg.severity === 0;

            return (
              <div
                key={seg.index}
                className="rounded-xl border border-[#E5E7EB] dark:border-[#2D3339] bg-white dark:bg-[#181C20] overflow-hidden shadow-sm"
              >
                {/* Segment Header */}
                <div className="px-5 py-3 bg-[#F5F5F0] dark:bg-[#13171A] border-b border-[#E5E7EB] dark:border-[#2D3339] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      Segment #{seg.index + 1}
                    </span>
                    {seg.auditLabel && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPreserved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {seg.auditLabel} (Severity {seg.severity ?? 0})
                      </span>
                    )}
                    {seg.effectiveChallenged && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Challenge Upheld
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="open-challenge-modal-btn"
                      onClick={() => setChallengeTargetIndex(seg.index)}
                      className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Scale className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                      Challenge
                    </button>
                    {(seg.quotes || seg.backTranslation) && (
                      <button
                        type="button"
                        onClick={() => toggleDrawer(seg.index)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition"
                      >
                        {isDrawerOpen ? "Hide Quotes" : "View Quotes"}
                        {isDrawerOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Content */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB] dark:divide-[#2D3339]">
                  {/* Source */}
                  <div className="p-5 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Source ({translation.sourceLang.toUpperCase()})
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                      {seg.src}
                    </p>
                    {seg.anchors?.srcAnchors && seg.anchors.srcAnchors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {seg.anchors.srcAnchors.map((a, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400"
                          >
                            [{a.kind}] {a.val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target */}
                  <div className="p-5 space-y-2 bg-[#FBFBFA]/50 dark:bg-[#14181B]/50">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Target ({translation.targetLang.toUpperCase()})
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                      {seg.tgt}
                    </p>
                    {seg.anchors?.tgtAnchors && seg.anchors.tgtAnchors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {seg.anchors.tgtAnchors.map((a, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400"
                          >
                            [{a.kind}] {a.val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Evidence & Quotes Drawer */}
                {isDrawerOpen && (
                  <div className="p-5 border-t border-[#E5E7EB] dark:border-[#2D3339] bg-[#F5F5F0] dark:bg-[#121518] space-y-3">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Validator Consensus Evidence
                    </div>

                    {seg.backTranslation && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-500">
                          Blind Back-Translation:
                        </span>{" "}
                        <span className="font-serif italic text-slate-800 dark:text-slate-200">
                          &quot;{seg.backTranslation}&quot;
                        </span>
                      </div>
                    )}

                    {seg.quotes && (
                      <div className="grid sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded bg-white dark:bg-[#1A1D20] border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-rose-600 block mb-1">
                            Flagged Source Quote:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {seg.quotes.srcQuote || "None flagged"}
                          </span>
                        </div>
                        <div className="p-3 rounded bg-white dark:bg-[#1A1D20] border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-rose-600 block mb-1">
                            Flagged Back Quote:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {seg.quotes.backQuote || "None flagged"}
                          </span>
                        </div>
                      </div>
                    )}

                    {seg.challengeReason && (
                      <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                        <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                          Challenger Justification:
                        </span>
                        <span className="text-amber-900 dark:text-amber-200">
                          {seg.challengeReason}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        translationId={translation.id}
        onAuditComplete={loadAll}
      />

      <ChallengeModal
        isOpen={challengeTargetIndex !== null}
        onClose={() => setChallengeTargetIndex(null)}
        translationId={translation.id}
        segmentIndex={challengeTargetIndex ?? 0}
        onChallengeComplete={loadAll}
      />

      <ReviseModal
        isOpen={isReviseModalOpen}
        onClose={() => setIsReviseModalOpen(false)}
        parentTranslation={translation}
      />
    </div>
  );
};
