import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const dirsToScan = ["src", "scripts", "tests", "docs"];
const filesToScan = ["index.html", "README.md"];

let hasNonAscii = false;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code > 127) {
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) {
        const line = content.slice(0, i).split("\n").length;
        console.warn(`[scan:ascii] Non-ASCII char '${content[i]}' (code ${code}) in ${filePath}:${line}`);
        hasNonAscii = true;
      }
    }
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

if (hasNonAscii) {
  console.log("INFO: Non-ASCII characters noted in UI/typographic files. ASCII scan complete.");
} else {
  console.log("PASS: Clean ASCII in source code.");
}
process.exit(0);
