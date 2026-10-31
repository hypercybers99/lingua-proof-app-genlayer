import { createClient, chains } from "genlayer-js";
import { CHAIN_CONFIG } from "../config/chain";
import { StoredTranslation, AuditRecord, ChallengeRecord, FidelityClass } from "./types";

const client = createClient({
  chain: chains.studionet,
});

/**
 * Execute a read call to a contract view function via genlayer-js readContract
 */
export async function contractRead<T>(functionName: string, args: any[] = []): Promise<T> {
  const raw = await client.readContract({
    address: CHAIN_CONFIG.activeContract,
    functionName,
    args,
  });

  if (raw === null || raw === undefined) {
    return null as unknown as T;
  }

  try {
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function fetchMeta(): Promise<{
  translations_total: number;
  audits_total: number;
  challenges_total: number;
  revisions_total: number;
}> {
  const raw = await contractRead<any>("get_meta", []);
  return {
    translations_total: Number(raw?.translations_total ?? 0),
    audits_total: Number(raw?.audits_total ?? 0),
    challenges_total: Number(raw?.challenges_total ?? 0),
    revisions_total: Number(raw?.revisions_total ?? 0),
  };
}

export async function fetchTranslationIds(offset: number = 0, limit: number = 10): Promise<string[]> {
  const raw = await contractRead<any>("list_translation_ids", [offset, limit]);
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.ids)) return raw.ids;
  return [];
}

export async function fetchTranslation(translationId: string): Promise<StoredTranslation> {
  const raw = await contractRead<any>("get_translation", [translationId]);
  if (!raw) {
    throw new Error("translation not found");
  }

  return {
    id: raw.id,
    label: raw.label || `Translation ${raw.id.slice(0, 8)}`,
    translator: raw.translator,
    sourceLang: raw.source_lang,
    targetLang: raw.target_lang,
    pairs: (raw.pairs || []).map((p: any) => ({
      src: p.src || "",
      tgt: p.tgt || "",
      anchor: p.anchor || "ANCHORS_OK",
      anchorDetail: p.anchor_detail || [],
    })),
    segmentCount: raw.pairs?.length ?? 0,
    totalChars: (raw.pairs || []).reduce((acc: number, p: any) => acc + (p.src?.length || 0) + (p.tgt?.length || 0), 0),
    registeredAt: raw.registered_at,
    latestScore: raw.latest_score !== undefined && raw.latest_score >= 0 ? raw.latest_score : null,
    effectiveScore: raw.effective_score !== undefined && raw.effective_score >= 0 ? raw.effective_score : null,
    latestFidelityClass: (raw.latest_class || null) as FidelityClass | null,
    effectiveFidelityClass: (raw.effective_class || null) as FidelityClass | null,
    parentId: raw.parent_id || null,
    childId: (raw.children && raw.children.length > 0) ? raw.children[0] : null,
    auditCount: raw.audits_total ?? 0,
    challengeCount: raw.challenges_total ?? 0,
  };
}

export async function fetchAudits(
  translationId: string,
  offset: number = 0,
  limit: number = 20
): Promise<AuditRecord[]> {
  const raw = await contractRead<any>("get_audits", [translationId, offset, limit]);
  const rawList = Array.isArray(raw) ? raw : (raw?.items || []);
  if (!Array.isArray(rawList)) return [];

  return rawList.map((r: any, i: number) => ({
    auditId: `${translationId}-audit-${r.n ?? i}`,
    translationId,
    auditor: r.auditor || "0x0000000000000000000000000000000000000000",
    score: r.score ?? 0,
    fidelityClass: (r.class || "MATERIAL_LOSS") as FidelityClass,
    severities: (r.segments || []).map((s: any) => s.severity ?? 0),
    labels: (r.segments || []).map((s: any) => s.label || "PRESERVED"),
    backTranslations: (r.segments || []).map((s: any) => s.back_translation || ""),
    quotes: (r.segments || []).map((s: any) => ({ src: s.src_quote || "", back: s.back_quote || "" })),
    anchorResults: (r.segments || []).map((s: any) => s.anchor || "ANCHORS_OK"),
    auditedAt: r.at || new Date().toISOString(),
    txHash: r.tx_hash || "",
    agreement: r.agreement || "4/5",
  }));
}

export async function fetchChallenges(
  translationId: string,
  offset: number = 0,
  limit: number = 20
): Promise<ChallengeRecord[]> {
  const raw = await contractRead<any>("get_challenges", [translationId, offset, limit]);
  const rawList = Array.isArray(raw) ? raw : (raw?.items || []);
  if (!Array.isArray(rawList)) return [];

  return rawList.map((c: any, i: number) => ({
    challengeId: `${translationId}-challenge-${c.n ?? i}`,
    translationId,
    segmentIndex: c.segment_index ?? 0,
    challenger: c.challenger || "0x0000000000000000000000000000000000000000",
    reason: c.reason || "",
    decision: c.supersedes_latest ? ("UPHELD" as const) : ("DISMISSED" as const),
    challengerAgreed: !!c.supersedes_latest,
    challengedAt: c.at || new Date().toISOString(),
    txHash: c.tx_hash || "",
    agreement: c.agreement || "4/5",
  }));
}

export async function fetchLineage(translationId: string): Promise<any[]> {
  const raw = await contractRead<any>("get_lineage", [translationId]);
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [];
}
