import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const ZIP_NAME = "release-artifacts.zip";
const ARTIFACTS_MD = path.resolve("docs/ARTIFACTS.md");

console.log("Creating release archive...");
// Use powershell Compress-Archive
const cmd = `powershell -Command "Compress-Archive -Path 'docs/screens','docs/e2e_production_evidence.json','contracts-reference/linguaproof.py' -DestinationPath '${ZIP_NAME}' -Force"`;
execSync(cmd, { stdio: "inherit" });

const fileBuffer = fs.readFileSync(ZIP_NAME);
const hashSum = crypto.createHash("sha256");
hashSum.update(fileBuffer);
const hexHash = hashSum.digest("hex");
const sizeKb = Math.round(fileBuffer.length / 1024);

console.log(`Generated ${ZIP_NAME} (${sizeKb} KB)`);
console.log(`SHA-256: ${hexHash}`);

const repoUrl = "https://github.com/hypercybers99/lingua-proof-app-genlayer";
const releaseTag = "v1.0.0";
const releaseAssetUrl = `${repoUrl}/releases/download/${releaseTag}/${ZIP_NAME}`;

const content = `# LinguaProof Release Artifacts

This document records the downloadable archive of bulk artifacts, on-chain evidence runs, and verification screens for LinguaProof v1.0.0 on GenLayer Studionet (Preview).

## Download & Integrity

- **Release Tag**: [${releaseTag}](${repoUrl}/releases/tag/${releaseTag})
- **Archive File**: \`${ZIP_NAME}\`
- **Download URL**: [${releaseAssetUrl}](${releaseAssetUrl})
- **File Size**: ${sizeKb} KB
- **SHA-256 Checksum**:
\`\`\`
${hexHash}
\`\`\`

## Verification Command

To verify the integrity of the downloaded archive:

\`\`\`bash
# Linux / macOS
sha256sum ${ZIP_NAME}

# Windows PowerShell
Get-FileHash -Algorithm SHA256 ${ZIP_NAME}
\`\`\`

## Archive Contents

1. \`docs/screens/\`:
   - \`01_unfunded_zero_balance_guard.png\`: Zero-balance UI protection guard and test faucet guidance.
   - \`02_registered_translation_detail.png\`: Translation registration detail view with pending audit badge.
   - \`03_audited_detail.png\`: Full consensus audit result showing score 100 and FAITHFUL classification.
   - \`04_challenged_detail.png\`: Independent segment challenge overlay recording challenger claim.
   - \`05_child_revision_detail.png\`: Child revision registration detail linked to parent lineage.
   - \`06_child_audited_detail.png\`: Child revision audited on-chain with consensus verification.
   - \`07_methodology_rubric.png\`: Methodology, scoring formula, and rubric definitions.
   - \`08_evidence_scenarios.png\`: Audit scenarios viewer with complete on-chain tx hashes.
   - \`09_translations_explorer.png\`: Public registry explorer with pagination and status filters.
   - \`10_landing_overview.png\`: Landing hero, architecture diagram, and network parameters.
2. \`docs/e2e_production_evidence.json\`:
   - Full 66-character transaction hashes, validator vote distributions, latencies, and readbacks.
3. \`contracts-reference/linguaproof.py\`:
   - Pinned reference contract source matching deployed byte-hash \`36c9582c004e758503dd766fb9dbb848495b9f163138007a443c3751e456f140\`.
`;

fs.writeFileSync(ARTIFACTS_MD, content, "utf8");
console.log(`Updated ${ARTIFACTS_MD}`);
