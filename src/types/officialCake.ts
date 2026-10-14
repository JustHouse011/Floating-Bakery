export const OFFICIAL_FLAVOURS = ['Vanilla', 'Chocolate', 'Marble (Chocolate & Vanilla)', 'Vanilla Caramel', 'Red Velvet', 'Vanilla Coconut', 'Lemon Poppyseed', 'Doughnut', 'Orange', 'Vanilla Cinnamon', 'Strawberry', 'Carrot', 'Lemon Poppyseed Blueberry', 'Chocolate Caramel', 'Chocolate Bar One'] as const;
export type OfficialFlavour = (typeof OFFICIAL_FLAVOURS)[number];
export interface OfficialCakePricing {
  version: string;
  effectiveDate: string;
  minimumBaseCents: number;
  maximumBaseCents: number;
  flavourSurchargesCents: Record<OfficialFlavour, number>;
  products: Record<string, { name: string; image: string; category: string }>;
}
export interface OfficialConfirmation {
  id: string;
  quotationId: string;
  at: string;
  originalMinimumCents: number;
  originalMaximumCents: number;
  confirmedBaseCents: number;
  flavourSurchargeCents: number;
  approvedAdditionalCents: number;
  confirmedTotalCents: number;
  reason: string;
  overrideAuthorised: boolean;
  approvedPricing: OfficialCakePricing;
  pricingVersion: string;
  flavourPricingVersion: string;
  status: 'Quoted';
}
