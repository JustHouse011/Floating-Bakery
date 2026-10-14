import type { CakeConfiguration } from "../types/cakeDesigner";
import type { CakePricingRules } from "../types/pricing";
import { calculateCakeEstimate } from "./pricingEngine";
import {
  configurationSummary,
  validateConfiguration,
} from "./cakeConfiguration";
import { formatZARCents } from "../utils/currency";
import { formatPriceRange, selectedOfficialFlavour } from './officialCakePricing';
import {IS_PUBLIC_SITE} from '../config/siteMode';
export const ESTIMATE_DISCLAIMER =
  "Estimated Price — Subject to Bakery Confirmation.";
export function buildEstimateSummary(
  configuration: CakeConfiguration,
  rules: CakePricingRules,
): string {
  const estimate = calculateCakeEstimate(configuration, rules);
  let design: string;
  try {
    design = configurationSummary(
      validateConfiguration(configuration),
      configuration.selectedProductId
        ? rules.officialCatalogue?.products[configuration.selectedProductId]?.name || rules.productPackages[configuration.selectedProductId]?.name
        : undefined,
      estimate.pricingMode === 'official-range' ? selectedOfficialFlavour(configuration) : undefined,
    );
  } catch {
    design = "Floating Bakery & Caterers — Unsupported cake design";
  }
  const total = estimate.estimatedTotalCents ?? estimate.indicativeTotalCents;
  if(IS_PUBLIC_SITE&&estimate.pricingMode!=='official-range')return [design,'A bespoke quotation is required. No approved amount is available.',ESTIMATE_DISCLAIMER].join('\n');
  return [
    design,
    "",
    "Your Cake Estimate",
    ...estimate.breakdown.map(
      (line) =>
        `${line.label}: ${line.included ? "Included" : formatZARCents(line.amountCents)}${line.note ? ` (${line.note})` : ""}`,
    ),
    ...(estimate.manualQuotationRequired
      ? ["Custom Quotation Required", ...estimate.manualQuotationReasons]
      : []),
    estimate.pricingMode === 'official-range' ? `Estimated range: ${formatPriceRange(estimate.minimumEstimateCents!, estimate.maximumEstimateCents!)}` : total === null
      ? "No reliable estimate is available."
      : `${estimate.manualQuotationRequired ? "Indicative supported selections only" : "Estimated total"}: ${formatZARCents(total)}`,
    `Pricing version: ${estimate.pricingRuleVersion}`,
    `Effective date: ${estimate.effectiveDate || "Unavailable"}`,
    ...estimate.warnings,
    ESTIMATE_DISCLAIMER,
    IS_PUBLIC_SITE ? 'Final pricing and availability require bakery confirmation.' : "Local demonstration only. Nothing has been sent to the bakery.",
  ].join("\n");
}
