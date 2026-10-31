import fs from "fs";
import path from "path";

const CANONICAL_CONTRACT = "0xba67d808f2b7e533ec06655eb730ef5b27623ebf";

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, "dist", "assets");

if (!fs.existsSync(distAssetsDir)) {
  console.error("FAILED: dist/assets directory not found. Please run npm run build first.");
  process.exit(1);
}

const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith(".js"));

let hasActiveNotary = false;

for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(distAssetsDir, file), "utf8").toLowerCase();
  if (content.includes(CANONICAL_CONTRACT)) {
    hasActiveNotary = true;
  }
}

console.log(`Audited ${jsFiles.length} production bundle assets.`);
console.log(`Active LinguaProof Notary present: ${hasActiveNotary ? "YES" : "NO"}`);

if (!hasActiveNotary) {
  console.error("FAILED: Active LinguaProof Notary address not found in production bundle.");
  process.exit(1);
}

console.log("PASS: Bundle verified successfully. Active contract address present.");
process.exit(0);
