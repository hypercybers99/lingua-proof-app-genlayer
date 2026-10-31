import fs from "fs";
import path from "path";
import crypto from "crypto";

const EXPECTED_CONTRACTS = [
  {
    name: "linguaproof.py",
    expectedSha256: "36c9582c004e758503dd766fb9dbb848495b9f163138007a443c3751e456f140",
  },
];

let hasError = false;

for (const contract of EXPECTED_CONTRACTS) {
  const filePath = path.join(process.cwd(), "contracts-reference", contract.name);

  if (!fs.existsSync(filePath)) {
    console.error(`FAILED: Reference contract not found at ${filePath}`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath);
  const actualSha256 = crypto.createHash("sha256").update(content).digest("hex");

  if (actualSha256 !== contract.expectedSha256) {
    console.error(`FAILED: Reference contract ${contract.name} SHA-256 mismatch!`);
    console.error(`  Expected: ${contract.expectedSha256}`);
    console.error(`  Actual:   ${actualSha256}`);
    hasError = true;
  } else {
    console.log(`PASS: Reference contract ${contract.name} matches canonical SHA-256 (${actualSha256}).`);
  }
}

if (hasError) {
  process.exit(1);
}

process.exit(0);
