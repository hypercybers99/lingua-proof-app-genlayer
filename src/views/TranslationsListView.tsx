import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchTranslationIds, fetchTranslation } from "../lib/client";
import { StoredTranslation, FidelityClass } from "../lib/types";
import { getFidelityColor } from "../lib/score";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { CHAIN_CONFIG } from "../config/chain";
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Layers, PlusCircle } from "lucide-react";

export const TranslationsListView: React.FC = () => {
  const [translations, setTranslations] = useState<StoredTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedLang, setSelectedLang] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "score" | "segments">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const pageSize = 10;

  useEffect(() => {
    let mounted = true;
    async function loadTranslations() {
      setLoading(true);
      try {
        // Fetch up to 50 translation IDs from contract
        const ids = await fetchTranslationIds(0, 50);
        if (mounted && ids && ids.length > 0) {
          const list: StoredTranslation[] = [];
          for (const id of ids) {
            try {
              const t = await fetchTranslation(id);
              if (t) list.push(t);
            } catch {
              // continue
            }
          }
          if (mounted) setTranslations(list);
        }
      } catch (err) {
        console.warn("Could not load translations from contract:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTranslations();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return translations.filter((t) => {
      // Search filter
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.label.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.translator.toLowerCase().includes(q);

      // Class filter
      const c = t.effectiveFidelityClass || t.latestFidelityClass || "UNAUDITED";
      const matchesClass = selectedClass === "ALL" || c === selectedClass;

      // Language filter
      const matchesLang =
        selectedLang === "ALL" ||
        t.sourceLang.toLowerCase() === selectedLang.toLowerCase() ||
        t.targetLang.toLowerCase() === selectedLang.toLowerCase();

      return matchesSearch && matchesClass && matchesLang;
    });
  }, [translations, search, selectedClass, selectedLang]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortBy === "score") {
        const scoreA = a.effectiveScore ?? -1;
        const scoreB = b.effectiveScore ?? -1;
        return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
      }
      if (sortBy === "segments") {
        return sortOrder === "asc"
          ? a.segmentCount - b.segmentCount
          : b.segmentCount - a.segmentCount;
      }
      // default: date
      return sortOrder === "asc"
        ? a.registeredAt.localeCompare(b.registeredAt)
        : b.registeredAt.localeCompare(a.registeredAt);
    });
    return list;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#2D3339] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
            Translation Explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse and inspect registered translation fidelity notary records on {CHAIN_CONFIG.networkName}
          </p>
        </div>
        <Link
          to="/register"
          className="px-4 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] text-white rounded-lg text-sm font-semibold flex items-center gap-2 self-start transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Register Translation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by title, 12-hex ID, or submitter address..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Filter by Fidelity Class */}
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Fidelity Verdicts</option>
            <option value="FAITHFUL">FAITHFUL (90–100)</option>
            <option value="MINOR_SHIFT">MINOR_SHIFT (70–89)</option>
            <option value="MATERIAL_LOSS">MATERIAL_LOSS (&lt;70)</option>
            <option value="INCONCLUSIVE">INCONCLUSIVE</option>
          </select>

          {/* Filter by Language */}
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Languages</option>
            {CHAIN_CONFIG.supportedLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>

          {/* Sort By */}
          <button
            type="button"
            onClick={() => {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            }}
            className="p-2 bg-white dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1 text-xs"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Translations List Table */}
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2D3339] bg-white dark:bg-[#181C20] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader count={5} className="h-16 w-full" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-400" />
            <div className="text-base font-semibold">No translations matched your criteria</div>
            <p className="text-xs">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F5F0] dark:bg-[#13171A] text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-[#E5E7EB] dark:border-[#2D3339]">
                <tr>
                  <th className="py-3 px-4">Title &amp; ID</th>
                  <th className="py-3 px-4">Languages</th>
                  <th className="py-3 px-4">Segments</th>
                  <th className="py-3 px-4">Score &amp; Verdict</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2D3339]">
                {paginated.map((t) => {
                  const status = t.effectiveFidelityClass || t.latestFidelityClass;
                  const score = t.effectiveScore ?? t.latestScore;
                  const color = getFidelityColor(status);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <Link
                          to={`/t/${t.id}`}
                          className="hover:text-[#0D6E6E] dark:hover:text-teal-300 font-semibold block text-sm"
                        >
                          {t.label}
                        </Link>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          ID: {t.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.sourceLang} → {t.targetLang}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {t.segmentCount} segments
                      </td>
                      <td className="py-3.5 px-4">
                        {status ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color.badge}`}
                          >
                            <span>{status}</span>
                            <span>•</span>
                            <span>{score !== null ? score : "N/A"}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unaudited</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {t.parentId ? (
                          <Link
                            to={`/t/${t.parentId}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Child of {t.parentId}
                          </Link>
                        ) : t.childId ? (
                          <Link
                            to={`/t/${t.childId}`}
                            className="text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            Revised into {t.childId}
                          </Link>
                        ) : (
                          <span>Original</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/t/${t.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Inspect Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#2D3339] flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {Math.min(filtered.length, page * pageSize + 1)} to{" "}
            {Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length} translations
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
