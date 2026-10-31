# LinguaProof Release Artifacts

This document records the downloadable archive of bulk artifacts, on-chain evidence runs, and verification screens for LinguaProof v1.0.0 on GenLayer Studionet (Preview).

## Download & Integrity

- **Release Tag**: [v1.0.0](https://github.com/hypercybers99/lingua-proof-app-genlayer/releases/tag/v1.0.0)
- **Archive File**: `release-artifacts.zip`
- **Download URL**: [https://github.com/hypercybers99/lingua-proof-app-genlayer/releases/download/v1.0.0/release-artifacts.zip](https://github.com/hypercybers99/lingua-proof-app-genlayer/releases/download/v1.0.0/release-artifacts.zip)
- **File Size**: 911 KB
- **SHA-256 Checksum**:
```
274935ca0e1643ee5ac59fda24eb029c95e8ba873c8301a9aac514853c88bed3
```

## Verification Command

To verify the integrity of the downloaded archive:

```bash
# Linux / macOS
sha256sum release-artifacts.zip

# Windows PowerShell
Get-FileHash -Algorithm SHA256 release-artifacts.zip
```

## Archive Contents

1. `docs/screens/`:
   - `01_unfunded_zero_balance_guard.png`: Zero-balance UI protection guard and test faucet guidance.
   - `02_registered_translation_detail.png`: Translation registration detail view with pending audit badge.
   - `03_audited_detail.png`: Full consensus audit result showing score 100 and FAITHFUL classification.
   - `04_challenged_detail.png`: Independent segment challenge overlay recording challenger claim.
   - `05_child_revision_detail.png`: Child revision registration detail linked to parent lineage.
   - `06_child_audited_detail.png`: Child revision audited on-chain with consensus verification.
   - `07_methodology_rubric.png`: Methodology, scoring formula, and rubric definitions.
   - `08_evidence_scenarios.png`: Audit scenarios viewer with complete on-chain tx hashes.
   - `09_translations_explorer.png`: Public registry explorer with pagination and status filters.
   - `10_landing_overview.png`: Landing hero, architecture diagram, and network parameters.
2. `docs/e2e_production_evidence.json`:
   - Full 66-character transaction hashes, validator vote distributions, latencies, and readbacks.
3. `contracts-reference/linguaproof.py`:
   - Pinned reference contract source matching deployed byte-hash `36c9582c004e758503dd766fb9dbb848495b9f163138007a443c3751e456f140`.
