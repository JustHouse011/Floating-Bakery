import type { CakeConfiguration } from "../types/cakeDesigner";
import type { CakePricingRules } from "../types/pricing";
import type {
  QuotationSnapshot,
  QuotationRequestPolicy,
  ReferenceImage,
} from "../types/quotation";
import { validateConfiguration, tierDimensions } from "./cakeConfiguration";
import { calculateCakeEstimate, validatePricingRules } from "./pricingEngine";
import { ESTIMATE_DISCLAIMER } from "./estimateSummary";
import { deepFreeze } from "../utils/quotation";
import { officialRange, selectedOfficialFlavour } from './officialCakePricing';
export function configurationForRequest(
  configuration: CakeConfiguration,
  images: ReferenceImage[],
): CakeConfiguration {
  const copy = validateConfiguration(configuration);
  if (images.length) copy.quotationRequirements.referenceDesign = true;
  return copy;
}
export function captureQuotationSnapshot(
  configuration: CakeConfiguration,
  rules: CakePricingRules,
  images: ReferenceImage[],
  policy: QuotationRequestPolicy,
): QuotationSnapshot {
  validatePricingRules(rules);
  const effectiveConfiguration = configurationForRequest(configuration, images);
  const pricingRules = structuredClone(rules);
  const estimate = calculateCakeEstimate(effectiveConfiguration, pricingRules);
  if (estimate.status === "invalid")
    throw new Error(
      "The active pricing rules cannot produce a reliable snapshot. Please try again after the demonstration rules are corrected.",
    );
  const selectedId = effectiveConfiguration.selectedProductId;
  const official = selectedId ? rules.officialCatalogue?.products[selectedId] : undefined;
  if (selectedId && !rules.productPackages[selectedId] && !official)
    throw new Error(
      "This catalogue inspiration no longer has active pricing. Start a standard design or choose another product.",
    );
  const selected =
    official && selectedId ? { id: selectedId, name: official.name } : selectedId && rules.productPackages[selectedId]
      ? { id: selectedId, name: rules.productPackages[selectedId].name }
      : null;
  return deepFreeze({
    configuration: effectiveConfiguration,
    tierSizesInches: tierDimensions(effectiveConfiguration).map(
      (tier) => tier.inches as QuotationSnapshot["tierSizesInches"][number],
    ),
    selectedProduct: selected ? { id: selected.id, name: selected.name } : null,
    ...(official && selectedId && rules.officialCatalogue ? { official: { productId: selectedId, productName: official.name, image: official.image, category: official.category, flavour: selectedOfficialFlavour(effectiveConfiguration), flavourSurchargeCents: officialRange(rules.officialCatalogue, selectedOfficialFlavour(effectiveConfiguration)).surchargeCents, minimumBaseCents: rules.officialCatalogue.minimumBaseCents, maximumBaseCents: rules.officialCatalogue.maximumBaseCents, minimumEstimateCents: estimate.minimumEstimateCents!, maximumEstimateCents: estimate.maximumEstimateCents!, personalisationInstructions: effectiveConfiguration.personalisationInstructions || '', pricingVersion: rules.officialCatalogue.version, priceStatus: 'Estimated range' as const } } : {}),
    pricingRules,
    estimate,
    disclaimer: ESTIMATE_DISCLAIMER,
    requestPolicy: structuredClone(policy),
  });
}
