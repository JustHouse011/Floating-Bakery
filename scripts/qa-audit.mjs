import { chromium } from "@playwright/test";
import axe from "axe-core";
import { mkdir, writeFile } from "node:fs/promises";
const stage = process.env.QA_STAGE ?? "baseline";
const out = `qa/evidence/${stage}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const viewports = [
  [1920, 1080],
  [1440, 900],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
];
const routes = [
  "/",
  "/cakes",
  "/cakes/vanilla",
  "/about",
  "/catering",
  "/contact",
  "/cake-designer",
  "/quote-request",
  "/admin",
  "/admin/products",
  "/admin/pricing",
  "/admin/quotations",
  "/admin/calendar",
  "/admin/reports",
  "/admin/settings",
  "/not-found",
];
const results = [];
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of routes) {
      const errors = [];
      const consoleErrors=[];
      const failed = [];
      const onError = (e) => errors.push(e.message);
      const onFailed = (r) =>
        failed.push({ url: r.url(), error: r.failure()?.errorText });
      page.on("pageerror", onError);
      const onConsole=message=>{if(message.type()==='error')consoleErrors.push(message.text());};page.on('console',onConsole);
      page.on("requestfailed", onFailed);
      const start = Date.now();
      await page.goto(`http://127.0.0.1:5173${route}`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator("h1").first().waitFor();
      await page.waitForTimeout(route === "/cake-designer" ? 1800 : 350);
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return (
              b.width > 0 &&
              (b.right > innerWidth + 1 || b.left < -1) &&
              getComputedStyle(e).position !== "fixed"
            );
          })
          .slice(0, 10)
          .map((e) => ({ tag: e.tagName, class: e.className })),
        brokenImages: [...document.images]
          .filter((i) => i.complete && !i.naturalWidth)
          .map((i) => i.src),
        canvas: !!document.querySelector("canvas"),
      }));
      const row = {
        viewport: `${width}x${height}`,
        route,
        ...result,
        errors,
        consoleErrors,
        failed,
        elapsedMs: Date.now() - start,
      };
      if (
        [1920, 390].includes(width) &&
        [
          "/",
          "/cakes",
          "/cake-designer",
          "/admin",
          "/admin/pricing",
          "/contact",
        ].includes(route)
      ) {
        const slug =
          route === "/" ? "home" : route.replaceAll("/", "-").slice(1);
        await page.screenshot({
          path: `${out}/${slug}-${width}.png`,
          fullPage: route !== "/cake-designer",
        });
        await page.addScriptTag({ content: axe.source });
        row.accessibility = await page.evaluate(async () => {
          const r = await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
          });
          return r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          }));
        });
      }
      results.push(row);
      page.off("pageerror", onError);
      page.off('console',onConsole);
      page.off("requestfailed", onFailed);
    }
    await context.close();
    console.log(`Audited ${width}x${height}`);
    await writeFile(`${out}/audit.json`, JSON.stringify(results, null, 2));
  }
} finally {
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      pages: results.length,
      overflow: results
        .filter((r) => r.overflow)
        .map((r) => ({
          route: r.route,
          viewport: r.viewport,
          offenders: r.offenders,
        })),
      errors: results.filter((r) => r.errors.length),
      accessibility: results
        .filter((r) => r.accessibility?.length)
        .map((r) => ({
          route: r.route,
          viewport: r.viewport,
          violations: r.accessibility.map((a) => ({
            id: a.id,
            impact: a.impact,
            targets: a.nodes.map((n) => n.target),
          })),
        })),
    },
    null,
    2,
  ),
);
