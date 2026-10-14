import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const stage = process.env.QA_STAGE ?? "baseline";
const dir = `qa/evidence/${stage}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
try {
  await page.goto("http://127.0.0.1:5173/cake-designer");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(1800);
  const inspect = async () =>
    page.evaluate(async () => {
      const url = performance
        .getEntriesByType("resource")
        .find((r) => r.name.includes("/@react-three_fiber.js"))?.name;
      if (!url) return { error: "No fiber module" };
      const fiber = await import(url);
      const root = fiber._roots.get(document.querySelector("canvas"));
      if (!root) return { error: "No root found" };
      const { gl, scene, camera } = root.store.getState();
      let meshes = 0;
      scene.traverse((o) => {
        if (o.isMesh) meshes++;
      });
      const ctx = gl.getContext();
      const ext = ctx.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: ext
          ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : ctx.getParameter(ctx.RENDERER),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        meshes,
        camera: camera.position.toArray(),
        dpr: gl.getPixelRatio(),
      };
    });
  const samples = [];
  samples.push({ state: "default", ...(await inspect()) });
  for (const label of ["Pearls", "Ribbon", "Drip", "Flowers", "Topper"]) {
    const checkbox = page
      .getByRole("checkbox", { name: label, exact: false })
      .first();
    await checkbox.check();
  }
  await page
    .getByLabel("Personalised message", { exact: false })
    .fill("Happy Birthday");
  await page.waitForTimeout(500);
  samples.push({ state: "decorated", ...(await inspect()) });
  await page
    .locator(".canvas-frame")
    .screenshot({ path: `${dir}/decorated-1440.png` });
  console.log(JSON.stringify(samples, null, 2));
  await writeFile(`${dir}/gpu.json`, JSON.stringify(samples, null, 2));
} finally {
  await browser.close();
}
