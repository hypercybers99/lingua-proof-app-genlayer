import fs from "fs";
import path from "path";

const SECRET_PATTERNS = [
  { pattern: /(?:private[_-]?key|secret)\s*[:=]\s*["'](0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})["']/i, name: "Hardcoded Private Key" },
  { pattern: /(?:api[_-]?key|auth[_-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/i, name: "API Key / Token" },
  { pattern: /\b(?:mnemonic|seed\s+phrase)\s*[:=]\s*["'][a-zA-Z\s]{20,}["']/i, name: "Mnemonic seed phrase" },
];

const rootDir = process.cwd();
const dirsToScan = ["src", "scripts", "tests", "docs"];
const filesToScan = ["index.html", "README.md", "package.json"];

let violations = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (filePath.endsWith("scan_secrets.mjs")) return;

    for (const rule of SECRET_PATTERNS) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          name: rule.name,
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
  console.error(`FAILED: ${violations.length} secret violation(s) detected:`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} - [${v.name}] "${v.text}"`);
  });
  process.exit(1);
}

console.log("PASS: Zero hardcoded secrets detected.");
process.exit(0);
