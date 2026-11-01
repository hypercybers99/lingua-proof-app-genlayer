import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const PROD_URL = process.env.PROD_URL || "https://lingua-proof-app-genlayer.vercel.app";

const ROUTES = [
  { name: "Landing", path: "/" },
  { name: "Translations", path: "/translations" },
  { name: "Detail", path: "/t/f22eb2aaccbe" },
  { name: "Register", path: "/register" },
  { name: "Methodology", path: "/method" },
  { name: "Evidence", path: "/evidence" },
  { name: "Wallet", path: "/wallet" },
];

const PRESETS = [
  { device: "desktop", presetFlag: "--preset=desktop" },
  { device: "mobile", presetFlag: "" },
];

const tmpOutput = path.join(process.cwd(), "tmp_lh.json");

console.log(`Running Lighthouse accessibility audits against ${PROD_URL}...\n`);

const results = [];

for (const preset of PRESETS) {
  for (const route of ROUTES) {
    const targetUrl = `${PROD_URL}${route.path}`;
    const timestamp = new Date().toISOString();
    process.stdout.write(`Auditing [${preset.device}] ${route.name} (${targetUrl})... `);

    try {
      if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

      const cmd = `npx lighthouse "${targetUrl}" --chrome-flags="--headless" --output=json --output-path="${tmpOutput}" --only-categories=accessibility ${preset.presetFlag}`;
      execSync(cmd, { stdio: "pipe", timeout: 120000 });

      if (fs.existsSync(tmpOutput)) {
        const raw = JSON.parse(fs.readFileSync(tmpOutput, "utf8"));
        const score = Math.round((raw.categories?.accessibility?.score ?? 0) * 100);
        console.log(`Score: ${score}`);
        results.push({
          route: route.name,
          url: targetUrl,
          device: preset.device,
          accessibilityScore: score,
          timestamp,
        });
      } else {
        console.log("Failed (no output file)");
        results.push({
          route: route.name,
          url: targetUrl,
          device: preset.device,
          accessibilityScore: null,
          timestamp,
          error: "No output file produced",
        });
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
      results.push({
        route: route.name,
        url: targetUrl,
        device: preset.device,
        accessibilityScore: null,
        timestamp,
        error: err.message,
      });
    }
  }
}

if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

fs.writeFileSync("docs/lighthouse_results.json", JSON.stringify(results, null, 2), "utf8");

console.log("\n================ LIGHTHOUSE ACCESSIBILITY RESULTS ================");
console.table(
  results.map((r) => ({
    Route: r.route,
    Device: r.device,
    "Score / 100": r.accessibilityScore,
    Timestamp: r.timestamp,
  }))
);
