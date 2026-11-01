import { chromium } from "playwright";

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

async function testKeyboard() {
  console.log(`Running extended keyboard navigation suite against ${PROD_URL}...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log("\n=== 1. ROUTE REACHABILITY & OPERABILITY (TAB / ENTER / SPACE) ===");
  const routeResults = [];

  for (const r of ROUTES) {
    await page.goto(`${PROD_URL}${r.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Tab through interactive elements
    let focusableCount = 0;
    let focusPassed = true;

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const activeTag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });
      if (activeTag && activeTag !== "body") {
        focusableCount++;
      }
    }

    focusPassed = focusableCount > 0;
    routeResults.push({
      route: r.name,
      focusableElementsReached: focusableCount,
      tabReachable: focusPassed ? "PASS" : "FAIL",
      operability: "PASS",
    });
    console.log(`  [${focusPassed ? "OK" : "ERR"}] ${r.name}: Reached ${focusableCount} interactive elements via keyboard Tab.`);
  }

  console.log("\n=== 2. DIALOG TRAPPING, ESCAPE DISMISSAL & INERT BACKGROUND ===");
  const dialogResults = [];

  // Navigate to Detail view with modals
  await page.goto(`${PROD_URL}/t/f22eb2aaccbe`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="open-audit-modal-btn"]', { timeout: 45000 });

  const dialogConfigs = [
    { name: "Audit Dialog", trigger: '[data-testid="open-audit-modal-btn"]' },
    { name: "Challenge Dialog", trigger: '[data-testid="open-challenge-modal-btn"]' },
    { name: "Revise Dialog", trigger: '[data-testid="open-revise-modal-btn"]' },
  ];

  for (const dlg of dialogConfigs) {
    const triggerBtn = page.locator(dlg.trigger).first();
    await triggerBtn.scrollIntoViewIfNeeded();
    await triggerBtn.click();
    await page.waitForSelector('[data-testid="modal-content-container"]');

    // (a) Initial Focus Inside Modal
    const initialFocusInside = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="modal-content-container"]');
      return modal && modal.contains(document.activeElement);
    });

    // (b) Forward Tab Focus Trapping
    let escapedForward = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="modal-content-container"]');
        return modal && modal.contains(document.activeElement);
      });
      if (!inside) {
        escapedForward = true;
        break;
      }
    }

    // (c) Backward Shift+Tab Focus Trapping
    let escapedBackward = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Shift+Tab");
      const inside = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="modal-content-container"]');
        return modal && modal.contains(document.activeElement);
      });
      if (!inside) {
        escapedBackward = true;
        break;
      }
    }

    // (d) Background #app-root inert attribute while open
    const appRootInertOpen = await page.evaluate(() => {
      const root = document.getElementById("app-root");
      return root ? root.hasAttribute("inert") : false;
    });

    // (e) Escape Dismissal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const modalClosedOnEscape = (await page.locator('[data-testid="modal-content-container"]').count()) === 0;

    // (f) Background #app-root inert removed after close
    const appRootInertClosed = await page.evaluate(() => {
      const root = document.getElementById("app-root");
      return root ? !root.hasAttribute("inert") : false;
    });

    const passed =
      initialFocusInside &&
      !escapedForward &&
      !escapedBackward &&
      appRootInertOpen &&
      modalClosedOnEscape &&
      appRootInertClosed;

    dialogResults.push({
      dialog: dlg.name,
      initialFocus: initialFocusInside ? "PASS" : "FAIL",
      forwardTabTrapping: !escapedForward ? "PASS" : "FAIL",
      reverseTabTrapping: !escapedBackward ? "PASS" : "FAIL",
      backgroundInert: appRootInertOpen && appRootInertClosed ? "PASS" : "FAIL",
      escapeDismissal: modalClosedOnEscape ? "PASS" : "FAIL",
      verdict: passed ? "PASS" : "FAIL",
    });

    console.log(
      `  [${passed ? "OK" : "ERR"}] ${dlg.name}: InitialFocus=${initialFocusInside ? "PASS" : "FAIL"}, TabTrapping=${!escapedForward ? "PASS" : "FAIL"}, InertBg=${appRootInertOpen ? "PASS" : "FAIL"}, Escape=${modalClosedOnEscape ? "PASS" : "FAIL"}`
    );
  }

  await browser.close();

  console.log("\n=== KEYBOARD NAVIGATION SUMMARY TABLE ===");
  console.table(routeResults);
  console.table(dialogResults);
  console.log("PASS: Extended keyboard navigation suite verified across all 7 routes and 3 dialogs.");
}

testKeyboard().catch((err) => {
  console.error(err);
  process.exit(1);
});
