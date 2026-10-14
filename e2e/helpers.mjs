import { expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
export async function open(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !!document.querySelector(".announcement,.admin-shell"),
  );
  await expect(page.locator("main h1").first()).toBeVisible();
}
export async function capture(page, name) {
  await page.evaluate(async () => {
    const original = scrollY;
    for (
      let y = 0;
      y < document.documentElement.scrollHeight;
      y += innerHeight
    ) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    scrollTo(0, original);
  });
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete),
    {},
    { timeout: 12000 },
  );
  await mkdir("qa/evidence/final", { recursive: true });
  await page.screenshot({
    path: `qa/evidence/final/${name}.png`,
    fullPage: true,
  });
}
export async function dbQuotes(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("floating-bakery-quotations", 4);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("quotations");
          const read = tx.objectStore("quotations").getAll();
          read.onsuccess = () => resolve(read.result);
          tx.oncomplete = () => db.close();
          read.onerror = () => reject(read.error);
        };
        request.onerror = () => reject(request.error);
      }),
  );
}
export async function gpuState(page) {
  return page.evaluate(async () => {
    const url = performance
      .getEntriesByType("resource")
      .find((r) => r.name.includes("/@react-three_fiber.js"))?.name;
    const fiber = await import(url);
    const root=fiber._roots.get(document.querySelector("canvas"));
    // Canvas visibility can precede creation of the Fiber root by one frame.
    if(!root)return {calls:0,triangles:0};
    const { gl, scene, camera } = root.store.getState();
    const ctx = gl.getContext();
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    const flowers = scene.getObjectByName("cake-flower-cluster");
    let flowerGap = null;
    if (flowers) {
      flowers.updateWorldMatrix(true, true);
      let minimum = Infinity;
      flowers.traverse((mesh) => {
        if (!mesh.isMesh) return;
        mesh.geometry.computeBoundingBox();
        const bounds = mesh.geometry.boundingBox;
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z])
              minimum = Math.min(
                minimum,
                camera.position
                  .clone()
                  .set(x, y, z)
                  .applyMatrix4(mesh.matrixWorld).y,
              );
      });
      flowerGap = minimum - flowers.userData.cakeTop;
    }
    return {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      flowerGap,
      renderer: ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown",
      camera: camera.position.toArray(),
      canvasSize: [gl.domElement.width, gl.domElement.height],
      meshes: scene.children.length,
    };
  });
}
