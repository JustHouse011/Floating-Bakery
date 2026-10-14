import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { defaultConfiguration } from "../src/data/designer";
import { cakePricingRules } from "../src/data/cakePricing";
import { products } from "../src/data/products";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  FLAVOURS,
  FROSTINGS,
  DECORATIONS,
  type CakeConfiguration,
} from "../src/types/cakeDesigner";
import {
  calculateCakeEstimate,
  validatePricingRules,
} from "../src/services/pricingEngine";
import {
  configurationForProduct,
  tierDimensions,
} from "../src/services/cakeConfiguration";
import {
  saveDesign,
  restoreDesign,
  DESIGN_STORAGE_KEY,
  type StorageAdapter,
} from "../src/services/designerStorage";
import {
  buildEstimateSummary,
  ESTIMATE_DISCLAIMER,
} from "../src/services/estimateSummary";
import { formatRand, formatZARCents } from "../src/utils/currency";
import { cakeDesignerStore } from "../src/store/cakeDesignerStore";
import { cakePricingStore } from "../src/store/cakePricingStore";
import EstimatePanel from "../src/components/designer/EstimatePanel";
const config = () => defaultConfiguration();
const rules = () => structuredClone(cakePricingRules);
const estimate = (configuration = config(), pricing = rules()) =>
  calculateCakeEstimate(configuration, pricing);
const total = (configuration = config(), pricing = rules()) =>
  estimate(configuration, pricing).estimatedTotalCents;
function memoryStorage(): StorageAdapter {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
beforeEach(() => {
  cakeDesignerStore.getState().resetDesign();
  cakePricingStore.getState().setRules(rules());
});
test("default 8-inch cake is R650 with a complete integer-cent breakdown", () => {
  const result = estimate();
  assert.equal(result.estimatedTotalCents, 65000);
  assert.equal(result.baseCakePriceCents, 65000);
  assert.equal(result.tierSurchargesCents, 0);
  assert.equal(result.flavourSurchargesCents, 0);
  assert.equal(result.frostingSurchargesCents, 0);
  assert.equal(result.decorationSurchargesCents, 0);
  assert.equal(result.manualQuotationRequired, false);
  assert.equal(result.status, "estimated");
  assert.equal(result.pricingRuleVersion, cakePricingRules.version);
  assert.deepEqual(result.errors, []);
});
for (const size of CAKE_SIZES)
  test(`${size}-inch round and square cakes use their configured base price`, () => {
    for (const shape of CAKE_SHAPES)
      assert.equal(
        total({ ...config(), size, shape }),
        cakePricingRules.basePricesCents[size],
      );
  });
test("8 / 6 inch two-tier cake prices each actual tier plus one stacking fee", () => {
  const result = estimate({ ...config(), tiers: 2 });
  assert.equal(result.estimatedTotalCents, 125000);
  assert.equal(result.tierSurchargesCents, 60000);
  assert.deepEqual(
    result.tiers.map((t) => t.sizeInches),
    [8, 6],
  );
  assert.equal(
    result.breakdown.find((line) => line.key === "stacking")?.amountCents,
    15000,
  );
});
test("10 / 8 / 6 inch three-tier cake uses two stacking fees", () => {
  const result = estimate({ ...config(), size: 10, tiers: 3 });
  assert.equal(result.estimatedTotalCents, 230000);
  assert.equal(result.tierSurchargesCents, 140000);
  assert.deepEqual(
    result.tiers.map((t) => t.sizeInches),
    [10, 8, 6],
  );
});
test("12 / 10 / 8 inch three-tier cake is not largest price times tier count", () => {
  const result = estimate({ ...config(), size: 12, tiers: 3 });
  assert.equal(result.estimatedTotalCents, 310000);
  assert.notEqual(result.estimatedTotalCents, 125000 * 3);
  assert.deepEqual(
    result.tiers.map((t) => t.sizeInches),
    [12, 10, 8],
  );
});
for (const flavour of FLAVOURS)
  test(`${flavour} surcharge applies once to the complete cake`, () => {
    const result = estimate({ ...config(), size: 10, tiers: 3, flavour });
    assert.equal(
      result.estimatedTotalCents,
      230000 + cakePricingRules.flavourSurchargesCents[flavour],
    );
    assert.equal(
      result.flavourSurchargesCents,
      cakePricingRules.flavourSurchargesCents[flavour],
    );
  });
for (const frosting of FROSTINGS)
  test(`${frosting} surcharge applies once to the complete cake`, () => {
    const result = estimate({ ...config(), size: 10, tiers: 3, frosting });
    assert.equal(
      result.estimatedTotalCents,
      230000 + cakePricingRules.frostingSurchargesCents[frosting],
    );
    assert.equal(
      result.frostingSurchargesCents,
      cakePricingRules.frostingSurchargesCents[frosting],
    );
  });
for (const decoration of DECORATIONS)
  test(`${decoration} is charged only when enabled`, () => {
    const configuration = config();
    configuration.decorations[decoration] = true;
    assert.equal(
      total(configuration),
      65000 + cakePricingRules.decorationSurchargesCents[decoration],
    );
    configuration.decorations[decoration] = false;
    assert.equal(total(configuration), 65000);
  });
test("multiple additions produce one line each and an exact total", () => {
  const configuration = config();
  configuration.flavour = "Chocolate";
  configuration.frosting = "Fondant";
  for (const key of DECORATIONS) configuration.decorations[key] = true;
  configuration.message = "Happy Birthday";
  const result = estimate(configuration);
  assert.equal(result.estimatedTotalCents, 149000);
  assert.equal(result.decorationSurchargesCents, 59000);
  assert.equal(
    new Set(result.breakdown.map((line) => line.key)).size,
    result.breakdown.length,
  );
  assert.equal(
    result.breakdown.reduce((sum, line) => sum + line.amountCents, 0),
    149000,
  );
});
test("message charge follows the plaque selection implied by valid non-empty text", () => {
  for (const message of ["", "   ", "\t".replace("\t", " "), "\u00a0"])
    assert.equal(total({ ...config(), message }), 65000);
  assert.equal(total({ ...config(), message: "Happy day" }), 70000);
  assert.equal(
    estimate({ ...config(), message: "Happy day" }).breakdown.find(
      (line) => line.key === "message",
    )?.amountCents,
    5000,
  );
  assert.equal(
    estimate({ ...config(), message: "a".repeat(33) }).estimatedTotalCents,
    null,
  );
});
test("all included product presets equal the unchanged catalogue starting price", () => {
  for (const product of products) {
    const result = estimate(configurationForProduct(product.id));
    assert.equal(
      result.estimatedTotalCents ?? result.indicativeTotalCents,
      product.price * 100,
    );
    assert.equal(result.baseCakePriceCents, product.price * 100);
    assert.equal(result.tierSurchargesCents, 0);
    assert.equal(result.flavourSurchargesCents, 0);
    assert.equal(result.frostingSurchargesCents, 0);
    assert.equal(result.decorationSurchargesCents, 0);
  }
});
test("included chocolate flavour and ganache are not charged twice", () => {
  const configuration = configurationForProduct("chocolate");
  const result = estimate(configuration);
  assert.equal(result.estimatedTotalCents, 55000);
  assert.equal(
    result.breakdown.find((line) => line.key === "flavour")?.included,
    true,
  );
  assert.equal(
    result.breakdown.find((line) => line.key === "frosting")?.included,
    true,
  );
  configuration.decorations.flowers = true;
  assert.equal(total(configuration), 73000);
});
test("included flowers and pearls are not duplicated", () => {
  const floral = estimate(configurationForProduct("floral"));
  assert.equal(
    floral.breakdown.find((line) => line.key === "flowers")?.amountCents,
    0,
  );
  const twoTier = estimate(configurationForProduct("two-tier"));
  assert.equal(twoTier.estimatedTotalCents, 140000);
  assert.equal(
    twoTier.breakdown.find((line) => line.key === "tier-1")?.amountCents,
    0,
  );
  assert.equal(
    twoTier.breakdown.find((line) => line.key === "stacking")?.amountCents,
    0,
  );
  assert.equal(
    twoTier.breakdown.find((line) => line.key === "pearls")?.amountCents,
    0,
  );
});
test("package size upgrades use only the difference in tier prices", () => {
  const configuration = configurationForProduct("chocolate");
  configuration.size = 12;
  const result = estimate(configuration);
  assert.equal(result.estimatedTotalCents, 135000);
  assert.equal(
    result.breakdown.find((line) => line.key === "base-size")?.amountCents,
    80000,
  );
});
test("package additional tiers and changed upper sizes are charged once", () => {
  const configuration = configurationForProduct("two-tier");
  configuration.size = 10;
  configuration.tiers = 3;
  assert.equal(total(configuration), 245000);
});
test("removing included options produces explicit credits", () => {
  const configuration = configurationForProduct("chocolate");
  configuration.flavour = "Vanilla";
  configuration.frosting = "Buttercream";
  const result = estimate(configuration);
  assert.equal(result.estimatedTotalCents, 36000);
  assert.equal(result.flavourSurchargesCents, -7000);
  assert.equal(result.frostingSurchargesCents, -12000);
  const twoTier = configurationForProduct("two-tier");
  twoTier.tiers = 1;
  twoTier.decorations.pearls = false;
  assert.equal(total(twoTier), 72000);
  assert.ok(
    estimate(twoTier).breakdown.some((line) => line.label.includes("credit")),
  );
});
test("shape and colour changes do not introduce unconfigured surcharges", () => {
  const configuration = config();
  configuration.shape = "Square";
  configuration.tierColours[0] = "#123456";
  configuration.decorationColour = "#abcdef";
  assert.equal(total(configuration), 65000);
});
test("unsupported sizes, tier counts and combinations never receive a fixed price", () => {
  for (const patch of [
    { size: 7 },
    { tiers: 4 },
    { size: 6, tiers: 2 },
    { size: 8, tiers: 3 },
    { shape: "Heart" },
    { flavour: "Unknown" },
    { frosting: "Unknown" },
  ]) {
    const result = estimate({ ...config(), ...patch } as CakeConfiguration);
    assert.equal(result.manualQuotationRequired, true);
    assert.equal(result.estimatedTotalCents, null);
    assert.equal(result.indicativeTotalCents, null);
    assert.ok(result.errors.length);
  }
});
test("unsupported configuration under active tier limits is flagged for review", () => {
  const pricing = rules();
  pricing.productPackages = {};
  pricing.tierStructure.maximumTiers = 2;
  const result = estimate({ ...config(), size: 10, tiers: 3 }, pricing);
  assert.equal(result.manualQuotationRequired, true);
  assert.equal(result.estimatedTotalCents, null);
});
test("bespoke and reference flags return an indicative subtotal, never a final estimate", () => {
  const configuration = config();
  configuration.quotationRequirements = {
    complexBespoke: true,
    referenceDesign: true,
  };
  const result = estimate(configuration);
  assert.equal(result.status, "manual");
  assert.equal(result.estimatedTotalCents, null);
  assert.equal(result.indicativeTotalCents, 65000);
  assert.equal(result.manualQuotationReasons.length, 2);
  assert.match(result.warnings.join(" "), /supported selections only/);
});
test("wedding package always requires bakery review", () => {
  const result = estimate(configurationForProduct("wedding"));
  assert.equal(result.estimatedTotalCents, null);
  assert.equal(result.indicativeTotalCents, 250000);
  assert.equal(result.manualQuotationRequired, true);
});
test("a selected product with no active package is not silently priced generically", () => {
  const pricing = rules();
  delete pricing.productPackages.vanilla;
  const result = estimate(configurationForProduct("vanilla"), pricing);
  assert.equal(result.estimatedTotalCents, null);
  assert.match(result.errors[0], /no active pricing package/);
});
test("negative amounts in all pricing groups are rejected", () => {
  const changes = [
    (pricing: ReturnType<typeof rules>) => {
      pricing.basePricesCents[8] = -1;
    },
    (pricing: ReturnType<typeof rules>) => {
      pricing.flavourSurchargesCents.Chocolate = -1;
    },
    (pricing: ReturnType<typeof rules>) => {
      pricing.frostingSurchargesCents.Fondant = -1;
    },
    (pricing: ReturnType<typeof rules>) => {
      pricing.decorationSurchargesCents.flowers = -1;
    },
    (pricing: ReturnType<typeof rules>) => {
      pricing.tierStructure.stackingFeePerAdditionalTierCents = -1;
    },
    (pricing: ReturnType<typeof rules>) => {
      pricing.productPackages.vanilla.startingPriceCents = -1;
    },
  ];
  for (const change of changes) {
    const pricing = rules();
    change(pricing);
    assert.throws(() => validatePricingRules(pricing));
    const result = estimate(config(), pricing);
    assert.equal(result.status, "invalid");
    assert.equal(result.estimatedTotalCents, null);
  }
});
test("malformed amounts, missing data, invalid versions and dates are rejected", () => {
  for (const badAmount of [
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "45000",
    null,
  ]) {
    const pricing = rules();
    pricing.basePricesCents[6] = badAmount as number;
    assert.throws(() => validatePricingRules(pricing));
    assert.equal(total(config(), pricing), null);
  }
  for (const patch of [
    { version: "" },
    { effectiveDate: "2026-02-30" },
    { flavourScope: "invalid" },
    { basePricesCents: {} },
    { demonstration: false },
    { tierStructure: { ...rules().tierStructure, sizeStepInches: 3 } },
  ])
    assert.throws(() => validatePricingRules({ ...rules(), ...patch }));
});
test("safe integer overflow and invalid package-credit totals are rejected", () => {
  const overflow = rules();
  overflow.basePricesCents[8] = Number.MAX_SAFE_INTEGER;
  assert.equal(
    estimate({ ...config(), flavour: "Chocolate" }, overflow)
      .estimatedTotalCents,
    null,
  );
  const negative = rules();
  negative.productPackages.chocolate.startingPriceCents = 1;
  const configuration = configurationForProduct("chocolate");
  configuration.flavour = "Vanilla";
  configuration.frosting = "Buttercream";
  assert.equal(estimate(configuration, negative).estimatedTotalCents, null);
});
test("typed scope settings can charge per tier when explicitly configured", () => {
  const pricing = rules();
  pricing.flavourScope = "tier";
  pricing.frostingScope = "tier";
  pricing.decorationScope = "tier";
  const configuration = {
    ...config(),
    size: 10 as const,
    tiers: 3 as const,
    flavour: "Chocolate" as const,
    frosting: "Fondant" as const,
  };
  configuration.decorations.pearls = true;
  const result = estimate(configuration, pricing);
  assert.equal(result.estimatedTotalCents, 230000 + 21000 + 54000 + 24000);
});
test("engine does not mutate its configuration or pricing rules", () => {
  const configuration = config(),
    pricing = rules();
  const before = JSON.stringify({ configuration, pricing });
  calculateCakeEstimate(configuration, pricing);
  assert.equal(JSON.stringify({ configuration, pricing }), before);
});
test("Phase 2 v1 saves migrate without trusting stored totals or versions", () => {
  const storage = memoryStorage();
  const legacy: Record<string, unknown> = { ...config(), message: "Happy day" };
  delete legacy.quotationRequirements;
  legacy.estimatedTotalCents = 1;
  legacy.pricingRuleVersion = "stale";
  storage.setItem(
    DESIGN_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      savedAt: "2026-10-13T00:00:00.000Z",
      configuration: legacy,
      estimatedTotalCents: 1,
    }),
  );
  const restored = restoreDesign(storage);
  assert.equal(restored.message, "Happy day");
  assert.deepEqual(restored.quotationRequirements, {
    complexBespoke: false,
    referenceDesign: false,
  });
  assert.equal("estimatedTotalCents" in restored, false);
  assert.equal(total(restored), 70000);
  saveDesign(restored, storage);
  assert.equal(JSON.parse(storage.getItem(DESIGN_STORAGE_KEY)!).version, 3);
});
test("Phase 3 saves restore manual-review flags", () => {
  const storage = memoryStorage(),
    configuration = config();
  configuration.quotationRequirements.referenceDesign = true;
  saveDesign(configuration, storage);
  const restored = restoreDesign(storage);
  assert.equal(restored.quotationRequirements.referenceDesign, true);
  assert.equal(estimate(restored).estimatedTotalCents, null);
});
test("prices are recalculated after restoration under changed active rules", () => {
  const storage = memoryStorage();
  saveDesign(config(), storage);
  const updated = rules();
  updated.version = "demo-updated";
  updated.basePricesCents[8] = 80000;
  cakePricingStore.getState().setRules(updated);
  cakeDesignerStore.getState().restoreConfiguration(restoreDesign(storage));
  const result = calculateCakeEstimate(
    cakeDesignerStore.getState().configuration,
    cakePricingStore.getState().rules,
  );
  assert.equal(result.estimatedTotalCents, 80000);
  assert.equal(result.pricingRuleVersion, "demo-updated");
});
test("store selection changes produce estimates using the model tier dimensions", () => {
  for (const tiers of [1, 2, 3] as const) {
    cakeDesignerStore.getState().setTiers(tiers);
    const configuration = cakeDesignerStore.getState().configuration;
    const result = estimate(configuration);
    assert.deepEqual(
      result.tiers.map((t) => t.sizeInches),
      tierDimensions(configuration).map((t) => t.inches),
    );
    assert.equal(result.manualQuotationRequired, false);
  }
  cakeDesignerStore.getState().setQuotationRequirement("complexBespoke", true);
  assert.equal(
    estimate(cakeDesignerStore.getState().configuration)
      .manualQuotationRequired,
    true,
  );
});
test("active rules store rejects invalid replacements and isolates caller mutations", () => {
  const current = cakePricingStore.getState().rules;
  const invalid = rules();
  invalid.basePricesCents[6] = -1;
  assert.throws(() => cakePricingStore.getState().setRules(invalid));
  assert.strictEqual(cakePricingStore.getState().rules, current);
  const updated = rules();
  cakePricingStore.getState().setRules(updated);
  updated.basePricesCents[8] = 1;
  assert.equal(cakePricingStore.getState().rules.basePricesCents[8], 65000);
});
test("ZAR formatting preserves cent amounts, credits and catalogue formatting", () => {
  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  for (const cents of [0, 1, 125, 65000, 65001, -7000])
    assert.equal(formatZARCents(cents), formatter.format(cents / 100));
  assert.notEqual(formatZARCents(65001), formatZARCents(65000));
  assert.throws(() => formatZARCents(1.5));
  assert.ok(formatRand(450).includes("450"));
});
test("Copy Estimate contains the complete itemisation and confirmation disclaimer", () => {
  const configuration = {
    ...config(),
    tiers: 2 as const,
    flavour: "Chocolate" as const,
    message: "Happy day",
  };
  configuration.decorations.flowers = true;
  const text = buildEstimateSummary(configuration, rules());
  for (const expected of [
    "Floating Bakery & Caterers",
    "Shape: Round",
    "8 inch / 6 inch",
    "Chocolate",
    "Buttercream",
    "Simple flowers",
    "Happy day",
    "Tier 2",
    "Stacking & structure",
    formatZARCents(155000),
    cakePricingRules.version,
    ESTIMATE_DISCLAIMER,
  ])
    assert.ok(text.includes(expected), expected);
});
test("manual copied summaries explicitly describe indicative pricing only", () => {
  const configuration = config();
  configuration.quotationRequirements.referenceDesign = true;
  const text = buildEstimateSummary(configuration, rules());
  assert.match(text, /Custom Quotation Required/);
  assert.match(text, /Indicative supported selections only/);
  assert.ok(text.includes(ESTIMATE_DISCLAIMER));
  assert.equal(text.includes("Estimated total:"), false);
});
test("estimator UI renders an updated estimate and a manual quotation state", () => {
  cakeDesignerStore.getState().setFlavour("Chocolate");
  const initialDesigner = cakeDesignerStore.getInitialState,
    initialPricing = cakePricingStore.getInitialState;
  cakeDesignerStore.getInitialState = cakeDesignerStore.getState;
  cakePricingStore.getInitialState = cakePricingStore.getState;
  try {
    const html = renderToString(<EstimatePanel />);
    assert.ok(html.includes(formatZARCents(72000)));
    assert.match(html, /Your Cake/);
    assert.ok(html.includes(ESTIMATE_DISCLAIMER));
    cakeDesignerStore
      .getState()
      .setQuotationRequirement("referenceDesign", true);
    const manual = renderToString(<EstimatePanel />);
    assert.match(manual, /Custom Quotation Required/);
    assert.match(manual, /Indicative amount only/);
  } finally {
    cakeDesignerStore.getInitialState = initialDesigner;
    cakePricingStore.getInitialState = initialPricing;
  }
});
test("pricing engine source does not import React, Zustand or Three.js", () => {
  const source = readFileSync("src/services/pricingEngine.ts", "utf8");
  assert.equal(
    /from\s+['"](?:react|zustand|three)(?:\/|['"])/.test(source),
    false,
  );
});
