import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { open, gpuState } from "./helpers.mjs";
test("every supported shape/size/tier combination renders all finishes with decorations", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "/cake-designer");
  await page.locator("canvas").waitFor();
  await expect
    .poll(async () => (await gpuState(page)).calls)
    .toBeGreaterThan(0);
  for (const name of ["Pearls", "Ribbon", "Drip", "Flowers", "Topper"])
    await page.getByRole("checkbox", { name, exact: false }).first().check();
  await page.getByLabel("Personalised message").fill("Happy Birthday");
  const states = [];
  await mkdir("qa/evidence/final", { recursive: true });
  for (const shape of ["Round", "Square"])
    for (const tiers of [1, 2, 3])
      for (const size of [6, 8, 10, 12].filter(
        (n) => n >= 6 + (tiers - 1) * 2,
      )) {
        await page.getByRole("button", { name: shape, exact: true }).click();
        await page
          .getByRole("button", {
            name: tiers === 1 ? "Single" : `${tiers} tiers`,
            exact: true,
          })
          .click();
        await page
          .getByRole("button", { name: `${size}″`, exact: true })
          .click();
        for (const finish of ["Buttercream", "Fondant", "Chocolate Ganache"]) {
          await page
            .getByRole("combobox", { name: "Frosting", exact: true })
            .selectOption(finish);
          await page.waitForTimeout(120);
          const state = await gpuState(page);
          expect(state.calls).toBeGreaterThan(0);
          expect(state.triangles).toBeGreaterThan(1000);
          expect(state.textures).toBeLessThanOrEqual(4);
          expect(state.flowerGap).toBeLessThanOrEqual(0.001);
          expect(state.flowerGap).toBeGreaterThanOrEqual(-0.01);
          const price = await page.evaluate(async () => {
            const loaded = (path) =>
              performance
                .getEntriesByType("resource")
                .find((r) => new URL(r.name).pathname === path)?.name;
            const { cakeDesignerStore } = await import(
              loaded("/src/store/cakeDesignerStore.ts")
            );
            const { cakePricingStore } = await import(
              loaded("/src/store/cakePricingStore.ts")
            );
            const { calculateCakeEstimate } =
              await import("/src/services/pricingEngine.ts");
            const { formatZARCents } = await import("/src/utils/currency.ts");
            const estimate = calculateCakeEstimate(
              cakeDesignerStore.getState().configuration,
              cakePricingStore.getState().rules,
            );
            return formatZARCents(
              estimate.estimatedTotalCents ?? estimate.indicativeTotalCents,
            );
          });
          await expect(page.locator(".estimate-total strong")).toHaveText(
            price,
          );
          states.push({ shape, tiers, size, finish, ...state });
        }
        if (size === 6 + (tiers - 1) * 2)
          await page.locator(".canvas-frame").screenshot({
            path: `qa/evidence/final/${info.project.name}-${shape}-${tiers}-tiers.png`,
          });
      }
  await writeFile(
    `qa/evidence/final/${info.project.name}-gpu-matrix.json`,
    JSON.stringify(states, null, 2),
  );
  expect(states).toHaveLength(54);
  expect(errors).toEqual([]);
});
test("orbit, zoom, reset and context-loss fallback work in the real renderer", async ({
  page,
}, info) => {
  await open(page, "/cake-designer");
  const canvas = page.locator("canvas");
  await canvas.waitFor();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.waitForTimeout(150);
  const before = await gpuState(page);
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (info.project.name.includes("mobile")) {
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 65, y: y + 20 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 80,
      box.y + box.height / 2 + 20,
      { steps: 8 },
    );
    await page.mouse.up();
  }
  await expect
    .poll(async () => JSON.stringify((await gpuState(page)).camera))
    .not.toBe(JSON.stringify(before.camera));
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect
    .poll(async () =>
      (await gpuState(page)).camera.map((n) => n.toFixed(3)).join(","),
    )
    .toBe(before.camera.map((n) => n.toFixed(3)).join(","));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const scroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.evaluate(() =>
    document
      .querySelector("canvas")
      .getContext("webgl2")
      .getExtension("WEBGL_lose_context")
      .loseContext(),
  );
  await expect(page.getByText("The 3D preview is unavailable.")).toBeVisible();
  await page
    .getByRole("button", { name: "Request This Cake", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
});
