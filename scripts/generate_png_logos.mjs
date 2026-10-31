import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const svgPath = path.resolve("public/logo.svg");
  const svgContent = fs.readFileSync(svgPath, "utf8");

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:transparent;"><div style="width:1024px;height:1024px;">${svgContent}</div></body></html>`);
  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.screenshot({
    path: path.resolve("docs/logo/linguaproof-logo-1024.png"),
    omitBackground: true,
  });

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:transparent;"><div style="width:512px;height:512px;">${svgContent}</div></body></html>`);
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({
    path: path.resolve("public/logo-512.png"),
    omitBackground: true,
  });

  await browser.close();
  console.log("PNG generation complete!");
}

main().catch(console.error);
