import { CHAIN_CONFIG } from "../config/chain";
import { StoredTranslation, AuditRecord, ChallengeRecord } from "./types";

interface RpcResponse<T> {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const resp = await fetch(CHAIN_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!resp.ok) {
    throw new Error(`RPC HTTP error ${resp.status}: ${resp.statusText}`);
  }

  const json: RpcResponse<T> = await resp.json();
  if (json.error) {
    throw new Error(json.error.message || `RPC error code ${json.error.code}`);
  }

  return json.result as T;
}

/**
 * Execute a read call to a contract view function via eth_call
 */
export async function contractRead<T>(functionName: string, args: unknown[] = []): Promise<T> {
  const calldata = JSON.stringify({
    function_name: functionName,
    args,
  });

  const raw = await rpcCall<string>("eth_call", [
    {
      to: CHAIN_CONFIG.activeContract,
      data: calldata,
    },
    "latest",
  ]);

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
  return await contractRead("get_meta", []);
}

export async function fetchTranslationIds(offset: number = 0, limit: number = 10): Promise<string[]> {
  return await contractRead<string[]>("list_translation_ids", [offset, limit]);
}

export async function fetchTranslation(translationId: string): Promise<StoredTranslation> {
  const raw = await contractRead<any>("get_translation", [translationId]);
  if (!raw) {
    throw new Error("translation not found");
  }

  return {
    id: raw.id,
    label: raw.label,
    translator: raw.translator,
    sourceLang: raw.source_lang,
    targetLang: raw.target_lang,
    pairs: raw.pairs || [],
    segmentCount: raw.seg_count ?? raw.pairs?.length ?? 0,
    totalChars: raw.total_chars ?? 0,
    registeredAt: raw.registered_at,
    latestScore: raw.latest_score ?? null,
    effectiveScore: raw.effective_score ?? raw.latest_score ?? null,
    latestFidelityClass: raw.latest_class ?? null,
    effectiveFidelityClass: raw.effective_class ?? raw.latest_class ?? null,
    parentId: raw.parent_id || null,
    childId: raw.child_id || null,
    auditCount: raw.audit_count ?? 0,
    challengeCount: raw.challenge_count ?? 0,
  };
}

export async function fetchAudits(
  translationId: string,
  offset: number = 0,
  limit: number = 20
): Promise<AuditRecord[]> {
  const rawList = await contractRead<any[]>("get_audits", [translationId, offset, limit]);
  if (!Array.isArray(rawList)) return [];

  return rawList.map((r, i) => ({
    auditId: `${translationId}-audit-${i}`,
    translationId,
    auditor: r.auditor || "0x0000000000000000000000000000000000000000",
    score: r.score ?? 0,
    fidelityClass: r.fidelity_class || "MATERIAL_LOSS",
    severities: r.severities || [],
    labels: r.labels || [],
    backTranslations: r.back_translations || [],
    quotes: r.quotes || [],
    anchorResults: r.anchor_results || [],
    auditedAt: r.audited_at || new Date().toISOString(),
    txHash: r.tx_hash || "",
    agreement: r.agreement || "3/5",
  }));
}

export async function fetchChallenges(
  translationId: string,
  offset: number = 0,
  limit: number = 20
): Promise<ChallengeRecord[]> {
  const rawList = await contractRead<any[]>("get_challenges", [translationId, offset, limit]);
  if (!Array.isArray(rawList)) return [];

  return rawList.map((c, i) => ({
    challengeId: `${translationId}-challenge-${i}`,
    translationId,
    segmentIndex: c.segment_index ?? 0,
    challenger: c.challenger || "0x0000000000000000000000000000000000000000",
    reason: c.reason || "",
    decision: c.decision || "DISMISSED",
    challengerAgreed: c.decision === "UPHELD",
    challengedAt: c.challenged_at || new Date().toISOString(),
    txHash: c.tx_hash || "",
    agreement: c.agreement || "3/5",
  }));
}

export async function fetchLineage(translationId: string): Promise<string[]> {
  return await contractRead<string[]>("get_lineage", [translationId]);
}
