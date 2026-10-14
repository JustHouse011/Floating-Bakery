import type {
  CakeSize,
  CakeShape,
  TierCount,
  Flavour,
  Frosting,
  Decoration,
} from "./cakeDesigner";
export type PricingScope = "cake" | "tier";
export type PricedDecoration = Decoration | "message";
export interface ProductPricingBaseline {
  shape: CakeShape;
  size: CakeSize;
  tiers: TierCount;
  flavour: Flavour;
  frosting: Frosting;
  decorations: Record<Decoration, boolean>;
  messageIncluded: boolean;
}
export interface ProductPricingPackage {
  name: string;
  startingPriceCents: number;
  baseline: ProductPricingBaseline;
  manualQuotationRequired: boolean;
}
export interface CakePricingRules {
  version: string;
  effectiveDate: string;
  demonstration: true;
  basePricesCents: Record<CakeSize, number>;
  flavourSurchargesCents: Record<Flavour, number>;
  flavourScope: PricingScope;
  frostingSurchargesCents: Record<Frosting, number>;
  frostingScope: PricingScope;
  decorationSurchargesCents: Record<PricedDecoration, number>;
  decorationScope: PricingScope;
  tierStructure: {
    sizeStepInches: 2;
    minimumTierSizeInches: CakeSize;
    maximumTiers: TierCount;
    stackingFeePerAdditionalTierCents: number;
  };
  productPackages: Record<string, ProductPricingPackage>;
  officialCatalogue?: import('./officialCake').OfficialCakePricing;
}
export type PriceCategory =
  "base" | "tiers" | "flavour" | "frosting" | "decorations";
export interface PriceLine {
  key: string;
  label: string;
  category: PriceCategory;
  amountCents: number;
  included: boolean;
  note?: string;
}
export interface PricedTier {
  index: number;
  sizeInches: CakeSize;
  priceCents: number;
  includedPriceCents: number;
  adjustmentCents: number;
}
export interface CakeEstimate {
  status: "estimated" | "manual" | "invalid" | "range";
  pricingMode?: 'official-range';
  minimumEstimateCents?: number;
  maximumEstimateCents?: number;
  baseCakePriceCents: number | null;
  tierSurchargesCents: number | null;
  flavourSurchargesCents: number | null;
  frostingSurchargesCents: number | null;
  decorationSurchargesCents: number | null;
  breakdown: PriceLine[];
  tiers: PricedTier[];
  estimatedTotalCents: number | null;
  indicativeTotalCents: number | null;
  pricingRuleVersion: string;
  effectiveDate: string;
  demonstration: boolean;
  manualQuotationRequired: boolean;
  manualQuotationReasons: string[];
  errors: string[];
  warnings: string[];
}
