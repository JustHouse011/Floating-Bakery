import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type {
  QuotationDraft,
  ReferenceImage,
  QuotationRepository,
  QuotationStatus,
} from "../src/types/quotation";
import { QUOTATION_STATUSES } from "../src/types/quotation";
import { defaultConfiguration } from "../src/data/designer";
import { cakePricingRules } from "../src/data/cakePricing";
import {
  quotationRequestPolicy,
  emptyCustomer,
  emptyEvent,
} from "../src/data/quotation";
import {
  validateCustomer,
  validateEvent,
  normalizeSouthAfricanNumber,
  normalizeEvent,
  validateRequestPolicy,
  QuotationValidationError,
} from "../src/services/quotationValidation";
import {
  makeReferenceImage,
  validateReferenceContents,
  validateReferenceCollection,
} from "../src/services/referenceImages";
import {
  captureQuotationSnapshot,
  configurationForRequest,
} from "../src/services/quotationSnapshot";
import {
  submitQuotation,
  generateQuotationReference,
  PricingChangedError,
} from "../src/services/quotationService";
import {
  IndexedDbQuotationRepository,
  QuotationStorageError,
  quotationStorageError,
} from "../src/services/quotationRepository";
import {
  validateQuotationRecord,
  canTransitionStatus,
} from "../src/services/quotationRecord";
import {
  restoreDesign,
  DESIGN_STORAGE_KEY,
} from "../src/services/designerStorage";
import { calculateCakeEstimate } from "../src/services/pricingEngine";
import { southAfricanDate, stableJSON } from "../src/utils/quotation";
import { quotationDraftStore } from "../src/store/quotationDraftStore";
import QuotationRequest from "../src/pages/Quotation/QuotationRequest";
import QuotationSummary from "../src/components/quotation/QuotationSummary";
import App from "../src/app/App";
const NOW = new Date("2026-10-13T08:00:00.000Z");
const PNG = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFcAAAAAASUVORK5CYII=",
    "base64",
  ),
);
const customer = () => ({
  fullName: "Demo Customer",
  email: "demo@example.test",
  contactNumber: "0821234567",
  preferredContactMethod: "Email" as const,
});
const event = () => ({
  ...emptyEvent(),
  eventDate: "2026-10-20",
  guests: "24",
});
const draft = (): QuotationDraft => ({
  id: crypto.randomUUID(),
  configuration: defaultConfiguration(),
  customer: customer(),
  event: event(),
  references: [],
  demoConsent: true,
});
function environment() {
  const factory = new IDBFactory();
  const name = `quotes-test-${crypto.randomUUID()}`;
  return {
    factory,
    name,
    repository: new IndexedDbQuotationRepository(
      () => factory,
      name,
      () => new Date("2026-10-14T08:00:00.000Z"),
    ),
  };
}
async function saved(environmentValue = environment(), request = draft()) {
  return submitQuotation(
    request,
    () => structuredClone(cakePricingRules),
    environmentValue.repository,
    { now: () => NOW },
  );
}
async function image(): Promise<ReferenceImage> {
  return makeReferenceImage(
    new File([PNG], "reference.png", { type: "image/png" }),
    quotationRequestPolicy,
  );
}
beforeEach(() => quotationDraftStore.getState().clear());
test("customer validation checks all required fields and contact preferences", () => {
  assert.deepEqual(validateCustomer(customer()), {});
  const errors = validateCustomer(emptyCustomer());
  assert.ok(errors.fullName && errors.email && errors.contactNumber);
  assert.ok(
    validateCustomer({ ...customer(), preferredContactMethod: "Post" as never })
      .preferredContactMethod,
  );
  assert.ok(validateCustomer({ ...customer(), fullName: "x" }).fullName);
  assert.ok(validateCustomer({ ...customer(), email: "not-an-email" }).email);
});
test("South African phone formats normalize to +27 for mobile and landline numbers", () => {
  for (const value of [
    "0821234567",
    "082 123 4567",
    "(082) 123-4567",
    "+27 82 123 4567",
    "0027 82 123 4567",
  ])
    assert.equal(normalizeSouthAfricanNumber(value), "+27821234567");
  assert.equal(normalizeSouthAfricanNumber("021 123 4567"), "+27211234567");
});
test("invalid, foreign and incorrectly sized phone numbers are rejected", () => {
  for (const value of [
    "",
    "123",
    "+44 20 1234 5678",
    "082123456",
    "08212345678",
    "+27 0821234567",
    "0001234567",
    "082CALLNOW",
    "0821234567 ext 2",
    "27821234567",
  ])
    assert.equal(normalizeSouthAfricanNumber(value), null, value);
});
test("date validation uses Johannesburg calendar dates and configurable lead time", () => {
  assert.deepEqual(validateEvent(event(), quotationRequestPolicy, NOW), {});
  assert.ok(
    validateEvent(
      { ...event(), eventDate: "2026-10-12" },
      quotationRequestPolicy,
      NOW,
    ).eventDate,
  );
  assert.ok(
    validateEvent(
      { ...event(), eventDate: "2026-02-30" },
      quotationRequestPolicy,
      NOW,
    ).eventDate,
  );
  const late = new Date("2026-10-13T22:30:00.000Z");
  assert.equal(southAfricanDate(late), "2026-10-14");
  assert.ok(
    validateEvent(
      { ...event(), eventDate: "2026-10-13" },
      quotationRequestPolicy,
      late,
    ).eventDate,
  );
  assert.equal(
    validateEvent(
      { ...event(), eventDate: "2026-10-14" },
      quotationRequestPolicy,
      late,
    ).eventDate,
    undefined,
  );
  assert.ok(
    validateEvent(
      { ...event(), eventDate: "2026-10-14" },
      { ...quotationRequestPolicy, minimumLeadDays: 2 },
      NOW,
    ).eventDate,
  );
  assert.equal(
    validateEvent(
      { ...event(), eventDate: "2026-10-15" },
      { ...quotationRequestPolicy, minimumLeadDays: 2 },
      NOW,
    ).eventDate,
    undefined,
  );
});
test("conditional delivery area and integer guest validation work", () => {
  assert.ok(
    validateEvent(
      { ...event(), fulfilment: "Delivery" },
      quotationRequestPolicy,
      NOW,
    ).deliveryArea,
  );
  assert.equal(
    validateEvent(
      { ...event(), fulfilment: "Delivery", deliveryArea: "Demo area" },
      quotationRequestPolicy,
      NOW,
    ).deliveryArea,
    undefined,
  );
  assert.equal(
    normalizeEvent({ ...event(), deliveryArea: "Unused area" }).deliveryArea,
    "",
  );
  for (const guests of ["", "0", "-1", "1.5", "abc", "10001"])
    assert.ok(
      validateEvent({ ...event(), guests }, quotationRequestPolicy, NOW).guests,
    );
  assert.ok(
    validateEvent(
      { ...event(), specialInstructions: "x".repeat(2001) },
      quotationRequestPolicy,
      NOW,
    ).specialInstructions,
  );
});
test("invalid demonstration policies are rejected without inventing booking limits", () => {
  assert.equal(quotationRequestPolicy.minimumLeadDays, 0);
  assert.throws(() =>
    validateRequestPolicy({ ...quotationRequestPolicy, minimumLeadDays: -1 }),
  );
  assert.throws(() =>
    validateRequestPolicy({
      ...quotationRequestPolicy,
      maximumImageBytes: 1.5,
    }),
  );
});
test("JPEG, PNG and WebP content signatures are accepted", async () => {
  const fixtures: [string, string, Uint8Array][] = [
    ["reference.png", "image/png", PNG],
    [
      "reference.jpg",
      "image/jpeg",
      new Uint8Array([255, 216, 255, 224, 0, 16, 0, 0, 0, 0, 0, 0]),
    ],
    [
      "reference.webp",
      "image/webp",
      new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]),
    ],
  ];
  for (const [name, type, bytes] of fixtures) {
    const attachment = await makeReferenceImage(
      new File([bytes], name, { type }),
      quotationRequestPolicy,
    );
    assert.equal(attachment.type, type);
    assert.equal(attachment.size, bytes.length);
  }
});
test("unsupported, empty, oversized and mismatched files are rejected", async () => {
  await assert.rejects(() =>
    makeReferenceImage(
      new File(["text"], "reference.svg", { type: "image/svg+xml" }),
      quotationRequestPolicy,
    ),
  );
  await assert.rejects(() =>
    makeReferenceImage(
      new File([], "empty.png", { type: "image/png" }),
      quotationRequestPolicy,
    ),
  );
  await assert.rejects(() =>
    makeReferenceImage(
      new File(
        [new Uint8Array(quotationRequestPolicy.maximumImageBytes + 1)],
        "large.png",
        { type: "image/png" },
      ),
      quotationRequestPolicy,
    ),
  );
  await assert.rejects(() =>
    makeReferenceImage(
      new File(["not a png"], "reference.png", { type: "image/png" }),
      quotationRequestPolicy,
    ),
  );
  await assert.rejects(() =>
    makeReferenceImage(
      new File([PNG], "reference.jpg", { type: "image/png" }),
      quotationRequestPolicy,
    ),
  );
});
test("reference collection limits and duplicate IDs are validated", async () => {
  const attachment = await image();
  assert.throws(() =>
    validateReferenceCollection(
      [attachment, attachment],
      quotationRequestPolicy,
    ),
  );
  assert.throws(() =>
    validateReferenceCollection(
      Array.from({ length: 4 }, () => ({
        ...attachment,
        id: crypto.randomUUID(),
      })),
      quotationRequestPolicy,
    ),
  );
  assert.throws(() =>
    validateReferenceCollection([attachment], {
      ...quotationRequestPolicy,
      maximumTotalImageBytes: 1,
    }),
  );
});
test("adding and removing references triggers manual review without changing the studio design", async () => {
  const configuration = defaultConfiguration(),
    attachment = await image();
  const effective = configurationForRequest(configuration, [attachment]);
  assert.equal(effective.quotationRequirements.referenceDesign, true);
  assert.equal(configuration.quotationRequirements.referenceDesign, false);
  assert.equal(
    configurationForRequest(configuration, []).quotationRequirements
      .referenceDesign,
    false,
  );
  const snapshot = captureQuotationSnapshot(
    configuration,
    cakePricingRules,
    [attachment],
    quotationRequestPolicy,
  );
  assert.equal(snapshot.estimate.manualQuotationRequired, true);
  assert.equal(snapshot.estimate.estimatedTotalCents, null);
  assert.equal(snapshot.estimate.indicativeTotalCents, 65000);
});
test("draft copies remain stable across form steps and later designer edits", () => {
  const configuration = defaultConfiguration();
  quotationDraftStore.getState().start(configuration);
  configuration.size = 12;
  quotationDraftStore.getState().setCustomer({ fullName: "Demo Name" });
  quotationDraftStore.getState().setEvent({ guests: "30" });
  quotationDraftStore.getState().setStep(3);
  quotationDraftStore.getState().setStep(0);
  const current = quotationDraftStore.getState().draft!;
  assert.equal(current.configuration.size, 8);
  assert.equal(current.customer.fullName, "Demo Name");
  assert.equal(current.event.guests, "30");
  assert.ok(Object.isFrozen(current.configuration));
  assert.throws(() => quotationDraftStore.getState().setStep(4));
});
test("capture freezes the design, actual tier sizes, product and estimate snapshots", () => {
  const configuration = {
    ...defaultConfiguration(),
    size: 10 as const,
    tiers: 3 as const,
  };
  const pricing = structuredClone(cakePricingRules);
  const snapshot = captureQuotationSnapshot(
    configuration,
    pricing,
    [],
    quotationRequestPolicy,
  );
  configuration.tierColours[0] = "#000000";
  pricing.basePricesCents[10] = 1;
  assert.deepEqual(snapshot.tierSizesInches, [10, 8, 6]);
  assert.notEqual(snapshot.configuration.tierColours[0], "#000000");
  assert.equal(snapshot.estimate.estimatedTotalCents, 230000);
  assert.ok(
    Object.isFrozen(snapshot) &&
      Object.isFrozen(snapshot.configuration) &&
      Object.isFrozen(snapshot.pricingRules),
  );
  assert.throws(() => {
    snapshot.configuration.size = 12;
  });
});
test("reference generation is collision-resistant and uses the South African year", () => {
  const references = Array.from({ length: 1000 }, () =>
    generateQuotationReference(NOW),
  );
  assert.equal(new Set(references).size, 1000);
  references.forEach((reference) =>
    assert.match(reference, /^FB-2026-[A-F0-9]{16}$/),
  );
  assert.match(
    generateQuotationReference(new Date("2026-12-31T22:30:00.000Z")),
    /^FB-2027-/,
  );
});
test("submission recalculates active pricing instead of trusting draft totals", async () => {
  const request = { ...draft(), estimatedTotalCents: 1 };
  const pricing = structuredClone(cakePricingRules);
  pricing.version = "demo-latest";
  pricing.basePricesCents[8] = 80000;
  const result = await submitQuotation(
    request,
    () => pricing,
    environment().repository,
    { now: () => NOW },
  );
  assert.equal(result.snapshot.estimate.estimatedTotalCents, 80000);
  assert.equal(result.snapshot.estimate.pricingRuleVersion, "demo-latest");
  assert.equal("estimatedTotalCents" in result, false);
});
test("changed prices after review require another review before creating a record", async () => {
  const env = environment(),
    request = draft();
  const reviewed = calculateCakeEstimate(
    request.configuration,
    cakePricingRules,
  );
  const pricing = structuredClone(cakePricingRules);
  pricing.basePricesCents[8] = 80000;
  await assert.rejects(
    () =>
      submitQuotation(request, () => pricing, env.repository, {
        now: () => NOW,
        reviewedEstimate: reviewed,
      }),
    PricingChangedError,
  );
  assert.equal((await env.repository.list()).length, 0);
  const latest = calculateCakeEstimate(request.configuration, pricing);
  const result = await submitQuotation(request, () => pricing, env.repository, {
    now: () => NOW,
    reviewedEstimate: latest,
  });
  assert.equal(result.snapshot.estimate.estimatedTotalCents, 80000);
});
test("IndexedDB creates, retrieves and lists validated immutable quotation records", async () => {
  const env = environment(),
    request = draft();
  const record = await saved(env, request);
  request.configuration.size = 12;
  request.customer.fullName = "Changed";
  const retrieved = await env.repository.getById(record.id);
  assert.ok(retrieved);
  assert.equal(retrieved.customer.fullName, "Demo Customer");
  assert.equal(retrieved.snapshot.configuration.size, 8);
  assert.equal(retrieved.status, "New");
  assert.ok(Object.isFrozen(retrieved));
  assert.equal((await env.repository.list()).length, 1);
  assert.equal(await env.repository.getById(crypto.randomUUID()), undefined);
});
test("image blobs and their manual-review flag persist in IndexedDB without base64", async () => {
  const env = environment(),
    request = draft();
  request.references = [await image()];
  const record = await saved(env, request);
  const read = await env.repository.getById(record.id);
  assert.ok(read);
  assert.ok(read.references[0].blob instanceof Blob);
  assert.deepEqual(
    new Uint8Array(await read.references[0].blob.arrayBuffer()),
    PNG,
  );
  assert.equal(
    read.snapshot.configuration.quotationRequirements.referenceDesign,
    true,
  );
  assert.equal(read.snapshot.estimate.estimatedTotalCents, null);
  await validateReferenceContents(read.references[0], quotationRequestPolicy);
});
test("repository list searches by customer/reference and filters status", async () => {
  const env = environment();
  const first = await saved(env);
  const other = draft();
  other.customer.fullName = "Another Demo";
  await saved(env, other);
  assert.equal(
    (await env.repository.list({ search: first.reference })).length,
    1,
  );
  assert.equal((await env.repository.list({ search: "another" })).length, 1);
  await env.repository.updateStatus(first.id, "Under Review");
  assert.equal((await env.repository.list({ status: "New" })).length, 1);
  assert.equal(
    (await env.repository.list({ status: "Under Review" }))[0].id,
    first.id,
  );
});
test("valid status transitions preserve the original configuration and price", async () => {
  const env = environment(),
    original = await saved(env);
  for (const status of [
    "Under Review",
    "Awaiting Customer",
    "Under Review",
    "Quoted",
    "Approved",
  ] as QuotationStatus[]) {
    const result = await env.repository.updateStatus(original.id, status);
    assert.equal(result.status, status);
    assert.equal(stableJSON(result.snapshot), stableJSON(original.snapshot));
  }
  assert.equal(original.status, "New");
  const approved = await env.repository.getById(original.id);
  assert.equal(approved?.statusHistory.length, 6);
  await assert.rejects(
    () => env.repository.updateStatus(original.id, "Under Review"),
    (error) =>
      error instanceof QuotationStorageError && error.code === "transition",
  );
});
test("invalid transitions, statuses and missing records are rejected", async () => {
  const env = environment(),
    record = await saved(env);
  assert.equal(canTransitionStatus("New", "Approved"), false);
  await assert.rejects(() =>
    env.repository.updateStatus(record.id, "Approved"),
  );
  await assert.rejects(() =>
    env.repository.updateStatus(record.id, "Not a status" as QuotationStatus),
  );
  await assert.rejects(() =>
    env.repository.updateStatus(crypto.randomUUID(), "Under Review"),
  );
  assert.equal((await env.repository.getById(record.id))?.status, "New");
  for (const status of QUOTATION_STATUSES)
    assert.equal(canTransitionStatus(status, status), true);
});
test("same-status updates do not add status history entries", async () => {
  const env = environment(),
    record = await saved(env);
  const repeated = await env.repository.updateStatus(record.id, "New");
  assert.equal(repeated.statusHistory.length, 1);
});
test("duplicate submissions for one draft remain idempotent", async () => {
  const env = environment(),
    request = draft();
  const [first, second] = await Promise.all([
    saved(env, request),
    saved(env, request),
  ]);
  assert.equal(first.id, second.id);
  assert.equal(first.reference, second.reference);
  assert.equal((await env.repository.list()).length, 1);
});
test("reference collisions retry without corrupting the existing request", async () => {
  const env = environment(),
    first = await saved(env),
    request = draft();
  let calls = 0;
  const second = await submitQuotation(
    request,
    () => cakePricingRules,
    env.repository,
    {
      now: () => NOW,
      referenceFactory: () =>
        ++calls === 1 ? first.reference : generateQuotationReference(NOW),
    },
  );
  assert.notEqual(first.reference, second.reference);
  assert.equal(calls, 2);
  assert.equal((await env.repository.list()).length, 2);
});
test("missing customer/event fields and demo acknowledgement block submission", async () => {
  const env = environment(),
    request = draft();
  request.customer = emptyCustomer();
  request.event = emptyEvent();
  request.demoConsent = false;
  await assert.rejects(
    () => saved(env, request),
    (error) =>
      error instanceof QuotationValidationError &&
      Boolean(
        error.fields.fullName &&
        error.fields.eventDate &&
        error.fields.demoConsent,
      ),
  );
  assert.equal((await env.repository.list()).length, 0);
});
test("corrupt image content blocks submission before storage writes", async () => {
  const env = environment(),
    request = draft();
  request.references = [
    {
      id: crypto.randomUUID(),
      name: "wrong.png",
      type: "image/png",
      size: 12,
      blob: new Blob(["not an image"], { type: "image/png" }),
    },
  ];
  await assert.rejects(
    () => saved(env, request),
    (error) =>
      error instanceof QuotationValidationError &&
      Boolean(error.fields.references),
  );
  assert.equal((await env.repository.list()).length, 0);
});
test("unavailable IndexedDB and quota errors have recoverable messages", async () => {
  const unavailable = new IndexedDbQuotationRepository(() => undefined);
  await assert.rejects(
    () => unavailable.list(),
    (error) =>
      error instanceof QuotationStorageError && error.code === "unavailable",
  );
  const quota = quotationStorageError(
    new DOMException("full", "QuotaExceededError"),
  );
  assert.equal(quota.code, "quota");
  assert.match(quota.message, /not saved/);
  const env = environment();
  const repository: QuotationRepository = {
    getById: (id) => env.repository.getById(id),
    list: (filter) => env.repository.list(filter),
    updateStatus: (id, status) => env.repository.updateStatus(id, status),
    create: async () => {
      throw quota;
    },
  };
  await assert.rejects(
    () =>
      submitQuotation(draft(), () => cakePricingRules, repository, {
        now: () => NOW,
      }),
    (error) => error === quota,
  );
  assert.equal((await env.repository.list()).length, 0);
});
test("tampered totals, tiers, statuses and record versions are rejected", async () => {
  const record = await saved();
  const patches = [
    { version: 2 },
    { status: "Approved" },
    { reference: "FB-2026-BAD" },
    { snapshot: { ...record.snapshot, tierSizesInches: [12] } },
    {
      snapshot: {
        ...record.snapshot,
        estimate: { ...record.snapshot.estimate, estimatedTotalCents: 1 },
      },
    },
  ];
  for (const patch of patches)
    assert.throws(() => validateQuotationRecord({ ...record, ...patch }));
});
test("corrupt records in IndexedDB are detected on retrieval", async () => {
  const env = environment(),
    record = await saved(env);
  const corrupted = structuredClone(record);
  corrupted.snapshot.estimate.estimatedTotalCents = 1;
  await new Promise<void>((resolve, reject) => {
    const open = env.factory.open(env.name, 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction("quotations", "readwrite");
      transaction.objectStore("quotations").put(corrupted);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => reject(transaction.error);
    };
  });
  await assert.rejects(
    () => env.repository.getById(record.id),
    (error) =>
      error instanceof QuotationStorageError && error.code === "corrupt",
  );
});
test("historical snapshots stay valid after active prices change", async () => {
  const env = environment(),
    record = await saved(env);
  const changed = structuredClone(cakePricingRules);
  changed.basePricesCents[8] = 90000;
  const loaded = await env.repository.getById(record.id);
  assert.equal(loaded?.snapshot.estimate.estimatedTotalCents, 65000);
  assert.equal(
    calculateCakeEstimate(defaultConfiguration(), changed).estimatedTotalCents,
    90000,
  );
});
test("Phase 2 saved configurations still migrate into quotation requests", async () => {
  const legacy: Record<string, unknown> = {
    ...defaultConfiguration(),
    size: 10,
    tiers: 3,
  };
  delete legacy.quotationRequirements;
  const raw = JSON.stringify({ version: 1, configuration: legacy });
  const storage = {
    getItem: (key: string) => (key === DESIGN_STORAGE_KEY ? raw : null),
    setItem: () => {
      throw new Error("Existing localStorage must not be changed");
    },
  };
  const request = draft();
  request.configuration = restoreDesign(storage);
  const record = await saved(environment(), request);
  assert.deepEqual(record.snapshot.tierSizesInches, [10, 8, 6]);
  assert.equal(storage.getItem(DESIGN_STORAGE_KEY), raw);
});
test("customer form, review and saved summary render without a GPU", async () => {
  const request = draft();
  quotationDraftStore.getState().start(request.configuration);
  quotationDraftStore.getState().setCustomer(request.customer);
  quotationDraftStore.getState().setEvent(request.event);
  quotationDraftStore.getState().setConsent(true);
  const original = quotationDraftStore.getInitialState;
  quotationDraftStore.getInitialState = quotationDraftStore.getState;
  try {
    const form = renderToString(
      <MemoryRouter>
        <QuotationRequest />
      </MemoryRouter>,
    );
    assert.match(form, /Full name/);
    assert.match(form, /South African contact number/);
    assert.match(form, /Quotation request progress/);
    quotationDraftStore.getState().setStep(3);
    const review = renderToString(
      <MemoryRouter>
        <QuotationRequest />
      </MemoryRouter>,
    );
    assert.match(review, /Save Demo Request/);
    assert.match(review, /Demo Customer/);
    assert.match(review, /Subject to Bakery Confirmation/);
  } finally {
    quotationDraftStore.getInitialState = original;
  }
  const record = await saved();
  const summary = renderToString(
    <QuotationSummary
      customer={record.customer}
      event={record.event}
      snapshot={record.snapshot}
      images={record.references}
    />,
  );
  assert.match(summary, /20 October 2026/);
  assert.match(summary, /Vanilla/);
  assert.match(summary, /pricing/i);
});
test("new quotation routes render headings and a main landmark", () => {
  for (const path of ["/quote-request", `/quotations/${crypto.randomUUID()}`]) {
    const html = renderToString(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    assert.ok(html.includes("<h1"));
    assert.ok(html.includes('id="main"'));
  }
});
