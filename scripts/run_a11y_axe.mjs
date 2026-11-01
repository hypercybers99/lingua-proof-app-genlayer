import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";

const PROD_URL = process.env.PROD_URL || "https://lingua-proof-app-genlayer.vercel.app";

const ROUTES = [
  { name: "Landing (/)", path: "/" },
  { name: "Translations (/translations)", path: "/translations" },
  { name: "Detail (/t/f22eb2aaccbe)", path: "/t/f22eb2aaccbe" },
  { name: "Register (/register)", path: "/register" },
  { name: "Methodology (/method)", path: "/method" },
  { name: "Evidence (/evidence)", path: "/evidence" },
  { name: "Wallet (/wallet)", path: "/wallet" },
];

const VIEWPORTS = [
  { width: 1440, height: 900, name: "1440px", darkMode: false },
  { width: 500, height: 800, name: "500px", darkMode: false },
  { width: 390, height: 844, name: "390px", darkMode: false },
  { width: 1440, height: 900, name: "1440px-dark", darkMode: true },
];

function formatViolations(violations) {
  return (violations || []).map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: (v.nodes || []).slice(0, 3).map((node) => ({
      target: Array.isArray(node.target) ? node.target.join(" ") : String(node.target),
      html: (node.html || "").trim().slice(0, 160),
    })),
  }));
}

async function run() {
  console.log(`Starting axe-core audit against ${PROD_URL}...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      await page.goto(`${PROD_URL}${route.path}`, { waitUntil: "domcontentloaded" });
      if (vp.darkMode) {
        await page.evaluate(() => document.documentElement.classList.add("dark"));
      } else {
        await page.evaluate(() => document.documentElement.classList.remove("dark"));
      }
      await page.waitForTimeout(1000);

      const axeResult = await new AxeBuilder({ page }).analyze();
      const critical = axeResult.violations.filter((v) => v.impact === "critical").length;
      const serious = axeResult.violations.filter((v) => v.impact === "serious").length;
      const moderate = axeResult.violations.filter((v) => v.impact === "moderate").length;
      const minor = axeResult.violations.filter((v) => v.impact === "minor").length;
      const total = axeResult.violations.length;

      results.push({
        type: "route",
        name: route.name,
        viewport: vp.name,
        critical,
        serious,
        moderate,
        minor,
        total,
        violations: formatViolations(axeResult.violations),
      });

      console.log(`Route [${vp.name}] ${route.name}: ${total} violations (${critical} critical, ${serious} serious)`);
    }

    // Now test open modals on detail page
    await page.goto(`${PROD_URL}/t/f22eb2aaccbe`, { waitUntil: "domcontentloaded" });
    if (vp.darkMode) {
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    } else {
      await page.evaluate(() => document.documentElement.classList.remove("dark"));
    }
    await page.waitForSelector('[data-testid="open-audit-modal-btn"]', { timeout: 45000 });

    // 1. Audit Modal
    const auditBtn = page.locator('[data-testid="open-audit-modal-btn"]');
    await auditBtn.scrollIntoViewIfNeeded();
    await auditBtn.click();
    await page.waitForSelector('[data-testid="modal-content-container"]');
    {
      const axeResult = await new AxeBuilder({ page }).analyze();
      const critical = axeResult.violations.filter((v) => v.impact === "critical").length;
      const serious = axeResult.violations.filter((v) => v.impact === "serious").length;
      const total = axeResult.violations.length;
      results.push({
        type: "modal",
        name: "Audit Modal",
        viewport: vp.name,
        critical,
        serious,
        total,
        violations: formatViolations(axeResult.violations),
      });
      console.log(`Modal [${vp.name}] Audit Modal: ${total} violations (${critical} critical, ${serious} serious)`);
      await page.locator('[data-testid="modal-close-button"]').click();
      await page.waitForTimeout(400);
    }

    // 2. Challenge Modal
    const challengeBtn = page.locator('[data-testid="open-challenge-modal-btn"]').first();
    await challengeBtn.scrollIntoViewIfNeeded();
    await challengeBtn.click();
    await page.waitForSelector('[data-testid="modal-content-container"]');
    {
      const axeResult = await new AxeBuilder({ page }).analyze();
      const critical = axeResult.violations.filter((v) => v.impact === "critical").length;
      const serious = axeResult.violations.filter((v) => v.impact === "serious").length;
      const total = axeResult.violations.length;
      results.push({
        type: "modal",
        name: "Challenge Modal",
        viewport: vp.name,
        critical,
        serious,
        total,
        violations: formatViolations(axeResult.violations),
      });
      console.log(`Modal [${vp.name}] Challenge Modal: ${total} violations (${critical} critical, ${serious} serious)`);
      await page.locator('[data-testid="modal-close-button"]').click();
      await page.waitForTimeout(400);
    }

    // 3. Revise Modal
    const reviseBtn = page.locator('[data-testid="open-revise-modal-btn"]');
    await reviseBtn.scrollIntoViewIfNeeded();
    await reviseBtn.click();
    await page.waitForSelector('[data-testid="modal-content-container"]');
    {
      const axeResult = await new AxeBuilder({ page }).analyze();
      const critical = axeResult.violations.filter((v) => v.impact === "critical").length;
      const serious = axeResult.violations.filter((v) => v.impact === "serious").length;
      const total = axeResult.violations.length;
      results.push({
        type: "modal",
        name: "Revise Modal",
        viewport: vp.name,
        critical,
        serious,
        total,
        violations: formatViolations(axeResult.violations),
      });
      console.log(`Modal [${vp.name}] Revise Modal: ${total} violations (${critical} critical, ${serious} serious)`);
      await page.locator('[data-testid="modal-close-button"]').click();
      await page.waitForTimeout(400);
    }
  }

  await browser.close();

  fs.writeFileSync("docs/axe_audit_results.json", JSON.stringify(results, null, 2));
  console.log("Saved results to docs/axe_audit_results.json");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
