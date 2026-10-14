import type { CakeConfiguration, CakeSize } from "./cakeDesigner";
import type { CakeEstimate, CakePricingRules } from "./pricing";
export const CONTACT_METHODS = ["Email", "Phone", "WhatsApp"] as const;
export const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Corporate event",
  "Anniversary",
  "Other",
] as const;
export const QUOTATION_STATUSES = [
  "New",
  "Under Review",
  "Awaiting Customer",
  "Quoted",
  "Approved",
  "Declined",
] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export interface CustomerDetails {
  fullName: string;
  email: string;
  contactNumber: string;
  preferredContactMethod: ContactMethod;
}
export interface EventFormValues {
  eventType: EventType;
  eventDate: string;
  fulfilment: "Collection" | "Delivery";
  deliveryArea: string;
  guests: string;
  specialInstructions: string;
}
export interface EventDetails extends Omit<EventFormValues, "guests"> {
  guests: number;
}
export interface ReferenceImage {
  id: string;
  name: string;
  type: "image/jpeg" | "image/png" | "image/webp";
  size: number;
  blob: Blob;
}
export interface QuotationRequestPolicy {
  deliveryAreas?: string[];
  businessDisclaimer?: string;
  collectionInstructions?: string;
  minimumLeadDays: number;
  maximumGuests: number;
  maximumImages: number;
  maximumImageBytes: number;
  maximumTotalImageBytes: number;
}
export interface QuotationDraft {
  id: string;
  configuration: CakeConfiguration;
  customer: CustomerDetails;
  event: EventFormValues;
  references: ReferenceImage[];
  demoConsent: boolean;
}
export type QuotationField =
  keyof CustomerDetails | keyof EventFormValues | "references" | "demoConsent";
export type QuotationErrors = Partial<Record<QuotationField, string>>;
export interface QuotationSnapshot {
  configuration: CakeConfiguration;
  tierSizesInches: CakeSize[];
  selectedProduct: { id: string; name: string; image?: string; category?: string } | null;
  official?: { productId: string; productName: string; image: string; category: string; flavour: import('./officialCake').OfficialFlavour; flavourSurchargeCents: number; minimumBaseCents: number; maximumBaseCents: number; minimumEstimateCents: number; maximumEstimateCents: number; personalisationInstructions: string; pricingVersion: string; priceStatus: 'Estimated range' };
  pricingRules: CakePricingRules;
  estimate: CakeEstimate;
  disclaimer: string;
  requestPolicy: QuotationRequestPolicy;
}
export interface StatusHistoryEntry {
  from: QuotationStatus | null;
  to: QuotationStatus;
  at: string;
}
export interface QuotationRecord {
  readonly version: 1;
  readonly id: string;
  readonly reference: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: QuotationStatus;
  readonly customer: CustomerDetails;
  readonly event: EventDetails;
  readonly snapshot: QuotationSnapshot;
  readonly references: ReferenceImage[];
  readonly statusHistory: StatusHistoryEntry[];
  readonly demo: true;
}
export interface QuotationListFilter {
  search?: string;
  status?: QuotationStatus;
}
export interface QuotationRepository {
  create(record: QuotationRecord): Promise<QuotationRecord>;
  getById(id: string): Promise<QuotationRecord | undefined>;
  list(filter?: QuotationListFilter): Promise<QuotationRecord[]>;
  updateStatus(id: string, status: QuotationStatus): Promise<QuotationRecord>;
}
