import { OFFICIAL_FLAVOURS, type OfficialCakePricing, type OfficialFlavour } from '../types/officialCake';
import type { CakeConfiguration } from '../types/cakeDesigner';
import type { CakeEstimate } from '../types/pricing';
import { formatZARCents } from '../utils/currency';
import { isRecord } from '../utils/quotation';

export const CAKE_CATEGORIES = ['Birthday Cakes', "Kids' Cakes", 'Luxury Cakes', 'Floral Cakes', 'Graduation Cakes', 'Custom Celebration Cakes'] as const;
export const OFFICIAL_PRICE_NOTICE = 'Final pricing is confirmed by Floating Bakery & Caterers after reviewing your requirements.';
export const defaultOfficialPricing = (): OfficialCakePricing => ({ version: 'official-cakes-2026-10-13-v1', effectiveDate: '2026-10-13', minimumBaseCents: 148000, maximumBaseCents: 195000, flavourSurchargesCents: Object.fromEntries(OFFICIAL_FLAVOURS.map((name, i) => [name, i === 0 ? 0 : i < 11 ? 18000 : 22000])) as Record<OfficialFlavour, number>, products: {} });
export function validateOfficialPricing(value: unknown): asserts value is OfficialCakePricing {
  if (!isRecord(value) || typeof value.version !== 'string' || !value.version.trim() || value.version.length > 100 || typeof value.effectiveDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate) || !Number.isFinite(Date.parse(value.effectiveDate)) || !Number.isSafeInteger(value.minimumBaseCents) || !Number.isSafeInteger(value.maximumBaseCents) || (value.minimumBaseCents as number) < 0 || (value.minimumBaseCents as number) > (value.maximumBaseCents as number) || !isRecord(value.flavourSurchargesCents) || !isRecord(value.products)) throw new Error('Invalid official cake price range.');
  for (const f of OFFICIAL_FLAVOURS) if (!Number.isSafeInteger(value.flavourSurchargesCents[f]) || (value.flavourSurchargesCents[f] as number) < 0 || !Number.isSafeInteger((value.maximumBaseCents as number) + (value.flavourSurchargesCents[f] as number))) throw new Error('Invalid official flavour surcharge.');
  if (value.flavourSurchargesCents.Vanilla !== 0) throw new Error('Vanilla must remain included.');
  for (const [id, p] of Object.entries(value.products)) if (!id || !isRecord(p) || typeof p.name !== 'string' || !p.name.trim() || typeof p.image !== 'string' || !p.image || typeof p.category !== 'string') throw new Error('Invalid official product reference.');
}
export function officialRange(pricing: OfficialCakePricing, flavour: OfficialFlavour = 'Vanilla') {
  validateOfficialPricing(pricing);
  if (!OFFICIAL_FLAVOURS.includes(flavour)) throw new Error('Choose an official flavour.');
  const surcharge = pricing.flavourSurchargesCents[flavour];
  return { minimumCents: pricing.minimumBaseCents + surcharge, maximumCents: pricing.maximumBaseCents + surcharge, surchargeCents: surcharge };
}
export function formatPriceRange(minimum: number, maximum: number): string { return `${formatZARCents(minimum)}–${formatZARCents(maximum)}`; }
export function selectedOfficialFlavour(config: CakeConfiguration): OfficialFlavour {
  return config.officialFlavour || (OFFICIAL_FLAVOURS.includes(config.flavour as OfficialFlavour) ? config.flavour as OfficialFlavour : 'Vanilla');
}
export function officialEstimate(config: CakeConfiguration, pricing: OfficialCakePricing): CakeEstimate {
  const flavour = selectedOfficialFlavour(config);
  const range = officialRange(pricing, flavour);
  return { status: 'range', pricingMode: 'official-range', minimumEstimateCents: range.minimumCents, maximumEstimateCents: range.maximumCents, baseCakePriceCents: null, tierSurchargesCents: 0, flavourSurchargesCents: range.surchargeCents, frostingSurchargesCents: 0, decorationSurchargesCents: 0, breakdown: [{ key: 'official-base', label: `Vanilla base range ${formatPriceRange(pricing.minimumBaseCents, pricing.maximumBaseCents)}`, category: 'base', amountCents: 0, included: true, note: 'Range awaiting bakery confirmation; no automatic size, tier or decoration surcharges.' }, { key: 'official-flavour', label: flavour, category: 'flavour', amountCents: range.surchargeCents, included: range.surchargeCents === 0, note: 'Applied once to the complete cake.' }], tiers: [], estimatedTotalCents: null, indicativeTotalCents: null, pricingRuleVersion: pricing.version, effectiveDate: pricing.effectiveDate, demonstration: false, manualQuotationRequired: true, manualQuotationReasons: [OFFICIAL_PRICE_NOTICE], errors: [], warnings: ['Photograph is the design reference; the 3D model is a conceptual preview.'] };
}
