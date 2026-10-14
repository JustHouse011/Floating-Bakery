import {
  QUOTATION_STATUSES,
  type QuotationRecord,
  type QuotationStatus,
  type StatusHistoryEntry,
  type CustomerDetails,
  type EventFormValues,
  type QuotationRequestPolicy,
} from "../types/quotation";
import { STATUS_TRANSITIONS } from "../data/quotation";
import {
  isRecord,
  isUUID,
  deepFreeze,
  stableJSON,
  southAfricanDate,
} from "../utils/quotation";
import { validateConfiguration, tierDimensions } from "./cakeConfiguration";
import { calculateCakeEstimate, validatePricingRules } from "./pricingEngine";
import { ESTIMATE_DISCLAIMER } from "./estimateSummary";
import { selectedOfficialFlavour } from './officialCakePricing';
import {
  validateCustomer,
  validateEvent,
  validateRequestPolicy,
  normalizeCustomer,
  normalizeEvent,
} from "./quotationValidation";
import { validateReferenceCollection } from "./referenceImages";
export const canTransitionStatus = (
  from: QuotationStatus,
  to: QuotationStatus,
) => from === to || STATUS_TRANSITIONS[from]?.includes(to) === true;
const validTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
export function validateQuotationRecord(value: unknown): QuotationRecord {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.demo !== true ||
    !isUUID(value.id) ||
    typeof value.reference !== "string" ||
    !/^FB-\d{4}-[A-F0-9]{16}$/.test(value.reference) ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt) ||
    value.updatedAt < value.createdAt ||
    !QUOTATION_STATUSES.includes(value.status as QuotationStatus)
  )
    throw new Error("Invalid quotation record identity or status.");
  if (
    !value.reference.startsWith(
      `FB-${southAfricanDate(new Date(value.createdAt)).slice(0, 4)}-`,
    ) ||
    !isRecord(value.customer) ||
    !isRecord(value.event) ||
    !isRecord(value.snapshot)
  )
    throw new Error("Invalid quotation record details.");
  const snapshot = value.snapshot;
  validateRequestPolicy(snapshot.requestPolicy);
  const customer = value.customer as unknown as CustomerDetails;
  const event = {
    ...value.event,
    guests: String(value.event.guests),
  } as unknown as EventFormValues;
  if (
    Object.keys(validateCustomer(customer)).length ||
    typeof value.event.guests !== "number" ||
    Object.keys(
      validateEvent(event, snapshot.requestPolicy, new Date(value.createdAt)),
    ).length
  )
    throw new Error("Stored customer or event details are invalid.");
  const configuration = validateConfiguration(snapshot.configuration);
  validatePricingRules(snapshot.pricingRules);
  const expectedEstimate = calculateCakeEstimate(
    configuration,
    snapshot.pricingRules,
  );
  if (
    expectedEstimate.status === "invalid" ||
    stableJSON(snapshot.estimate) !== stableJSON(expectedEstimate) ||
    stableJSON(snapshot.tierSizesInches) !==
      stableJSON(tierDimensions(configuration).map((tier) => tier.inches)) ||
    snapshot.disclaimer !== ESTIMATE_DISCLAIMER
  )
    throw new Error("Stored cake estimate or tier snapshot is invalid.");
  if (
    configuration.selectedProductId === null
      ? snapshot.selectedProduct !== null
      : !isRecord(snapshot.selectedProduct) ||
        snapshot.selectedProduct.id !== configuration.selectedProductId ||
        typeof snapshot.selectedProduct.name !== "string" ||
        !snapshot.selectedProduct.name.trim()
  )
    throw new Error("Stored product snapshot is invalid.");
  if (expectedEstimate.pricingMode === 'official-range') {
    const official = snapshot.official;
    const pricing = snapshot.pricingRules.officialCatalogue!;
    const product = pricing.products[configuration.selectedProductId!];
    if (!isRecord(official) || official.productId !== configuration.selectedProductId || official.productName !== product.name || official.image !== product.image || official.category !== product.category || official.flavour !== (selectedOfficialFlavour(configuration)) || official.flavourSurchargeCents !== expectedEstimate.flavourSurchargesCents || official.minimumBaseCents !== pricing.minimumBaseCents || official.maximumBaseCents !== pricing.maximumBaseCents || official.minimumEstimateCents !== expectedEstimate.minimumEstimateCents || official.maximumEstimateCents !== expectedEstimate.maximumEstimateCents || official.personalisationInstructions !== (configuration.personalisationInstructions || '') || official.pricingVersion !== pricing.version || official.priceStatus !== 'Estimated range') throw new Error('Stored official range snapshot is invalid.');
  } else if (snapshot.official !== undefined) throw new Error('Official snapshot requires official range pricing.');
  validateReferenceCollection(
    value.references as QuotationRecord["references"],
    snapshot.requestPolicy,
  );
  if (
    (value.references as QuotationRecord["references"]).length &&
    !configuration.quotationRequirements.referenceDesign
  )
    throw new Error(
      "Reference images must be marked for manual quotation review.",
    );
  if (!Array.isArray(value.statusHistory) || !value.statusHistory.length)
    throw new Error("Quotation status history is missing.");
  let previous: QuotationStatus | null = null;
  let previousAt = value.createdAt;
  for (let index = 0; index < value.statusHistory.length; index++) {
    const entry = value.statusHistory[index];
    if (
      !isRecord(entry) ||
      !validTimestamp(entry.at) ||
      entry.at < previousAt ||
      entry.at > value.updatedAt ||
      entry.from !== previous ||
      !QUOTATION_STATUSES.includes(entry.to as QuotationStatus) ||
      (index === 0
        ? entry.to !== "New" || entry.at !== value.createdAt
        : !canTransitionStatus(previous!, entry.to as QuotationStatus) ||
          previous === entry.to)
    )
      throw new Error("Invalid quotation status history.");
    previous = entry.to as QuotationStatus;
    previousAt = entry.at;
  }
  if (previous !== value.status || previousAt !== value.updatedAt)
    throw new Error("Quotation status does not match its history.");
  return deepFreeze(
    structuredClone({
      version: 1,
      id: value.id,
      reference: value.reference,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      status: value.status,
      customer: normalizeCustomer(customer),
      event: normalizeEvent(event),
      snapshot: {
        configuration,
        tierSizesInches: snapshot.tierSizesInches,
        selectedProduct: snapshot.selectedProduct,
        ...(snapshot.official !== undefined ? { official: snapshot.official as unknown as QuotationRecord['snapshot']['official'] } : {}),
        pricingRules: snapshot.pricingRules,
        estimate: expectedEstimate,
        disclaimer: ESTIMATE_DISCLAIMER,
        requestPolicy: snapshot.requestPolicy as QuotationRequestPolicy,
      },
      references: value.references,
      statusHistory: value.statusHistory as StatusHistoryEntry[],
      demo: true,
    }) as QuotationRecord,
  );
}
