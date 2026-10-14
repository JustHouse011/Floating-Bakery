import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
const records = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    await context.addInitScript(() => {
      window.__qaPerf = { lcp: null, longTasks: [] };
      new PerformanceObserver((list) => {
        window.__qaPerf.lcp = list.getEntries().at(-1)?.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        window.__qaPerf.longTasks.push(
          ...list.getEntries().map((e) => e.duration),
        );
      }).observe({ type: "longtask", buffered: true });
    });
    const page = await context.newPage();
    for (const route of ["/", "/cake-designer", "/admin"]) {
      await page.goto(`http://127.0.0.1:5174${route}`);
      await page.locator("main h1").waitFor();
      if (route === "/cake-designer") await page.locator("canvas").waitFor();
      await page.waitForTimeout(800);
      const metric = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return {
          domContentLoadedMs: n.domContentLoadedEventEnd,
          loadMs: n.loadEventEnd,
          lcpMs: window.__qaPerf.lcp,
          longTasks: window.__qaPerf.longTasks,
          resourceBytes: performance
            .getEntriesByType("resource")
            .reduce((sum, r) => sum + r.transferSize, 0),
        };
      });
      if (route === "/cake-designer")
        metric.priceUpdateMs = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const estimate = document.querySelector(".estimate-total");
              const old = estimate.textContent;
              const start = performance.now();
              const watcher = new MutationObserver(() => {
                if (estimate.textContent !== old) {
                  watcher.disconnect();
                  resolve(performance.now() - start);
                }
              });
              watcher.observe(estimate, {
                childList: true,
                characterData: true,
                subtree: true,
              });
              const select = document.querySelector('select[id$="-flavour"]');
              select.value = "Chocolate";
              select.dispatchEvent(new Event("change", { bubbles: true }));
            }),
        );
      records.push({ viewport, route, ...metric });
    }
    await context.close();
  }
  await mkdir("qa/evidence/final", { recursive: true });
  await writeFile(
    "qa/evidence/final/performance.json",
    JSON.stringify(records, null, 2),
  );
  console.log(JSON.stringify(records, null, 2));
} finally {
  await browser.close();
}
