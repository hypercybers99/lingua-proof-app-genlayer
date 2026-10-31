import fs from "fs";
import path from "path";

const BANNED_PATTERNS = [
  { pattern: /\bcryptographic\s+proof\b/i, name: "cryptographic proof" },
  { pattern: /\btamper-?proof\b/i, name: "tamper-proof" },
  { pattern: /\bbytecode\b/i, name: "bytecode" },
  { pattern: /\btestnet\b/i, name: "testnet" },
  { pattern: /\blive\s+network\b/i, name: "live network" },
  { pattern: /\blive\s+(statistics|records?|translations?|data|chain)\b/i, name: "live descriptor" },
  { pattern: /\bauthentic\b/i, name: "authentic" },
  { pattern: /\bContract\s+Byte\s+SHA-256\b/i, name: "Contract Byte SHA-256" },
  { pattern: /\bunanimous(ly)?\b/i, name: "unanimous" },
  { pattern: /\brevolutionary\b/i, name: "revolutionary" },
  { pattern: /\bimmutable\b/i, name: "immutable" },
  { pattern: /\bprevents?\b/i, name: "prevents" },
  { pattern: /\bguarantees?\b/i, name: "guarantee(s)" },
  { pattern: /\btrustless\b/i, name: "trustless" },
  { pattern: /\bWCAG\s+compliant\b/i, name: "WCAG compliant" },
  { pattern: /\bFinalized\s*\(/i, name: "Finalized (" },
  {
    pattern: /\b(the\s+first\s+(?:contract|platform|system|implementation|dapp)|the\s+only\s+(?:contract|platform|system|implementation|solution)|no\s+one\s+else)\b/i,
    name: "exclusivity claim",
  },
];

const rootDir = process.cwd();
const dirsToScan = ["src", "docs"];
const filesToScan = ["index.html", "README.md"];

let violations = [];

function isAllowedFinalizedUsage(filePath, line) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");

  // Allow in txLifecycle.ts when mapping raw status_name / receipt status from GenVM
  if (relPath.includes("txLifecycle") || relPath.includes("chain.ts")) {
    if (
      line.includes("statusName") ||
      line.includes("status_name") ||
      line.includes("rawStatus") ||
      line.includes("FINALIZED")
    ) {
      return true;
    }
  }

  // Allow in evidence tables when quoting raw status in designated raw status column
  if (relPath.includes("EVIDENCE") || relPath.includes("Evidence")) {
    if (line.includes("`FINALIZED`") || line.includes("FINALIZED")) {
      return true;
    }
  }

  return false;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (filePath.endsWith("scan_banned.mjs")) return;

    for (const rule of BANNED_PATTERNS) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          name: rule.name,
          text: line.trim(),
        });
      }
    }

    if (/\bfinalized\b/i.test(line)) {
      if (!isAllowedFinalizedUsage(filePath, line)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          name: "user-facing 'finalized' (must use 'Accepted by validators')",
          text: line.trim(),
        });
      }
    }
  });
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
      scanFile(fullPath);
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

if (violations.length > 0) {
  console.error(`FAILED: ${violations.length} banned word/phrase violation(s) detected:`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} - [${v.name}] "${v.text}"`);
  });
  process.exit(1);
}

console.log("PASS: Zero banned words detected across codebase and docs.");
process.exit(0);
