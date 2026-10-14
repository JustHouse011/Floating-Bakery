import type { CakeConfiguration, CakeSize } from "../types/cakeDesigner";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  FLAVOURS,
  FROSTINGS,
  DECORATIONS,
} from "../types/cakeDesigner";
import type {
  CakeEstimate,
  CakePricingRules,
  PriceLine,
  PriceCategory,
  PricingScope,
  ProductPricingPackage,
} from "../types/pricing";
import { tierDimensions, validateConfiguration } from "./cakeConfiguration";
import { validateOfficialPricing, officialEstimate } from './officialCakePricing';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
function requireAmount(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error(
      `${label} must be a non-negative, safe integer amount in cents.`,
    );
}
function requireMap(
  value: unknown,
  keys: readonly (string | number)[],
  label: string,
) {
  if (!isRecord(value)) throw new Error(`${label} is missing or malformed.`);
  for (const key of keys) requireAmount(value[key], `${label}: ${key}`);
  for (const [key, amount] of Object.entries(value))
    requireAmount(amount, `${label}: ${key}`);
}
export function validatePricingRules(
  value: unknown,
): asserts value is CakePricingRules {
  if (isRecord(value) && value.officialCatalogue !== undefined) validateOfficialPricing(value.officialCatalogue);
  if (
    !isRecord(value) ||
    typeof value.version !== "string" ||
    !value.version.trim() ||
    value.version.length > 100 ||
    value.demonstration !== true
  )
    throw new Error(
      "Pricing requires a version identifier and an explicit demonstration flag.",
    );
  if (
    typeof value.effectiveDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate) ||
    !Number.isFinite(Date.parse(value.effectiveDate)) ||
    new Date(value.effectiveDate).toISOString().slice(0, 10) !==
      value.effectiveDate
  )
    throw new Error("Pricing effective date must be a valid ISO date.");
  requireMap(value.basePricesCents, CAKE_SIZES, "Base prices");
  requireMap(value.flavourSurchargesCents, FLAVOURS, "Flavour surcharges");
  requireMap(value.frostingSurchargesCents, FROSTINGS, "Frosting surcharges");
  requireMap(
    value.decorationSurchargesCents,
    [...DECORATIONS, "message"],
    "Decoration surcharges",
  );
  for (const key of ["flavourScope", "frostingScope", "decorationScope"])
    if (!["cake", "tier"].includes(value[key] as string))
      throw new Error(`Invalid ${key}.`);
  const structure = value.tierStructure;
  if (
    !isRecord(structure) ||
    structure.sizeStepInches !== 2 ||
    !CAKE_SIZES.includes(structure.minimumTierSizeInches as CakeSize) ||
    ![1, 2, 3].includes(structure.maximumTiers as number)
  )
    throw new Error(
      "Tier pricing rules must match the supported two-inch tier geometry.",
    );
  requireAmount(structure.stackingFeePerAdditionalTierCents, "Stacking fee");
  requireAmount(
    (structure.stackingFeePerAdditionalTierCents as number) *
      Math.max(0, (structure.maximumTiers as number) - 1),
    "Combined stacking fees",
  );
  for (const [amounts, scope] of [
    [value.flavourSurchargesCents, value.flavourScope],
    [value.frostingSurchargesCents, value.frostingScope],
    [value.decorationSurchargesCents, value.decorationScope],
  ]) {
    if (scope === "tier")
      for (const amount of Object.values(amounts as Record<string, number>))
        requireAmount(
          amount * (structure.maximumTiers as number),
          "Per-tier combined surcharge",
        );
  }
  if (!isRecord(value.productPackages))
    throw new Error("Product pricing packages are malformed.");
  for (const [id, entry] of Object.entries(value.productPackages)) {
    if (
      !isRecord(entry) ||
      typeof entry.name !== "string" ||
      !entry.name.trim() ||
      typeof entry.manualQuotationRequired !== "boolean"
    )
      throw new Error(`Invalid product pricing package: ${id}.`);
    requireAmount(entry.startingPriceCents, `Product price: ${id}`);
    const baseline = entry.baseline;
    if (
      !isRecord(baseline) ||
      !CAKE_SHAPES.includes(baseline.shape as never) ||
      !FLAVOURS.includes(baseline.flavour as never) ||
      !FROSTINGS.includes(baseline.frosting as never) ||
      typeof baseline.messageIncluded !== "boolean" ||
      !isRecord(baseline.decorations) ||
      DECORATIONS.some(
        (key) =>
          typeof (baseline.decorations as Record<string, unknown>)[key] !==
          "boolean",
      )
    )
      throw new Error(`Invalid product inclusions: ${id}.`);
    try {
      const dimensions = tierDimensions(
        baseline as unknown as CakeConfiguration,
      );
      if (
        dimensions.length > (structure.maximumTiers as number) ||
        dimensions.some(
          (tier) => tier.inches < (structure.minimumTierSizeInches as number),
        )
      )
        throw new Error("Unsupported product tiers");
    } catch {
      throw new Error(`Invalid product tier configuration: ${id}.`);
    }
  }
}
const scopeMultiplier = (scope: PricingScope, tiers: number) =>
  scope === "tier" ? tiers : 1;
function unavailable(
  version: string,
  date: string,
  message: string,
  status: CakeEstimate["status"],
): CakeEstimate {
  return {
    status,
    baseCakePriceCents: null,
    tierSurchargesCents: null,
    flavourSurchargesCents: null,
    frostingSurchargesCents: null,
    decorationSurchargesCents: null,
    breakdown: [],
    tiers: [],
    estimatedTotalCents: null,
    indicativeTotalCents: null,
    pricingRuleVersion: version,
    effectiveDate: date,
    demonstration: true,
    manualQuotationRequired: true,
    manualQuotationReasons: [message],
    errors: [message],
    warnings: [],
  };
}
/** Pure integer-cent pricing. A product price replaces its complete included
 * baseline; changes are debited or credited against that baseline once. */
export function calculateCakeEstimate(
  configuration: CakeConfiguration,
  pricingRules: CakePricingRules,
): CakeEstimate {
  try {
    validatePricingRules(pricingRules);
  } catch (error) {
    return unavailable(
      typeof pricingRules?.version === "string"
        ? pricingRules.version
        : "unavailable",
      "",
      error instanceof Error ? error.message : "Invalid pricing rules",
      "invalid",
    );
  }
  const rules = pricingRules;
  let config: CakeConfiguration;
  try {
    config = validateConfiguration(configuration);
  } catch (error) {
    return unavailable(
      rules.version,
      rules.effectiveDate,
      error instanceof Error ? error.message : "Unsupported cake configuration",
      "manual",
    );
  }
  if (config.selectedProductId && rules.officialCatalogue?.products[config.selectedProductId]) return officialEstimate(config, rules.officialCatalogue);
  const dimensions = tierDimensions(config);
  if (
    dimensions.length > rules.tierStructure.maximumTiers ||
    dimensions.some(
      (tier) =>
        tier.inches < rules.tierStructure.minimumTierSizeInches ||
        !(tier.inches in rules.basePricesCents),
    )
  )
    return unavailable(
      rules.version,
      rules.effectiveDate,
      "The selected tier dimensions are not supported by the active pricing rules.",
      "manual",
    );
  let product: ProductPricingPackage | undefined;
  if (config.selectedProductId) {
    product = rules.productPackages[config.selectedProductId];
    if (!product)
      return unavailable(
        rules.version,
        rules.effectiveDate,
        "This catalogue design has no active pricing package. Bakery review is required.",
        "manual",
      );
  }
  const included = product?.baseline;
  const includedDimensions = included ? tierDimensions(included) : [];
  const lines: PriceLine[] = [];
  const add = (
    key: string,
    label: string,
    category: PriceCategory,
    amountCents: number,
    isIncluded = false,
    note?: string,
  ) => {
    lines.push({
      key,
      label,
      category,
      amountCents,
      included: isIncluded,
      ...(note ? { note } : {}),
    });
  };
  add(
    "base",
    product
      ? `${product.name} — included package`
      : `Base cake · ${config.size}″`,
    "base",
    product?.startingPriceCents ?? rules.basePricesCents[config.size],
    false,
    product
      ? `${includedDimensions.map((t) => `${t.inches}″`).join(" / ")}; includes ${included!.flavour}, ${included!.frosting}, selected package decorations and stacking.`
      : undefined,
  );
  const tiers = dimensions.map((tier) => {
    const size = tier.inches as CakeSize;
    const price = rules.basePricesCents[size];
    const includedTier = includedDimensions[tier.index];
    const includedPrice = includedTier
      ? rules.basePricesCents[includedTier.inches as CakeSize]
      : 0;
    const delta = price - includedPrice;
    if (tier.index === 0) {
      if (product && delta !== 0)
        add(
          "base-size",
          `Base size adjustment · ${included!.size}″ → ${config.size}″`,
          "base",
          delta,
          false,
          delta < 0 ? "Credit for a smaller base tier." : undefined,
        );
    } else
      add(
        `tier-${tier.index}`,
        `Tier ${tier.index + 1} · ${size}″`,
        "tiers",
        delta,
        Boolean(product && delta === 0 && includedTier),
        includedTier
          ? `Included tier allowance: ${includedTier.inches}″.`
          : undefined,
      );
    return {
      index: tier.index,
      sizeInches: size,
      priceCents: price,
      includedPriceCents: includedPrice,
      adjustmentCents: tier.index === 0 && !product ? 0 : delta,
    };
  });
  for (const removed of includedDimensions.slice(dimensions.length))
    add(
      `removed-tier-${removed.index}`,
      `Removed tier ${removed.index + 1} · ${removed.inches}″ credit`,
      "tiers",
      -rules.basePricesCents[removed.inches as CakeSize],
    );
  const stackingCount = config.tiers - 1;
  const includedStackingCount = included ? included.tiers - 1 : 0;
  if (stackingCount || includedStackingCount)
    add(
      "stacking",
      "Stacking & structure",
      "tiers",
      (stackingCount - includedStackingCount) *
        rules.tierStructure.stackingFeePerAdditionalTierCents,
      Boolean(product && stackingCount === includedStackingCount),
      "One structural surcharge per additional tier; included package allowances are applied.",
    );
  const flavour =
    rules.flavourSurchargesCents[config.flavour] *
      scopeMultiplier(rules.flavourScope, config.tiers) -
    (included
      ? rules.flavourSurchargesCents[included.flavour] *
        scopeMultiplier(rules.flavourScope, included.tiers)
      : 0);
  add(
    "flavour",
    `Flavour · ${config.flavour}`,
    "flavour",
    flavour,
    flavour === 0,
    `Applied per ${rules.flavourScope}.${flavour < 0 ? " Credit for replacing an included option." : ""}`,
  );
  const frosting =
    rules.frostingSurchargesCents[config.frosting] *
      scopeMultiplier(rules.frostingScope, config.tiers) -
    (included
      ? rules.frostingSurchargesCents[included.frosting] *
        scopeMultiplier(rules.frostingScope, included.tiers)
      : 0);
  add(
    "frosting",
    `Frosting · ${config.frosting}`,
    "frosting",
    frosting,
    frosting === 0,
    `Applied per ${rules.frostingScope}.${frosting < 0 ? " Credit for replacing an included option." : ""}`,
  );
  const labels = {
    pearls: "Decorative pearls",
    ribbon: "Ribbon",
    drip: "Drip effect",
    flowers: "Flowers",
    topper: "Cake topper",
    message: "Personalised message",
  };
  for (const key of [...DECORATIONS, "message"] as const) {
    const selected =
      key === "message"
        ? Boolean(config.message.trim())
        : config.decorations[key];
    const includedOption =
      key === "message"
        ? included?.messageIncluded
        : included?.decorations[key];
    if (!selected && !includedOption) continue;
    const amount =
      rules.decorationSurchargesCents[key] *
      ((selected ? scopeMultiplier(rules.decorationScope, config.tiers) : 0) -
        (includedOption
          ? scopeMultiplier(rules.decorationScope, included!.tiers)
          : 0));
    add(
      key,
      selected ? labels[key] : `${labels[key]} removed — credit`,
      "decorations",
      amount,
      selected && Boolean(includedOption) && amount === 0,
      `Applied per ${rules.decorationScope}.`,
    );
  }
  let total = 0;
  for (const line of lines) {
    total += line.amountCents;
    if (!Number.isSafeInteger(total))
      return unavailable(
        rules.version,
        rules.effectiveDate,
        "The configured amounts exceed safe integer-cent arithmetic. Bakery review is required.",
        "invalid",
      );
  }
  if (
    !Number.isSafeInteger(total) ||
    total < 0 ||
    lines.some((line) => !Number.isSafeInteger(line.amountCents))
  )
    return unavailable(
      rules.version,
      rules.effectiveDate,
      "The configured amounts do not produce a reliable non-negative estimate. Bakery review is required.",
      "invalid",
    );
  const categoryTotal = (category: PriceCategory) =>
    lines
      .filter((line) => line.category === category)
      .reduce((sum, line) => sum + line.amountCents, 0);
  if (
    (["base", "tiers", "flavour", "frosting", "decorations"] as const).some(
      (category) => !Number.isSafeInteger(categoryTotal(category)),
    )
  )
    return unavailable(
      rules.version,
      rules.effectiveDate,
      "The configured category amounts exceed safe integer-cent arithmetic.",
      "invalid",
    );
  const reasons: string[] = [];
  if (config.studio) reasons.push('Advanced studio structure, materials and decorations require bakery confirmation; no approved automatic surcharge is included.');
  if (product?.manualQuotationRequired)
    reasons.push(
      "This bespoke catalogue design requires an individual bakery quotation.",
    );
  if (config.quotationRequirements.complexBespoke)
    reasons.push(
      "Complex bespoke details require bakery review and are not included in this indicative amount.",
    );
  if (config.quotationRequirements.referenceDesign)
    reasons.push(
      "A reference design must be reviewed by the bakery; matching it is not included in this indicative amount.",
    );
  const manual = reasons.length > 0;
  return {
    status: manual ? "manual" : "estimated",
    baseCakePriceCents: categoryTotal("base"),
    tierSurchargesCents: categoryTotal("tiers"),
    flavourSurchargesCents: categoryTotal("flavour"),
    frostingSurchargesCents: categoryTotal("frosting"),
    decorationSurchargesCents: categoryTotal("decorations"),
    breakdown: lines,
    tiers,
    estimatedTotalCents: manual ? null : total,
    indicativeTotalCents: manual ? total : null,
    pricingRuleVersion: rules.version,
    effectiveDate: rules.effectiveDate,
    demonstration: rules.demonstration,
    manualQuotationRequired: manual,
    manualQuotationReasons: reasons,
    errors: [],
    warnings: [
      "Demonstration prices only; availability, delivery and special design work are not included.",
      ...(manual
        ? [
            "The partial amount covers supported selections only and is not a quotation for the complete design.",
          ]
        : []),
    ],
  };
}
