import { defineConfig, firefox, webkit } from "@playwright/test";
import { existsSync } from "node:fs";
const viewports = [
  [1920, 1080],
  [1440, 900],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
];
const runSuffix = process.env.QA_RUN
  ? `-${process.env.QA_RUN.replace(/[^a-z0-9-]/gi, "")}`
  : "";
export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  expect: { timeout: 12000 },
  workers: 1,
  fullyParallel: false,
  outputDir: `qa/evidence/playwright${runSuffix}`,
  reporter: [
    ["list"],
    ["json", { outputFile: `qa/evidence/playwright-results${runSuffix}.json` }],
    ["html", { outputFolder: `qa/evidence/report${runSuffix}`, open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel: process.env.PW_CHANNEL ?? "chrome",
    actionTimeout: 15000,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    ...[
      { name: "firefox", browser: firefox },
      { name: "webkit", browser: webkit },
    ]
      .filter(
        (p) =>
          existsSync(p.browser.executablePath()) ||
          process.env.PW_CROSS_BROWSER === "1",
      )
      .map((p) => ({
        name: p.name,
        testMatch: "responsive.spec.mjs",
        use: {
          browserName: p.name,
          channel: undefined,
          viewport: { width: 1440, height: 900 },
        },
      })),
    ...viewports.map(([width, height]) => ({
      name: `responsive-${width}`,
      testMatch: ["responsive.spec.mjs", "publicTheme.spec.mjs", "contactRefinement.spec.mjs", "navigationFooter.spec.mjs"],
      use: { viewport: { width, height }, hasTouch: width <= 760 },
    })),
    {
      name: 'contact-small-320',
      testMatch: ['contactRefinement.spec.mjs', 'navigationFooter.spec.mjs'],
      use: { viewport: {width:320,height:780}, hasTouch:true },
    },
    {
      name: 'navigation-1280',
      testMatch: 'navigationFooter.spec.mjs',
      use: { viewport: {width:1280,height:900} },
    },
    {
      name: "journey-desktop",
      testMatch: ["workflow.spec.mjs", "gpu.spec.mjs", "catalogue.spec.mjs", "officialCake.spec.mjs", "officialCakeAdmin.spec.mjs", "quotationCtas.spec.mjs", "studio.spec.mjs", "production.spec.mjs"],
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "journey-mobile",
      testMatch: ["workflow.spec.mjs", "gpu.spec.mjs", "catalogue.spec.mjs", "officialCake.spec.mjs", "officialCakeAdmin.spec.mjs", "quotationCtas.spec.mjs", "studio.spec.mjs", "production.spec.mjs"],
      use: { viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
});
