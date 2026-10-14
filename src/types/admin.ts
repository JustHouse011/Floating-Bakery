import type { Product } from "./index";
import type { CakePricingRules } from "./pricing";
import type { CakeConfiguration } from "./cakeDesigner";
export interface BakerySettings {
  businessName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  collectionInstructions: string;
  disclaimer: string;
  minimumLeadDays: number;
  deliveryAreas: string[];
  currency: "ZAR";
  locale: "en-ZA" | "en-GB";
}
export interface AdminWorkspace {
  id: "workspace";
  schemaVersion: 1;
  revision: number;
  catalogueVersion?: 1;
  cakeCatalogueVersion?: 1;
  officialPricingHistory?: import('./officialCake').OfficialCakePricing[];
  products: Product[];
  rules: CakePricingRules;
  settings: BakerySettings;
}
export interface QuotationNote {
  id: string;
  text: string;
  at: string;
}
export interface QuotationRevision {
  id: string;
  reason: string;
  revisedAmountCents: number;
  at: string;
  originalEstimateCents: number | null;
  originalIndicativeCents: number | null;
  originalPricingVersion: string;
  originalConfiguration: CakeConfiguration;
}
export interface QuotationAudit {
  id: string;
  schemaVersion: 1;
  notes: QuotationNote[];
  revisions: QuotationRevision[];
}
export interface AdministrationRepository {
  load(): Promise<AdminWorkspace>;
  save(
    workspace: AdminWorkspace,
    expectedRevision: number,
  ): Promise<AdminWorkspace>;
  audit(quotationId: string): Promise<QuotationAudit>;
  appendAudit(
    quotationId: string,
    entry: { note: string } | { reason: string; amountCents: number },
  ): Promise<QuotationAudit>;
  reset(confirmation: string): Promise<AdminWorkspace>;
}
