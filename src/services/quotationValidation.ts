import {
  CONTACT_METHODS,
  EVENT_TYPES,
  type CustomerDetails,
  type EventFormValues,
  type EventDetails,
  type QuotationErrors,
  type QuotationRequestPolicy,
} from "../types/quotation";
import {
  southAfricanDate,
  addCalendarDays,
  isRecord,
} from "../utils/quotation";
const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
export function normalizeSouthAfricanNumber(value: string): string | null {
  if (typeof value !== "string" || !/^[+\d\s().-]+$/.test(value)) return null;
  const number = value.replace(/[\s().-]/g, "");
  if (/^0[1-9]\d{8}$/.test(number)) return `+27${number.slice(1)}`;
  if (/^\+27[1-9]\d{8}$/.test(number)) return number;
  if (/^0027[1-9]\d{8}$/.test(number)) return `+${number.slice(2)}`;
  return null;
}
export function validateRequestPolicy(
  policy: unknown,
): asserts policy is QuotationRequestPolicy {
  if (!isRecord(policy)) throw new Error("Invalid quotation policy");
  if (
    policy.deliveryAreas !== undefined &&
    (!Array.isArray(policy.deliveryAreas) ||
      policy.deliveryAreas.length > 100 ||
      policy.deliveryAreas.some(
        (a) => typeof a !== "string" || a.trim().length < 2 || a.length > 160,
      ))
  )
    throw new Error("Invalid supported delivery areas");
  for (const key of ["businessDisclaimer", "collectionInstructions"])
    if (
      policy[key] !== undefined &&
      (typeof policy[key] !== "string" ||
        (policy[key] as string).length >
          (key === "businessDisclaimer" ? 1000 : 2000))
    )
      throw new Error("Invalid quotation information");
  for (const key of [
    "minimumLeadDays",
    "maximumGuests",
    "maximumImages",
    "maximumImageBytes",
    "maximumTotalImageBytes",
  ])
    if (
      !Number.isSafeInteger(policy[key]) ||
      (policy[key] as number) < (key === "minimumLeadDays" ? 0 : 1)
    )
      throw new Error(`Invalid quotation policy: ${key}`);
  if (
    (policy.minimumLeadDays as number) > 365 ||
    (policy.maximumImages as number) > 10 ||
    (policy.maximumImageBytes as number) > 10 * 1024 * 1024 ||
    (policy.maximumTotalImageBytes as number) > 50 * 1024 * 1024
  )
    throw new Error("Quotation policy exceeds supported demonstration limits");
}
export function validateCustomer(customer: CustomerDetails): QuotationErrors {
  const errors: QuotationErrors = {};
  if (
    text(customer.fullName).length < 2 ||
    text(customer.fullName).length > 100
  )
    errors.fullName = "Enter your full name (2–100 characters).";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text(customer.email)) ||
    text(customer.email).length > 254
  )
    errors.email = "Enter a valid email address.";
  if (!normalizeSouthAfricanNumber(customer.contactNumber))
    errors.contactNumber =
      "Use a South African number, for example 082 123 4567 or +27 82 123 4567.";
  if (!CONTACT_METHODS.includes(customer.preferredContactMethod))
    errors.preferredContactMethod = "Choose Email, Phone or WhatsApp.";
  return errors;
}
export function validateEvent(
  event: EventFormValues,
  policy: QuotationRequestPolicy,
  now = new Date(),
): QuotationErrors {
  validateRequestPolicy(policy);
  const errors: QuotationErrors = {};
  if (!EVENT_TYPES.includes(event.eventType))
    errors.eventType = "Choose an event type.";
  const minimumDate = addCalendarDays(
    southAfricanDate(now),
    policy.minimumLeadDays,
  );
  const validDate =
    typeof event.eventDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate) &&
    Number.isFinite(Date.parse(`${event.eventDate}T12:00:00.000Z`)) &&
    new Date(`${event.eventDate}T12:00:00.000Z`).toISOString().slice(0, 10) ===
      event.eventDate;
  if (!validDate) errors.eventDate = "Choose a valid event date.";
  else if (event.eventDate < minimumDate)
    errors.eventDate = policy.minimumLeadDays
      ? `Choose ${minimumDate} or later under the configured demonstration lead time.`
      : "The event date cannot be in the past.";
  if (!["Collection", "Delivery"].includes(event.fulfilment))
    errors.fulfilment = "Choose collection or delivery.";
  if (
    event.fulfilment === "Delivery" &&
    (text(event.deliveryArea).length < 2 ||
      text(event.deliveryArea).length > 160)
  )
    errors.deliveryArea = "Enter the delivery area (2–160 characters).";
  if (
    event.fulfilment === "Delivery" &&
    policy.deliveryAreas?.length &&
    !policy.deliveryAreas.some(
      (a) => a.toLowerCase() === text(event.deliveryArea).toLowerCase(),
    )
  )
    errors.deliveryArea = "Choose one of the configured delivery areas.";
  if (
    typeof event.guests !== "string" ||
    !/^\d+$/.test(event.guests.trim()) ||
    Number(event.guests) < 1 ||
    Number(event.guests) > policy.maximumGuests
  )
    errors.guests = `Enter a guest count from 1 to ${policy.maximumGuests.toLocaleString("en-ZA")}.`;
  if (
    typeof event.specialInstructions !== "string" ||
    event.specialInstructions.length > 2000
  )
    errors.specialInstructions =
      "Keep special instructions within 2,000 characters.";
  return errors;
}
export function normalizeCustomer(customer: CustomerDetails): CustomerDetails {
  return {
    ...customer,
    fullName: customer.fullName.trim(),
    email: customer.email.trim(),
    contactNumber: normalizeSouthAfricanNumber(customer.contactNumber)!,
  };
}
export function normalizeEvent(event: EventFormValues): EventDetails {
  return {
    ...event,
    eventDate: event.eventDate.trim(),
    deliveryArea:
      event.fulfilment === "Delivery" ? event.deliveryArea.trim() : "",
    guests: Number(event.guests),
    specialInstructions: event.specialInstructions.trim(),
  };
}
export class QuotationValidationError extends Error {
  constructor(public readonly fields: QuotationErrors) {
    super("Please correct the highlighted details.");
    this.name = "QuotationValidationError";
  }
}
