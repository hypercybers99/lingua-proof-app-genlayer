# LinguaProof dApp

[![Network: GenLayer Studionet (Preview)](https://img.shields.io/badge/Network-GenLayer%20Studionet%20(Preview)-0D6E6E?style=flat-square)](https://studio.genlayer.com)
[![Chain ID: 61999](https://img.shields.io/badge/Chain%20ID-61999-0A5555?style=flat-square)](https://studio.genlayer.com/api)
[![Vitest: 84 Passed](https://img.shields.io/badge/Vitest-84%20Passed-emerald?style=flat-square)](tests/)
[![Playwright: 28 Passed](https://img.shields.io/badge/Playwright-28%20Passed-blue?style=flat-square)](tests/e2e.spec.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

Decentralized, consensus-audited translation fidelity ledger frontend for [LinguaProof](https://github.com/hypercybers99/lingua-proof-genlayer) on **GenLayer Studionet (Preview)**.

LinguaProof enables organizations, DAOs, and translation teams to audit multilingual texts using a decentralized two-step LLM validator committee: blind back-translation followed by automated defect rubric evaluation, coupled with deterministic entity and anchor checks.

---

## 1. Verified Deployments & Network Constants

| Parameter | Canonical Value |
| :--- | :--- |
| **Network** | **GenLayer Studionet (Preview)** |
| **Chain ID** | `61999` |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Block Explorer** | `https://explorer-studio.genlayer.com` |
| **Faucet** | `https://faucet-studio.genlayer.com` |
| **Active Ledger Contract** | [`0xba67d808f2b7E533ec06655eB730Ef5B27623EBF`](https://explorer-studio.genlayer.com/address/0xba67d808f2b7E533ec06655eB730Ef5B27623EBF) |
| **Deploy Transaction** | [`0x948a4f5ade97dff6a9a26f4fdc1a011e3873835566829711fb66f5ee5ce2cca4`](https://explorer-studio.genlayer.com/tx/0x948a4f5ade97dff6a9a26f4fdc1a011e3873835566829711fb66f5ee5ce2cca4) |
| **Pinned Code SHA-256** | `36c9582c004e758503dd766fb9dbb848495b9f163138007a443c3751e456f140` |
| **Calibration Probe** | [`0xC3335F8200571ddFee27dF35590681d86f5F1df4`](https://explorer-studio.genlayer.com/address/0xC3335F8200571ddFee27dF35590681d86f5F1df4) *(Diagnostic Only)* |

---

## 2. Views & Architectural Features (10 Functional States)

1. **Landing / Overview (`/`)**: Value proposition, real-time on-chain stats from `get_meta()` (translations, audits, challenges, revisions), contract status banner, protocol pillars.
2. **Translation Explorer (`/translations`)**: Filter by source/target languages, fidelity classification (FAITHFUL, MINOR_SHIFT, MATERIAL_LOSS, INCONCLUSIVE), sorting, and pagination.
3. **Translation Detail (`/t/:id`)**: Side-by-side aligned segment viewer, per-segment verdict labels (PRESERVED / SHIFTED / DISTORTED / OMITTED / ADDED / ANCHOR_ALTERED / UNCLEAR), severity indicator (0–4), detected anchor list, collapsible evidence quotes drawer, and exact score formula display.
4. **Registration Flow (`/register`)**: Document metadata form, dynamic segment pair editor (up to 12 pairs per registration), real-time pre-flight anchor comparison preview, and live submission modal.
5. **Audit Flow (`AuditModal`)**: Consensus audit dispatch with live validator polling, explorer links, timer, and readback verification.
6. **Challenge Flow (`ChallengeModal`)**: Segment contestation modal with input length validation (10–200 characters) and live consensus update.
7. **Revision Flow (`ReviseModal`)**: Linked child translation publisher with parent segment diffing and state readback.
8. **Methodology & Rubric (`/method`)**: Transparent explanation of 2-step blind back-translation, defect rubric, anchor extraction regexes, and honest disclosure of calibration findings.
9. **On-Chain Evidence Viewer (`/evidence`)**: Interactive viewer of the 10 real evidence scenarios (E1–E10) with full 66-character hashes, explorer links, scores, agreements, and latency spread analysis.
10. **Wallet & Funds Manager (`/wallet`)**: Disposable throwaway key generator, custom key import, balance display, zero-balance protection, and direct faucet access.

---

## 3. Verification & Test Suite

The dApp enforces rigorous gates before production deployment:

```bash
# 1. Full automated gate check
npm run check

# 2. Reference contract source integrity
npm run check:reference

# 3. Unit test suite (65 tests)
npm run test

# 4. End-to-end browser tests across Chromium, Firefox, WebKit, and mobile viewport
npx playwright test

# 5. Security & compliance scanners
npm run scan:ascii
npm run scan:banned
npm run scan:secrets
npm run scan:dialogs
npm run check:address
npm run verify:bundle
```

---

## 4. Visual Identity & Design System

- **Color Palette**: Light legal-document aesthetic on warm parchment (`#FBFBFA`), deep slate text (`#111827`), subtle borders (`#E5E7EB`), and deep teal accent (`#0D6E6E` / hover `#0A5555`). Full dark mode support via `prefers-color-scheme` or manual toggle.
- **Original Mark & Seal**: Official verification emblem featuring a central balance beam and pillar representing fidelity equilibrium, dual parchment scrolls symbolizing aligned source and target segments, a gold scribe's feather quill, and an antique gold wax wafer seal. Available in SVG and 1024x1024 PNG in `docs/logo/` and `public/`.
- **Accessibility & Occlusion**: ModalPortal system with explicit z-index scale, ESC to close, backdrop click handler, and zero browser alert/confirm calls.

---

## 5. Deployment

```bash
npm run build
vercel --prod
```
