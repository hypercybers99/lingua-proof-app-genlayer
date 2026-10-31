export type FidelityClass = "FAITHFUL" | "MINOR_SHIFT" | "MATERIAL_LOSS" | "INCONCLUSIVE";

export type DefectLabel = 
  | "PRESERVED"
  | "SHIFTED"
  | "DISTORTED"
  | "OMITTED"
  | "ADDED"
  | "ANCHOR_ALTERED"
  | "ANCHOR_MISSING"
  | "ANCHOR_ADDED"
  | "ANCHORS_OK"
  | "ANCHOR_UNVERIFIABLE"
  | "UNCLEAR";

export interface SegmentPair {
  src: string;
  tgt: string;
}

export interface StoredSegmentPair {
  index: number;
  src: string;
  tgt: string;
  auditLabel?: DefectLabel;
  severity?: number;
  quotes?: {
    srcQuote?: string;
    backQuote?: string;
  };
  backTranslation?: string;
  anchors?: {
    srcAnchors: Array<{ kind: string; val: string }>;
    tgtAnchors: Array<{ kind: string; val: string }>;
    result: string;
  };
  effectiveChallenged?: boolean;
  challengeReason?: string;
}

export interface StoredTranslation {
  id: string;
  label: string;
  translator: string;
  sourceLang: string;
  targetLang: string;
  pairs: SegmentPair[];
  segmentCount: number;
  totalChars: number;
  registeredAt: string;
  latestScore: number | null;
  effectiveScore: number | null;
  latestFidelityClass: FidelityClass | null;
  effectiveFidelityClass: FidelityClass | null;
  parentId?: string | null;
  childId?: string | null;
  auditCount: number;
  challengeCount: number;
  latestAuditTxHash?: string;
  latestAgreement?: string;
}

export interface AuditRecord {
  auditId: string;
  translationId: string;
  auditor: string;
  score: number;
  fidelityClass: FidelityClass;
  severities: number[];
  labels: DefectLabel[];
  backTranslations: string[];
  quotes: Array<{ src: string; back: string }>;
  anchorResults: string[];
  auditedAt: string;
  txHash: string;
  agreement: string;
}

export interface ChallengeRecord {
  challengeId: string;
  translationId: string;
  segmentIndex: number;
  challenger: string;
  reason: string;
  decision: "UPHELD" | "DISMISSED";
  challengerAgreed: boolean;
  challengedAt: string;
  txHash: string;
  agreement: string;
}

export type TxOutcomeStatus = 
  | "Accepted by validators (a/b agreed) - state applied"
  | "Validators did not agree (a/b) - state not applied"
  | "Reverted - state not applied";

export interface TxStatus {
  hash: string;
  status: "signing" | "pending" | "polling" | "success" | "disagreed" | "reverted";
  outcomeLabel?: TxOutcomeStatus;
  agreement?: string;
  error?: string;
}
