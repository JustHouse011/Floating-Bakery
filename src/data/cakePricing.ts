import type {
  CakePricingRules,
  ProductPricingBaseline,
} from "../types/pricing";
import { products } from "./products";
function baseline(
  overrides: Partial<ProductPricingBaseline> = {},
): ProductPricingBaseline {
  return {
    shape: "Round",
    size: 6,
    tiers: 1,
    flavour: "Vanilla",
    frosting: "Buttercream",
    decorations: {
      pearls: false,
      ribbon: false,
      drip: false,
      flowers: false,
      topper: false,
    },
    messageIncluded: false,
    ...overrides,
  };
}
const included = (key: keyof ProductPricingBaseline["decorations"]) => ({
  ...baseline().decorations,
  [key]: true,
});
const baselines: Record<string, ProductPricingBaseline> = {
  vanilla: baseline(),
  chocolate: baseline({ flavour: "Chocolate", frosting: "Chocolate Ganache" }),
  "red-velvet": baseline({ flavour: "Red Velvet" }),
  floral: baseline({ size: 8, decorations: included("flowers") }),
  "two-tier": baseline({ size: 8, tiers: 2, decorations: included("pearls") }),
  wedding: baseline({
    size: 10,
    tiers: 3,
    frosting: "Fondant",
    decorations: included("flowers"),
  }),
};
export const cakePricingRules: CakePricingRules = {
  version: "demo-2026-10-13.v1",
  effectiveDate: "2026-10-13",
  demonstration: true,
  basePricesCents: { 6: 45000, 8: 65000, 10: 90000, 12: 125000 },
  flavourSurchargesCents: {
    Vanilla: 0,
    Chocolate: 7000,
    "Red Velvet": 10000,
    Carrot: 8000,
    Lemon: 6000,
  },
  flavourScope: "cake",
  frostingSurchargesCents: {
    Buttercream: 0,
    Fondant: 18000,
    "Chocolate Ganache": 12000,
  },
  frostingScope: "cake",
  decorationSurchargesCents: {
    pearls: 8000,
    ribbon: 6000,
    drip: 10000,
    flowers: 18000,
    topper: 12000,
    message: 5000,
  },
  decorationScope: "cake",
  tierStructure: {
    sizeStepInches: 2,
    minimumTierSizeInches: 6,
    maximumTiers: 3,
    stackingFeePerAdditionalTierCents: 15000,
  },
  productPackages: Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        name: product.name,
        startingPriceCents: product.price * 100,
        baseline: baselines[product.id],
        manualQuotationRequired: product.id === "wedding",
      },
    ]),
  ),
};
