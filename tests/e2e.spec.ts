import { test, expect } from "@playwright/test";

test.describe("LinguaProof Notary dApp E2E Flows", () => {
  test("loads landing page with live on-chain contract identity and metrics", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LinguaProof/);

    // Verify Brand & Protocol heading
    await expect(page.locator("h1")).toContainText("Verifiable Translation Fidelity on GenLayer");

    // Verify Active contract address is shown full length
    await expect(page.locator("text=0xba67d808f2b7E533ec06655eB730Ef5B27623EBF")).toBeVisible();

    // Verify Diagnostic contract link is marked
    await expect(page.locator("text=Calibration Probe (Diagnostic)")).toBeVisible();
  });

  test("navigates to translations explorer and filters records", async ({ page }) => {
    await page.goto("/translations");
    await expect(page.locator("h1")).toContainText("Translation Explorer");

    // Search bar visible
    const searchInput = page.locator("input[placeholder*='Search by title']");
    await expect(searchInput).toBeVisible();

    // Filter select elements visible
    const selectElements = page.locator("select");
    await expect(selectElements.first()).toBeVisible();
  });

  test("navigates to methodology and displays rubric and calibration disclosure", async ({ page }) => {
    await page.goto("/method");
    await expect(page.locator("h1")).toContainText("LinguaProof Auditing Methodology");

    // Check step A and step B
    await expect(page.locator("text=Step A: Blind Back-Translation")).toBeVisible();
    await expect(page.locator("text=Step B: Monolingual Rubric Comparison")).toBeVisible();

    // Check calibration disclosure
    await expect(page.locator("text=Transparent Calibration Accounting")).toBeVisible();
    await expect(page.locator("text=40 of 42 trials PRESERVED")).toBeVisible();
    await expect(page.locator("text=NOT MET")).toBeVisible();
  });

  test("navigates to on-chain evidence viewer and inspects scenarios", async ({ page }) => {
    await page.goto("/evidence");
    await expect(page.locator("h1")).toContainText("Live On-Chain Evidence Scenarios");

    // Latency note is displayed
    await expect(page.locator("text=Latency Spread Analysis")).toBeVisible();

    // Scenarios visible
    await expect(page.getByText("Scenario E1", { exact: true })).toBeVisible();
    await expect(page.getByText("Scenario E10", { exact: true })).toBeVisible();
  });

  test("navigates to wallet view and verifies faucet guidance", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("h1")).toContainText("Wallet & Funds Manager");

    // Connected network badge
    await expect(page.locator("strong:has-text('GenLayer Studionet (Preview)')")).toBeVisible();

    // Faucet link visible
    await expect(page.locator("a:has-text('Claim Free Faucet GEN')")).toBeVisible();
  });

  test("toggles light and dark themes without visual breakdown", async ({ page }) => {
    await page.goto("/");

    const themeButton = page.locator("button[aria-label='Toggle theme']");
    await expect(themeButton).toBeVisible();

    // Toggle theme
    await themeButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await themeButton.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("dialog occlusion test: asserts actionable buttons are clickable and unintercepted", async ({ page }) => {
    await page.goto("/translations");

    // The register button must be clickable without interception
    const registerBtn = page.locator("a:has-text('Register Translation')");
    await expect(registerBtn).toBeVisible();

    // Hit-test via elementFromPoint
    const box = await registerBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const topElement = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el?.tagName;
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      );
      expect(topElement?.toLowerCase()).toMatch(/^(a|span|svg|path)$/);
    }
  });
});
