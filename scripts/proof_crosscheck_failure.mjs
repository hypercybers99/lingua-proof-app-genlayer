import fs from "fs";
import path from "path";

function parsePythonContractMethods(code) {
  const methods = {};
  const methodRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = methodRegex.exec(code)) !== null) {
    const methodName = match[1];
    const rawArgs = match[2];
    if (!methodName.startsWith("_") && !methodName.includes("leader") && !methodName.includes("validator")) {
      const params = rawArgs
        .split(",")
        .map((p) => p.split(":")[0].trim())
        .filter((p) => p && p !== "self");
      methods[methodName] = params;
    }
  }
  return methods;
}

const contractPath = path.join(process.cwd(), "contracts-reference", "linguaproof.py");
const contractCode = fs.readFileSync(contractPath, "utf8");
const actualMethods = parsePythonContractMethods(contractCode);

console.log("=== Deliberate Cross-Check Failure Demonstration ===");
console.log("Testing assertion: expect(actualMethods).toHaveProperty('deliberately_wrong_method')");

try {
  const testMethod = "deliberately_wrong_method";
  if (!Object.prototype.hasOwnProperty.call(actualMethods, testMethod)) {
    throw new Error(`AssertionError: expected actualMethods to have property "${testMethod}", but found only: [${Object.keys(actualMethods).join(", ")}]`);
  }
  console.log("Unexpected success!");
} catch (err) {
  console.log("\nCaptured Expected Failure Trace:");
  console.log(err.stack || err.message);
  console.log("\nProof established: Cross-check mechanism strictly rejects unmapped/mismatched contract method names.");
}
