export interface EvidenceScenario {
  id: string;
  title: string;
  description: string;
  langPair: string;
  segments: number;
  regTxHash: string;
  auditTxHash?: string;
  score: number;
  fidelityClass: string;
  agreement: string;
  terminalOutcome: string;
  latencySec: number;
}

export const EVIDENCE_SCENARIOS: EvidenceScenario[] = [
  {
    "id": "E1",
    "title": "Faithful Aligned Translation (en \u2192 vi)",
    "description": "Governance charter with numbers, ISO dates, URL, tickers, hex address, quoted terms.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 100,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E2",
    "title": "Faithful Aligned Translation (vi \u2192 en)",
    "description": "Reserve asset notice with Vietnamese diacritics, currencies, dates, and addresses.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 100,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E3",
    "title": "Altered Numeric Amount (Deterministic Anchor Catch)",
    "description": "Changed 50,000 USD to 5,000 USD; caught deterministically by code as ANCHOR_ALTERED.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 50,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E4",
    "title": "Flipped Negation / Permission Reversal (Model Catch)",
    "description": "Translated \"must not execute\" to \"can execute\"; detected as DISTORTED with verified quotes.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 50,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E5",
    "title": "Dropped Security Clause (Model Catch)",
    "description": "Completely omitted the slashing consequence clause; detected as OMITTED.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 50,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E6",
    "title": "Tone Shift in Formal Notice (Model Catch)",
    "description": "Converted formal governance notice into casual slang; detected as SHIFTED.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 50,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E7",
    "title": "Revision Lineage Flow (Repairing E3)",
    "description": "Revised defective translation b4d849b635a7 with corrected amount; audited to FAITHFUL.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 100,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E8",
    "title": "Targeted Segment Challenges (E1 Faithful & E4 Distortion)",
    "description": "Challenged faithful E1 (upheld original) and contested distorted E4 with corrected prohibition.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 50,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  },
  {
    "id": "E10",
    "title": "Fractional Fidelity Score Demonstration (8 Segments)",
    "description": "8-segment translation: 5 PRESERVED (sev 0), 2 SHIFTED (sev 1), 1 OMITTED (sev 3); score = round(100 * 5 / 8) = 62.",
    "langPair": "en -> vi",
    "segments": 2,
    "regTxHash": "",
    "auditTxHash": "",
    "score": 62,
    "fidelityClass": "MATERIAL_LOSS",
    "agreement": "3/5",
    "terminalOutcome": "Accepted by validators (3/5 agreed) - state applied",
    "latencySec": 30
  }
];
