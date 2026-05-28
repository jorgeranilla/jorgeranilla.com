const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("C:/Users/jorge_w2dmd47/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright");

async function main() {
  const root = path.resolve(__dirname, "..");
  const htmlPath = path.join(__dirname, "buyer-flyer.html");
  const pdfPath = path.join(__dirname, "Umstead-Grove-Buyer-Flyer.pdf");
  const shotDir = path.join(__dirname, "_buyer_flyer_previews");

  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const executablePath = require("node:fs").existsSync(chromePath) ? chromePath : edgePath;
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  const fs = require("node:fs");
  fs.rmSync(shotDir, { recursive: true, force: true });
  fs.mkdirSync(shotDir, { recursive: true });
  await page.emulateMedia({ media: "screen" });
  const pages = page.locator(".page");
  const count = await pages.count();
  for (let i = 0; i < count; i += 1) {
    await pages.nth(i).screenshot({ path: path.join(shotDir, `page-${String(i + 1).padStart(2, "0")}.png`) });
  }
  await browser.close();
  console.log(pdfPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
