import type { CakeEstimate, CakePricingRules } from "../types/pricing";
import type {
  QuotationDraft,
  QuotationRecord,
  QuotationRepository,
  QuotationRequestPolicy,
  QuotationErrors,
} from "../types/quotation";
import { quotationRequestPolicy } from "../data/quotation";
import {
  validateCustomer,
  validateEvent,
  normalizeCustomer,
  normalizeEvent,
  QuotationValidationError,
} from "./quotationValidation";
import {
  validateReferenceCollection,
  validateReferenceContents,
} from "./referenceImages";
import { captureQuotationSnapshot } from "./quotationSnapshot";
import { QuotationStorageError } from "./quotationRepository";
import {
  deepFreeze,
  isUUID,
  southAfricanDate,
  stableJSON,
} from "../utils/quotation";
export function generateQuotationReference(now = new Date()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `FB-${southAfricanDate(now).slice(0, 4)}-${Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase()}`;
}
export class PricingChangedError extends Error {
  constructor() {
    super(
      "Pricing has changed since review. Check the refreshed estimate and submit again.",
    );
    this.name = "PricingChangedError";
  }
}
export async function submitQuotation(
  draft: QuotationDraft,
  getActiveRules: () => CakePricingRules,
  repository: QuotationRepository,
  options: {
    policy?: QuotationRequestPolicy;
    now?: () => Date;
    reviewedEstimate?: CakeEstimate;
    referenceFactory?: (now: Date) => string;
  } = {},
): Promise<QuotationRecord> {
  const policy = structuredClone(options.policy ?? quotationRequestPolicy);
  const now = options.now ?? (() => new Date());
  const captured = structuredClone(draft);
  if (!isUUID(captured.id))
    throw new Error(
      "The request draft is invalid. Start a new request from the cake studio.",
    );
  const errors: QuotationErrors = {
    ...validateCustomer(captured.customer),
    ...validateEvent(captured.event, policy, now()),
  };
  if (captured.demoConsent !== true)
    errors.demoConsent =
      "Confirm that you understand this request is saved locally and is not sent to the bakery.";
  try {
    validateReferenceCollection(captured.references, policy);
    await Promise.all(
      captured.references.map((image) =>
        validateReferenceContents(image, policy),
      ),
    );
  } catch (error) {
    errors.references =
      error instanceof Error ? error.message : "Choose valid reference images.";
  }
  if (Object.keys(errors).length) throw new QuotationValidationError(errors);
  const existing = await repository.getById(captured.id);
  if (existing) return existing;
  const submissionTime = now();
  const finalEventErrors = validateEvent(
    captured.event,
    policy,
    submissionTime,
  );
  if (Object.keys(finalEventErrors).length)
    throw new QuotationValidationError(finalEventErrors);
  // Read the active rules after asynchronous file validation, immediately before creating the snapshot.
  const snapshot = captureQuotationSnapshot(
    captured.configuration,
    getActiveRules(),
    captured.references,
    policy,
  );
  if (
    options.reviewedEstimate &&
    stableJSON(options.reviewedEstimate) !== stableJSON(snapshot.estimate)
  )
    throw new PricingChangedError();
  const createdAt = submissionTime.toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const record: QuotationRecord = deepFreeze({
      version: 1,
      id: captured.id,
      reference: (options.referenceFactory ?? generateQuotationReference)(
        new Date(createdAt),
      ),
      createdAt,
      updatedAt: createdAt,
      status: "New",
      customer: normalizeCustomer(captured.customer),
      event: normalizeEvent(captured.event),
      snapshot,
      references: captured.references,
      statusHistory: [{ from: null, to: "New", at: createdAt }],
      demo: true,
    });
    try {
      return await repository.create(record);
    } catch (error) {
      if (
        !(error instanceof QuotationStorageError) ||
        error.code !== "duplicate"
      )
        throw error;
      const saved = await repository.getById(captured.id);
      if (saved) return saved;
      if (attempt === 2)
        throw new Error(
          "A unique reference could not be saved. Please try again.",
        );
    }
  }
  throw new Error("Your quotation could not be saved.");
}
