import { chromium } from "playwright";

async function debugRegister() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  await page.goto("https://lingua-proof-app-genlayer.vercel.app/register");
  await page.waitForSelector("#translation-title-input");

  await page.fill("#translation-title-input", "Test Debug");
  await page.fill("#src-segment-0", "Hello world");
  await page.fill("#tgt-segment-0", "Xin chao the gioi");

  const disabled = await page.locator('[data-testid="register-submit-btn"]').isDisabled();
  console.log("Button disabled?", disabled);

  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(5000);

  const text = await page.locator("body").innerText();
  console.log("Page text after 5s:\n", text);
  await browser.close();
}

debugRegister().catch(console.error);
