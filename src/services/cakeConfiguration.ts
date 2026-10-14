import {
  CAKE_SIZES,
  CAKE_SHAPES,
  FLAVOURS,
  FROSTINGS,
  DECORATIONS,
  type CakeConfiguration,
  type CakeSize,
  type TierCount,
  type TierDimension,
} from "../types/cakeDesigner";
import { defaultConfiguration, DECORATION_LABELS } from "../data/designer";
import { products } from "../data/products";
import { cakePricingRules } from "../data/cakePricing";
import type { CakePricingRules } from "../types/pricing";
import { OFFICIAL_FLAVOURS } from '../types/officialCake';
import { validateStudio, studioSummary } from './studioDesign';
import { catalogueTemplate } from '../data/cakeTemplates';
import {IS_PUBLIC_SITE} from '../config/siteMode';
export const minimumSize = (tiers: TierCount): CakeSize =>
  (6 + (tiers - 1) * 2) as CakeSize;
export const compatibleSize = (size: CakeSize, tiers: TierCount) =>
  size >= minimumSize(tiers);
export function tierDimensions(
  config: Pick<CakeConfiguration, "size" | "tiers">,
): TierDimension[] {
  if (
    !CAKE_SIZES.includes(config.size) ||
    ![1, 2, 3].includes(config.tiers) ||
    !compatibleSize(config.size, config.tiers)
  )
    throw new Error("Incompatible cake size and tier count");
  let bottom = 0.82;
  return Array.from({ length: config.tiers }, (_, index) => {
    const inches = config.size - index * 2;
    const height = 0.72;
    const tier = { index, inches, radius: inches / 8, height, bottom };
    bottom += height;
    return tier;
  });
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export const isHexColour = (value: unknown): value is string =>
  typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);
export function validateConfiguration(value: unknown): CakeConfiguration {
  if (
    !isRecord(value) ||
    !CAKE_SHAPES.includes(value.shape as never) ||
    !CAKE_SIZES.includes(value.size as never) ||
    ![1, 2, 3].includes(value.tiers as number) ||
    !FLAVOURS.includes(value.flavour as never) ||
    !FROSTINGS.includes(value.frosting as never)
  )
    throw new Error("Invalid cake configuration");
  if (!compatibleSize(value.size as CakeSize, value.tiers as TierCount))
    throw new Error("Incompatible cake size and tier count");
  if (
    !Array.isArray(value.tierColours) ||
    value.tierColours.length !== 3 ||
    !value.tierColours.every(isHexColour) ||
    !isHexColour(value.decorationColour)
  )
    throw new Error("Invalid colour settings");
  const decorations = value.decorations;
  if (
    !isRecord(decorations) ||
    DECORATIONS.some((key) => typeof decorations[key] !== "boolean")
  )
    throw new Error("Invalid decorations");
  if (
    typeof value.message !== "string" ||
    value.message.length > 32 ||
    Array.from(value.message).some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    throw new Error("Invalid personalised message");
  if (
    value.selectedProductId !== null &&
    !products.some((p) => p.id === value.selectedProductId) &&
    !(typeof value.selectedProductId === 'string' && /^cake-wa-\d{4}$/.test(value.selectedProductId)) &&
    !(
      typeof value.selectedProductId === "string" &&
      /^product-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.selectedProductId,
      )
    )
  )
    throw new Error("Unknown catalogue inspiration");
  const requirements = value.quotationRequirements ?? {
    complexBespoke: false,
    referenceDesign: false,
  };
  if (
    !isRecord(requirements) ||
    typeof requirements.complexBespoke !== "boolean" ||
    typeof requirements.referenceDesign !== "boolean"
  )
    throw new Error("Invalid bakery review requirements");
  if (value.officialFlavour !== undefined && !OFFICIAL_FLAVOURS.includes(value.officialFlavour as never)) throw new Error('Invalid official flavour.');
  if (value.personalisationInstructions !== undefined && (typeof value.personalisationInstructions !== 'string' || value.personalisationInstructions.length > 2000)) throw new Error('Personalisation instructions must be within 2,000 characters.');
  return {
    ...(value.studio !== undefined ? { studio: validateStudio(value.studio) } : {}),
    shape: value.shape as CakeConfiguration["shape"],
    size: value.size as CakeSize,
    tiers: value.tiers as TierCount,
    tierColours: [...value.tierColours] as CakeConfiguration["tierColours"],
    flavour: value.flavour as CakeConfiguration["flavour"],
    frosting: value.frosting as CakeConfiguration["frosting"],
    decorations: Object.fromEntries(
      DECORATIONS.map((key) => [key, decorations[key]]),
    ) as CakeConfiguration["decorations"],
    decorationColour: value.decorationColour,
    message: value.message,
    selectedProductId: value.selectedProductId as string | null,
    ...(value.officialFlavour !== undefined ? { officialFlavour: value.officialFlavour as CakeConfiguration['officialFlavour'] } : {}),
    ...(value.personalisationInstructions !== undefined ? { personalisationInstructions: value.personalisationInstructions as string } : {}),
    quotationRequirements: {
      complexBespoke: requirements.complexBespoke,
      referenceDesign: requirements.referenceDesign,
    },
  };
}
export function configurationForProduct(
  id: string,
  rules: CakePricingRules = cakePricingRules,
): CakeConfiguration {
  if (rules.officialCatalogue?.products[id]) return { ...defaultConfiguration(), selectedProductId: id, officialFlavour: 'Vanilla', personalisationInstructions: '', studio: catalogueTemplate(id) };
  if (!rules.productPackages[id]) throw new Error("Unknown product");
  const config = defaultConfiguration();
  config.selectedProductId = id;
  const baseline = rules.productPackages[id]?.baseline;
  if (!baseline)
    throw new Error("No demonstration preset is available for this product");
  config.shape = baseline.shape;
  config.size = baseline.size;
  config.tiers = baseline.tiers;
  config.flavour = baseline.flavour;
  config.frosting = baseline.frosting;
  config.decorations = { ...baseline.decorations };
  if (id === "wedding") {
    config.tierColours = ["#fff8ee", "#fff8ee", "#fff8ee"];
  }
  return config;
}
export function configurationSummary(
  config: CakeConfiguration,
  productName?: string,
  flavourName?: string,
): string {
  const dimensions = tierDimensions(config);
  const decorations = DECORATIONS.filter((key) => config.decorations[key]).map(
    (key) => DECORATION_LABELS[key],
  );
  return [
    "Floating Bakery & Caterers — Cake Design",
    `Shape: ${config.studio?.shape || config.shape}`,
    `Tiers: ${config.studio?.tiers.length || config.tiers} (${(config.studio ? config.studio.tiers.map(t=>t.width*4) : dimensions.map(t=>t.inches)).map(size=>`${size} inch`).join(" / ")} — bottom to top)`,
    `Tier colours: ${config.tierColours.slice(0, config.tiers).join(", ")}`,
    `Flavour: ${flavourName || config.flavour}`,
    `Frosting: ${config.frosting}`,
    `Decorations: ${decorations.join(", ") || "None"}`,
    `Decoration colour: ${config.decorationColour}`,
    ...(config.studio ? studioSummary(config.studio) : []),
    `Personalised message: ${config.message.trim() || "None"}`,
    ...(config.personalisationInstructions ? [`Personalisation instructions: ${config.personalisationInstructions}`] : []),
    ...(config.selectedProductId
      ? [
          `Catalogue inspiration: ${productName ?? products.find((p) => p.id === config.selectedProductId)?.name ?? "Saved custom product"}`,
        ]
      : []),
    `Bakery review: ${[config.quotationRequirements.complexBespoke ? "complex bespoke design" : "", config.quotationRequirements.referenceDesign ? "reference design" : ""].filter(Boolean).join(", ") || "standard supported design"}`,
    IS_PUBLIC_SITE ? 'Design details for bakery review. Final pricing requires confirmation.' : "Local demonstration design. Nothing has been sent to the bakery.",
  ].join("\n");
}
