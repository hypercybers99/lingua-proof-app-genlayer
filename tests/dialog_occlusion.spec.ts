import { test, expect } from "@playwright/test";

const PROD_URL = process.env.PROD_URL || "https://lingua-proof-app-genlayer.vercel.app";
const TEST_TRANSLATION_ID = "f22eb2aaccbe";

const VIEWPORTS = [
  // Widths: 390, 500, 630 | Heights: 300, 400, 667
  { width: 390, height: 300, name: "390x300" },
  { width: 390, height: 400, name: "390x400" },
  { width: 390, height: 667, name: "390x667" },
  { width: 500, height: 300, name: "500x300" },
  { width: 500, height: 400, name: "500x400" },
  { width: 500, height: 667, name: "500x667" },
  { width: 630, height: 300, name: "630x300" },
  { width: 630, height: 400, name: "630x400" },
  { width: 630, height: 667, name: "630x667" },
];

test.describe("Modal Dialog Occlusion via document.elementFromPoint", () => {
  test.beforeEach(async () => {
    test.setTimeout(120000);
  });

  for (const vp of VIEWPORTS) {
    test(`All modals (Audit, Challenge, Revise) are unoccluded at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${PROD_URL}/t/${TEST_TRANSLATION_ID}`);
      await page.waitForSelector('[data-testid="open-audit-modal-btn"]', { timeout: 60000 });

      // 1. AUDIT MODAL
      const auditBtn = page.locator('[data-testid="open-audit-modal-btn"]');
      await auditBtn.scrollIntoViewIfNeeded();
      await auditBtn.click();
      await page.waitForSelector('[data-testid="modal-content-container"]');

      const auditTargets = [
        { name: "title", selector: '[data-testid="modal-title"]' },
        { name: "close button", selector: '[data-testid="modal-close-button"]' },
        { name: "body element", selector: '[data-testid="modal-body"]' },
        { name: "cancel button", selector: '[data-testid="audit-cancel-btn"]' },
        { name: "submit button", selector: '[data-testid="audit-submit-btn"]' },
      ];

      for (const target of auditTargets) {
        const loc = page.locator(target.selector);
        await loc.scrollIntoViewIfNeeded();
        const box = await loc.boundingBox();
        expect(box, `Bounding box for Audit ${target.name} must exist`).not.toBeNull();
        if (box) {
          const hitOk = await page.evaluate(
            ({ cx, cy, sel }) => {
              const hit = document.elementFromPoint(cx, cy);
              const expected = document.querySelector(sel);
              if (!hit || !expected) return false;
              return hit === expected || expected.contains(hit) || hit.contains(expected);
            },
            { cx: box.x + box.width / 2, cy: box.y + box.height / 2, sel: target.selector }
          );
          expect(hitOk, `Audit modal target '${target.name}' must not be occluded at ${vp.name}`).toBe(true);
        }
      }

      await page.locator('[data-testid="modal-close-button"]').click();
      await expect(page.locator('[data-testid="modal-content-container"]')).toHaveCount(0);
      await page.waitForTimeout(300);

      // 2. CHALLENGE MODAL
      const challengeBtn = page.locator('[data-testid="open-challenge-modal-btn"]').first();
      await challengeBtn.scrollIntoViewIfNeeded();
      await challengeBtn.click();
      await page.waitForSelector('[data-testid="modal-content-container"]');

      const challengeTargets = [
        { name: "title", selector: '[data-testid="modal-title"]' },
        { name: "close button", selector: '[data-testid="modal-close-button"]' },
        { name: "body element", selector: '[data-testid="modal-body"]' },
        { name: "cancel button", selector: '[data-testid="challenge-cancel-btn"]' },
        { name: "submit button", selector: '[data-testid="challenge-submit-btn"]' },
      ];

      for (const target of challengeTargets) {
        const loc = page.locator(target.selector);
        await loc.scrollIntoViewIfNeeded();
        const box = await loc.boundingBox();
        expect(box, `Bounding box for Challenge ${target.name} must exist`).not.toBeNull();
        if (box) {
          const hitOk = await page.evaluate(
            ({ cx, cy, sel }) => {
              const hit = document.elementFromPoint(cx, cy);
              const expected = document.querySelector(sel);
              if (!hit || !expected) return false;
              return hit === expected || expected.contains(hit) || hit.contains(expected);
            },
            { cx: box.x + box.width / 2, cy: box.y + box.height / 2, sel: target.selector }
          );
          expect(hitOk, `Challenge modal target '${target.name}' must not be occluded at ${vp.name}`).toBe(true);
        }
      }

      await page.locator('[data-testid="modal-close-button"]').click();
      await expect(page.locator('[data-testid="modal-content-container"]')).toHaveCount(0);
      await page.waitForTimeout(300);

      // 3. REVISE MODAL
      const reviseBtn = page.locator('[data-testid="open-revise-modal-btn"]');
      await reviseBtn.scrollIntoViewIfNeeded();
      await reviseBtn.click();
      await page.waitForSelector('[data-testid="modal-content-container"]');

      const reviseTargets = [
        { name: "title", selector: '[data-testid="modal-title"]' },
        { name: "close button", selector: '[data-testid="modal-close-button"]' },
        { name: "body element", selector: '[data-testid="modal-body"]' },
        { name: "cancel button", selector: '[data-testid="revise-cancel-btn"]' },
        { name: "submit button", selector: '[data-testid="revise-submit-btn"]' },
      ];

      for (const target of reviseTargets) {
        const loc = page.locator(target.selector);
        await loc.scrollIntoViewIfNeeded();
        const box = await loc.boundingBox();
        expect(box, `Bounding box for Revise ${target.name} must exist`).not.toBeNull();
        if (box) {
          const hitOk = await page.evaluate(
            ({ cx, cy, sel }) => {
              const hit = document.elementFromPoint(cx, cy);
              const expected = document.querySelector(sel);
              if (!hit || !expected) return false;
              return hit === expected || expected.contains(hit) || hit.contains(expected);
            },
            { cx: box.x + box.width / 2, cy: box.y + box.height / 2, sel: target.selector }
          );
          expect(hitOk, `Revise modal target '${target.name}' must not be occluded at ${vp.name}`).toBe(true);
        }
      }

      await page.locator('[data-testid="modal-close-button"]').click();
      await expect(page.locator('[data-testid="modal-content-container"]')).toHaveCount(0);
    });
  }
});
