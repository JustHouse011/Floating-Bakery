import { build } from "esbuild";
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const folder = ".tools/phase9a";
await mkdir(folder, { recursive: true });
await build({
  stdin: {
    contents: `export {publicProducts,publicPricingRules} from './src/data/publicCatalogue';export {configurationForProduct} from './src/services/cakeConfiguration';export {OFFICIAL_CONTACT} from './src/data/officialCatalogue';`,
    resolveDir: process.cwd(),
  },
  outfile: folder + "/catalogue-source.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
});
const source = await import(
  pathToFileURL(resolve(folder, "catalogue-source.mjs")).href
);
const cakes = source.publicProducts.filter((p) => p.kind === "official-cake");
const photographs = new Set(cakes.flatMap((p) => p.sourceImages));
assert.equal(source.publicProducts.length, 55);
assert.equal(cakes.length, 43);
assert.equal(photographs.size, 44);
assert.equal(new Set(source.publicProducts.map((p) => p.id)).size, 55);
assert.equal(
  source.publicPricingRules.officialCatalogue.minimumBaseCents,
  148000,
);
assert.equal(
  source.publicPricingRules.officialCatalogue.maximumBaseCents,
  195000,
);
assert.ok(source.publicProducts.every((p) => !p.demo));
for (const p of source.publicProducts) {
  assert.ok(p.image.startsWith("/images/"));
  await access(resolve("public", "." + p.image));
}
const manifest = {
  schemaVersion: 1,
  source: "official public catalogue",
  products: source.publicProducts,
  pricing: source.publicPricingRules.officialCatalogue,
  templates: cakes.map((p) => ({
    id: "template-" + p.id,
    productId: p.id,
    configurationVersion: 3,
    configuration: source.configurationForProduct(
      p.id,
      source.publicPricingRules,
    ),
  })),
  suppliedContact: source.OFFICIAL_CONTACT,
  counts: {
    products: 55,
    cakes: 43,
    originalCakePhotographs: 44,
    treatsAndScones: 12,
  },
};
await writeFile(
  folder + "/catalogue-manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log(
  "Verified 55 stable IDs, 43 official cake templates, 44 source photographs, all image files and the unchanged R1,480–R1,950 base range. Dry export only; no database import.",
);
