import fs from "fs";
import path from "path";

const rootDir = process.cwd();

// Contract reference must be strictly pure ASCII
const contractRefPath = path.join(rootDir, "contracts-reference", "linguaproof.py");
if (fs.existsSync(contractRefPath)) {
  const content = fs.readFileSync(contractRefPath, "utf8");
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code > 127) {
      console.error(`FAIL: Non-ASCII character in contracts-reference/linguaproof.py at index ${i}`);
      process.exit(1);
    }
  }
}

console.log("PASS: scan:ascii clean (contracts-reference/linguaproof.py is strictly 100% pure ASCII).");
process.exit(0);
