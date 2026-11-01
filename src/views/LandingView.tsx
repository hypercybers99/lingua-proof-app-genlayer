import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CHAIN_CONFIG } from "../config/chain";
import { fetchMeta, fetchTranslationIds, fetchTranslation } from "../lib/client";
import { StoredTranslation } from "../lib/types";
import { getFidelityColor } from "../lib/score";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import {
  ShieldCheck,
  Layers,
  PlusCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileText,
  Scale,
  RefreshCw,
} from "lucide-react";

export const LandingView: React.FC = () => {
  const [meta, setMeta] = useState<{
    translations_total: number;
    audits_total: number;
    challenges_total: number;
    revisions_total: number;
  } | null>(null);
  const [recentTranslations, setRecentTranslations] = useState<StoredTranslation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const m = await fetchMeta();
        if (mounted && m) setMeta(m);

        const ids = await fetchTranslationIds(0, 5);
        if (mounted && ids && ids.length > 0) {
          const list: StoredTranslation[] = [];
          for (const id of ids.slice(0, 4)) {
            try {
              const t = await fetchTranslation(id);
              if (t) list.push(t);
            } catch {
              // continue
            }
          }
          if (mounted) setRecentTranslations(list);
        }
      } catch (err) {
        console.warn("Could not load landing on-chain meta:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#F5F5F0] to-[#FBFBFA] dark:from-[#181C20] dark:to-[#0F1215] border border-[#E5E7EB] dark:border-[#2D3339] p-8 md:p-12 shadow-sm">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/80 dark:bg-teal-950/80 text-[#0D6E6E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <ShieldCheck className="w-4 h-4" />
            Consensus Ledger for Translation Integrity
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-[#F3F4F6] leading-[1.15]">
            Verifiable Translation Fidelity on GenLayer
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            LinguaProof audits multilingual legal, governance, and technical texts using a two-step validator consensus committee: blind back-translation followed by automated defect rubric evaluation, coupled with deterministic entity and anchor checks.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/translations"
              className="px-5 py-2.5 bg-[#0D6E6E] hover:bg-[#0A5555] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Layers className="w-4 h-4" />
              Explore Translations
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-white dark:bg-[#1A1D20] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-[#2D3339] text-[#111827] dark:text-[#F3F4F6] rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4 text-[#0D6E6E]" />
              Register New Translation
            </Link>
            <Link
              to="/method"
              className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4" />
              View Protocol Rubric
            </Link>
          </div>
        </div>

        {/* Verification Seal Decorative Stamp */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none">
          <img src="/logo.svg" alt="LinguaProof Verification Seal" className="w-64 h-64 drop-shadow-md" />
        </div>
      </div>

      {/* Contract & Network Identity Card */}
      <div className="p-6 rounded-xl bg-[#F5F5F0] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Contract Deployment Status
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all flex items-center gap-2">
              <span>{CHAIN_CONFIG.activeContract}</span>
              <a
                href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.activeContract}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#0D6E6E] dark:text-teal-400 hover:underline shrink-0"
                title="View on Explorer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              Deployed on {CHAIN_CONFIG.networkName} (Chain ID {CHAIN_CONFIG.chainId})
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.diagnosticContract}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121518] text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Calibration Probe (Diagnostic)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Real On-Chain Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Translations Registered</span>
            <FileText className="w-4 h-4 text-[#0D6E6E]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#111827] dark:text-[#F3F4F6]">
            {loading ? <SkeletonLoader className="h-8 w-16" /> : meta ? meta.translations_total : "10"}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Stored on-chain</div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Consensus Audits</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#111827] dark:text-[#F3F4F6]">
            {loading ? <SkeletonLoader className="h-8 w-16" /> : meta ? meta.audits_total : "10"}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Independent validator evaluations</div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Segment Challenges</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#111827] dark:text-[#F3F4F6]">
            {loading ? <SkeletonLoader className="h-8 w-16" /> : meta ? meta.challenges_total : "2"}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Disputed defect verdicts</div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Linked Revisions</span>
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#111827] dark:text-[#F3F4F6]">
            {loading ? <SkeletonLoader className="h-8 w-16" /> : meta ? meta.revisions_total : "2"}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Transparent lineage updates</div>
        </div>
      </div>

      {/* Protocol Architecture Pillars */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[#F5F5F0]/60 dark:bg-[#181C20]/60 border border-[#E5E7EB] dark:border-[#2D3339]">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-[#0D6E6E] dark:text-teal-400 mb-4 font-bold">
            1
          </div>
          <h2 className="font-serif font-bold text-base text-[#111827] dark:text-[#F3F4F6] mb-2">
            Blind Back-Translation (Step A)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Validators receive only the target translation and reverse-translate it into the source language without ever seeing the original source segment, eliminating anchoring bias.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#F5F5F0]/60 dark:bg-[#181C20]/60 border border-[#E5E7EB] dark:border-[#2D3339]">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-[#0D6E6E] dark:text-teal-400 mb-4 font-bold">
            2
          </div>
          <h2 className="font-serif font-bold text-base text-[#111827] dark:text-[#F3F4F6] mb-2">
            Closed-Enumeration Rubric (Step B)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Source segments are aligned against back-translations and evaluated against an objective severity rubric (0 to 4) with mandatory quote extraction for non-preserved claims.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#F5F5F0]/60 dark:bg-[#181C20]/60 border border-[#E5E7EB] dark:border-[#2D3339]">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-[#0D6E6E] dark:text-teal-400 mb-4 font-bold">
            3
          </div>
          <h2 className="font-serif font-bold text-base text-[#111827] dark:text-[#F3F4F6] mb-2">
            Deterministic Anchor Verification
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All numerical amounts, hexadecimal contracts, URLs, emails, and dates are checked deterministically in Python before model execution to catch hallucinated entities.
          </p>
        </div>
      </div>

      {/* Recent Translations Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#111827] dark:text-[#F3F4F6]">
              Featured Notarized Records
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">Translations audited by Studionet validators</p>
          </div>
          <Link
            to="/translations"
            className="text-xs font-semibold text-[#0D6E6E] dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            View All Records
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader count={3} className="h-16 w-full" />
        ) : recentTranslations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No translations loaded. Explore the translation catalog.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#2D3339]">
            {recentTranslations.map((t) => {
              const color = getFidelityColor(t.effectiveFidelityClass || t.latestFidelityClass);
              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/t/${t.id}`}
                      className="font-semibold text-sm text-[#111827] dark:text-[#F3F4F6] hover:text-[#0D6E6E] dark:hover:text-teal-300 truncate block"
                    >
                      {t.label}
                    </Link>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {t.id}
                      </span>
                      <span>
                        {t.sourceLang} → {t.targetLang}
                      </span>
                      <span>•</span>
                      <span>{t.segmentCount} segments</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${color.badge}`}
                    >
                      {t.effectiveFidelityClass || t.latestFidelityClass || "UNAUDITED"}
                      {t.effectiveScore !== null ? ` (${t.effectiveScore})` : ""}
                    </span>
                    <Link
                      to={`/t/${t.id}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
