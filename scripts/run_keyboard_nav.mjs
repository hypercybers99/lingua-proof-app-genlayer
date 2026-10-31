import { chromium } from "playwright";

const PROD_URL = process.env.PROD_URL || "https://lingua-proof-app-genlayer.vercel.app";

async function testKeyboard() {
  console.log(`Running keyboard navigation & focus trapping tests on ${PROD_URL}...`);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${PROD_URL}/t/f22eb2aaccbe`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="open-audit-modal-btn"]', { timeout: 30000 });

  // 1. Open Audit Modal via keyboard / click
  const auditBtn = page.locator('[data-testid="open-audit-modal-btn"]');
  await auditBtn.click();
  await page.waitForSelector('[data-testid="modal-content-container"]');

  // Verify focus is inside modal
  const initialFocusInside = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="modal-content-container"]');
    return modal && modal.contains(document.activeElement);
  });
  console.log("Audit Modal initial focus inside container:", initialFocusInside);

  // Press Tab multiple times and verify activeElement never leaves the modal container
  let escapedModal = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="modal-content-container"]');
      return modal && modal.contains(document.activeElement);
    });
    if (!inside) {
      escapedModal = true;
      break;
    }
  }
  console.log("Tab focus trapping test (20 forward tabs):", escapedModal ? "FAILED" : "PASSED (focus trapped)");

  // Press Shift+Tab multiple times and verify activeElement never leaves modal
  let escapedReverse = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Shift+Tab");
    const inside = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="modal-content-container"]');
      return modal && modal.contains(document.activeElement);
    });
    if (!inside) {
      escapedReverse = true;
      break;
    }
  }
  console.log("Shift+Tab focus trapping test (20 backward tabs):", escapedReverse ? "FAILED" : "PASSED (focus trapped)");

  // Press Escape to close modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const modalClosed = (await page.locator('[data-testid="modal-content-container"]').count()) === 0;
  console.log("Escape key closes modal:", modalClosed ? "PASSED" : "FAILED");

  // Check background inertness when opened
  await auditBtn.click();
  await page.waitForSelector('[data-testid="modal-content-container"]');
  const appRootInert = await page.evaluate(() => {
    const root = document.getElementById("app-root");
    return root ? root.hasAttribute("inert") : false;
  });
  console.log("#app-root background inert attribute when modal open:", appRootInert ? "PASSED" : "FAILED");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  const appRootNotInert = await page.evaluate(() => {
    const root = document.getElementById("app-root");
    return root ? !root.hasAttribute("inert") : false;
  });
  console.log("#app-root inert removed after modal closed:", appRootNotInert ? "PASSED" : "FAILED");

  await browser.close();
  console.log("All keyboard navigation tests completed.");
}

testKeyboard().catch((err) => {
  console.error(err);
  process.exit(1);
});
