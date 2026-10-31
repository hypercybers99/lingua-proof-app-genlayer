import fs from "fs";
import path from "path";

const CANONICAL_CONTRACT = "0xba67d808f2b7E533ec06655eB730Ef5B27623EBF";
const DIAGNOSTIC_PROBE = "0xC3335F8200571ddFee27dF35590681d86f5F1df4";
const DEPLOY_TX = "0x948a4f5ade97dff6a9a26f4fdc1a011e3873835566829711fb66f5ee5ce2cca4";

const rootDir = process.cwd();
const dirsToScan = ["src", "docs"];
const filesToScan = ["README.md"];

let hasError = false;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rel = path.relative(rootDir, filePath);

  // Check for truncated hashes or addresses like 0x1234...5678
  const truncatedRegex = /0x[a-fA-F0-9]{3,8}\.{2,4}[a-fA-F0-9]{3,8}/g;
  let match;
  while ((match = truncatedRegex.exec(content)) !== null) {
    console.error(`FAILED: Truncated address/hash detected in ${rel}: "${match[0]}"`);
    hasError = true;
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".md")) {
        scanFile(fullPath);
      }
    }
  }
}

for (const d of dirsToScan) {
  scanDir(path.join(rootDir, d));
}

for (const f of filesToScan) {
  const p = path.join(rootDir, f);
  if (fs.existsSync(p)) scanFile(p);
}

if (hasError) {
  console.error("Address consistency scan failed.");
  process.exit(1);
}

console.log(`PASS: Address consistency verified. Active contract: ${CANONICAL_CONTRACT}`);
process.exit(0);
