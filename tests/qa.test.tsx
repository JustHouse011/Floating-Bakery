import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readSessionDesign,
  writeSessionDesign,
  SESSION_DESIGN_KEY,
} from "../src/services/sessionDesign";
import { defaultConfiguration } from "../src/data/designer";
import { productImageSource } from "../src/utils/productImages";
import { products } from "../src/data/products";
import { readableMessageColour } from "../src/three/Materials/textColour";
import { studioCameraFrame } from "../src/three/cakeGeometry";
import { calculateCakeEstimate } from "../src/services/pricingEngine";
import { cakePricingRules } from "../src/data/cakePricing";
function storage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
test("session recovery keeps configuration while leaving manually saved designs untouched", () => {
  const s = storage();
  s.setItem("floating:cake-design", "existing manual save");
  const config = defaultConfiguration();
  config.shape = "Square";
  config.message = "Celebration";
  writeSessionDesign(config, s);
  assert.deepEqual(readSessionDesign(s), config);
  assert.equal(s.getItem("floating:cake-design"), "existing manual save");
  assert.ok(!s.getItem(SESSION_DESIGN_KEY)!.includes("estimatedTotal"));
});
test("missing and malformed session designs are handled without trusting stored prices", () => {
  const s = storage();
  assert.equal(readSessionDesign(s), null);
  s.setItem(SESSION_DESIGN_KEY, "invalid");
  assert.throws(() => readSessionDesign(s));
  s.setItem(
    SESSION_DESIGN_KEY,
    JSON.stringify({ version: 99, configuration: defaultConfiguration() }),
  );
  assert.throws(() => readSessionDesign(s));
  s.setItem(
    SESSION_DESIGN_KEY,
    JSON.stringify({
      version: 1,
      configuration: { ...defaultConfiguration(), size: 999 },
    }),
  );
  assert.throws(() => readSessionDesign(s));
});
test("session restore recalculates from active pricing instead of storing estimates", () => {
  const s = storage();
  writeSessionDesign(defaultConfiguration(), s);
  const rules = structuredClone(cakePricingRules);
  rules.basePricesCents[8] = 77777;
  assert.equal(
    calculateCakeEstimate(readSessionDesign(s)!, rules).estimatedTotalCents,
    77777,
  );
});
test("a reset or manually restored design resumes under its original product URL", () => {
  const s = storage();
  const c = defaultConfiguration();
  c.shape = "Square";
  writeSessionDesign(c, s, "vanilla");
  assert.deepEqual(readSessionDesign(s, "vanilla"), c);
  assert.equal(readSessionDesign(s, "chocolate"), null);
});
test("legacy session records without a view origin remain readable for their selected product", () => {
  const s = storage();
  const c = defaultConfiguration();
  c.selectedProductId = "vanilla";
  s.setItem(
    SESSION_DESIGN_KEY,
    JSON.stringify({ version: 1, configuration: c }),
  );
  assert.deepEqual(readSessionDesign(s, "vanilla"), c);
  assert.deepEqual(readSessionDesign(s), c);
});
test("session storage failures propagate without changing the input configuration", () => {
  const c = defaultConfiguration();
  const before = structuredClone(c);
  assert.throws(
    () =>
      writeSessionDesign(c, {
        getItem: () => null,
        setItem: () => {
          throw new Error("Quota");
        },
      }),
    /Quota/,
  );
  assert.deepEqual(c, before);
});
test("all existing sample image URLs have local aliases without changing seeded records", () => {
  const before = JSON.stringify(products);
  for (const p of products)
    assert.match(productImageSource(p.image), /^\/images\//);
  assert.equal(JSON.stringify(products), before);
});
test("custom product image URLs and intentional crops are preserved", () => {
  for (const source of [
    "/images/floral.jpg",
    "https://example.test/photo.jpg",
    "https://images.unsplash.com/photo-1535254973040-607b92a401c8?w=300",
  ])
    assert.equal(productImageSource(source), source);
});
test("message lettering keeps dark selections and protects pale colour legibility", () => {
  assert.equal(readableMessageColour("#933f55"), "#933f55");
  assert.equal(readableMessageColour("#ffffff"), "#933f55");
  assert.equal(readableMessageColour("#fff9f1"), "#933f55");
  assert.equal(readableMessageColour("#000000"), "#000000");
});
test("camera framing reserves actual topper space and centres an undecorated cake", () => {
  const c = defaultConfiguration();
  const simple = studioCameraFrame(c, 1);
  c.message = "Birthday";
  const plaque = studioCameraFrame(c, 1);
  c.decorations.topper = true;
  const star = studioCameraFrame(c, 1);
  assert.ok(simple.targetHeight < plaque.targetHeight);
  assert.ok(plaque.targetHeight < star.targetHeight);
  for (const shape of ["Round", "Square"] as const)
    for (const tiers of [1, 2, 3] as const) {
      const frame = studioCameraFrame({ ...c, shape, tiers, size: 12 }, 0.8);
      assert.ok(Number.isFinite(frame.distance));
      assert.ok(frame.distance > 3.8);
    }
});
