import type {
  QuotationRequestPolicy,
  QuotationStatus,
  CustomerDetails,
  EventFormValues,
} from "../types/quotation";
// Technical demonstration limits, not confirmed bakery booking policies.
export const quotationRequestPolicy: QuotationRequestPolicy = {
  minimumLeadDays: 0,
  maximumGuests: 10000,
  maximumImages: 3,
  maximumImageBytes: 2 * 1024 * 1024,
  maximumTotalImageBytes: 4 * 1024 * 1024,
};
export const STATUS_TRANSITIONS: Record<
  QuotationStatus,
  readonly QuotationStatus[]
> = {
  New: ["Under Review", "Declined"],
  "Under Review": ["Awaiting Customer", "Quoted", "Declined"],
  "Awaiting Customer": ["Under Review", "Declined"],
  Quoted: ["Awaiting Customer", "Approved", "Declined"],
  Approved: [],
  Declined: [],
};
export const emptyCustomer = (): CustomerDetails => ({
  fullName: "",
  email: "",
  contactNumber: "",
  preferredContactMethod: "Email",
});
export const emptyEvent = (): EventFormValues => ({
  eventType: "Birthday",
  eventDate: "",
  fulfilment: "Collection",
  deliveryArea: "",
  guests: "",
  specialInstructions: "",
});
