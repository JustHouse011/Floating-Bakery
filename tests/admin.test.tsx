import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  IndexedDbAdminRepository,
  defaultWorkspace,
  validateWorkspace,
  validateProduct,
  validateSettings,
  publishedRules,
  validateAudit,
} from "../src/services/adminRepository";
import { IndexedDbQuotationRepository } from "../src/services/quotationRepository";
import {
  openLocalDatabase,
  localTransaction,
} from "../src/services/localDatabase";
import {
  filterQuotations,
  groupCalendarEvents,
  quotationAnalytics,
} from "../src/services/adminAnalytics";
import { moneyToCents } from "../src/services/adminMoney";
import { submitQuotation } from "../src/services/quotationService";
import { captureQuotationSnapshot } from "../src/services/quotationSnapshot";
import { validateQuotationRecord } from "../src/services/quotationRecord";
import {
  validateEvent,
  validateRequestPolicy,
} from "../src/services/quotationValidation";
import { defaultConfiguration } from "../src/data/designer";
import { cakePricingRules } from "../src/data/cakePricing";
import { quotationRequestPolicy, emptyEvent } from "../src/data/quotation";
import {
  adminStore,
  initializeWorkspace,
  saveProduct,
  publishPricing,
  saveSettings,
  resetLocalDemo,
} from "../src/store/adminStore";
import { cakePricingStore } from "../src/store/cakePricingStore";
import { cakeDesignerStore } from "../src/store/cakeDesignerStore";
import { calculateCakeEstimate } from "../src/services/pricingEngine";
import { configurationForProduct } from "../src/services/cakeConfiguration";
import {
  formatRand,
  formatZARCents,
  setCurrencyLocale,
} from "../src/utils/currency";
import { stableJSON } from "../src/utils/quotation";
import { buildEstimateSummary } from "../src/services/estimateSummary";
import { Cakes, CakeDetail } from "../src/pages/Cakes";
import Home from "../src/pages/Home";
import Admin from "../src/pages/Admin/Admin";
import { Overview, Calendar, Reports } from "../src/pages/Admin/AnalyticsPages";
import { Quotations, QuotationDetail } from "../src/pages/Admin/QuotationPages";
import { RecordsContext } from "../src/pages/Admin/RecordsContext";
import type { Product } from "../src/types";
import type { QuotationDraft, QuotationRecord } from "../src/types/quotation";
const NOW = new Date("2026-10-13T08:00:00.000Z");
const draft = (): QuotationDraft => ({
  id: crypto.randomUUID(),
  configuration: defaultConfiguration(),
  customer: {
    fullName: "Demo Customer",
    email: "customer@example.test",
    contactNumber: "0821234567",
    preferredContactMethod: "Email",
  },
  event: { ...emptyEvent(), eventDate: "2026-10-20", guests: "20" },
  references: [],
  demoConsent: true,
});
function environment() {
  const factory = new IDBFactory();
  const name = `admin-test-${crypto.randomUUID()}`;
  return {
    factory,
    name,
    admin: new IndexedDbAdminRepository(
      () => factory,
      name,
      () => NOW,
    ),
    quotes: new IndexedDbQuotationRepository(
      () => factory,
      name,
      () => NOW,
    ),
  };
}
const product = (): Product => ({
  ...defaultWorkspace().products[0],
  id: `product-${crypto.randomUUID()}`,
  name: "Lemon Celebration",
  price: 765.25,
  featured: false,
});
async function saved(env = environment(), request = draft()) {
  return submitQuotation(request, () => cakePricingRules, env.quotes, {
    now: () => NOW,
  });
}
async function rawPut(
  env: ReturnType<typeof environment>,
  store: string,
  value: unknown,
) {
  const db = await openLocalDatabase(env.factory, env.name);
  await localTransaction(db, [store], "readwrite", (tx) => {
    tx.objectStore(store).put(value);
  });
}
function recordsHTML(component: React.ReactNode, records: QuotationRecord[]) {
  return renderToString(
    <MemoryRouter>
      <RecordsContext.Provider
        value={{ records, loading: false, error: "", refresh: async () => {} }}
      >
        {component}
      </RecordsContext.Provider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    configurable: true,
    writable: true,
  });
  adminStore.setState({
    workspace: defaultWorkspace(),
    ready: false,
    error: "",
    busy: false,
  });
  cakePricingStore.getState().setRules(structuredClone(cakePricingRules));
  cakeDesignerStore.getState().resetDesign();
  setCurrencyLocale("en-ZA");
});

test("administration defaults preserve six cake seeds and add twelve official products and supplied contacts", async () => {
  const env = environment();
  const w = await env.admin.load();
  assert.equal(w.products.length, 61);
  assert.equal(w.products[0].price, 450);
  assert.equal(w.settings.email, "guguminnaar@gmail.com");
  assert.equal(w.settings.phone, "073 126 8382");
  assert.equal(w.settings.address, "Thatchfield, Centurion");
  assert.equal((await env.quotes.list()).length, 0);
  assert.ok(Object.isFrozen(w.rules));
});
test("product creation commits matching package and catalogue together", async () => {
  await initializeWorkspace();
  const p = product();
  await saveProduct(p);
  const w = adminStore.getState().workspace;
  assert.equal(w.products.find((x) => x.id === p.id)?.price, 765.25);
  assert.equal(w.rules.productPackages[p.id].startingPriceCents, 76525);
  assert.equal(w.rules.productPackages[p.id].name, p.name);
  assert.equal(w.rules.productPackages[p.id].baseline.size, 8);
  assert.equal(w.revision, 1);
});
test("product editing preserves its identifier and inclusion baseline while updating pricing and name", async () => {
  await initializeWorkspace();
  const p = {
    ...adminStore.getState().workspace.products[0],
    name: "Updated Vanilla",
    price: 500.5,
  };
  await saveProduct(p);
  const w = adminStore.getState().workspace;
  assert.equal(w.products.length, 61);
  assert.equal(w.products[0].name, p.name);
  assert.equal(w.rules.productPackages[p.id].startingPriceCents, 50050);
  assert.deepEqual(
    w.rules.productPackages[p.id].baseline,
    cakePricingRules.productPackages[p.id].baseline,
  );
});
test("created products and published presets work in the existing designer and quotation snapshot", async () => {
  await initializeWorkspace();
  const p = product();
  await saveProduct(p);
  cakeDesignerStore.getState().selectProduct(p.id);
  const c = cakeDesignerStore.getState().configuration;
  const rules = cakePricingStore.getState().rules;
  assert.equal(c.selectedProductId, p.id);
  assert.equal(calculateCakeEstimate(c, rules).estimatedTotalCents, 76525);
  assert.equal(
    captureQuotationSnapshot(c, rules, [], quotationRequestPolicy)
      .selectedProduct?.name,
    p.name,
  );
});
test("catalogue, detail and featured home consume the same live catalogue", async () => {
  await initializeWorkspace();
  const p = { ...product(), featured: true };
  await saveProduct(p);
  // Select only this product for the capped homepage feature section.
  for (const existing of adminStore.getState().workspace.products.filter(item => item.id !== p.id && item.featured)) await saveProduct({ ...existing, featured: false });
  const initial = adminStore.getInitialState;
  adminStore.getInitialState = adminStore.getState;
  try {
    assert.match(
      renderToString(
        <MemoryRouter>
          <Cakes />
        </MemoryRouter>,
      ),
      /Lemon Celebration/,
    );
    assert.match(
      renderToString(
        <MemoryRouter>
          <Home />
        </MemoryRouter>,
      ),
      /Lemon Celebration/,
    );
    await saveProduct({ ...p, featured: false });
    assert.doesNotMatch(
      renderToString(
        <MemoryRouter>
          <Home />
        </MemoryRouter>,
      ),
      /Lemon Celebration/,
    );
    assert.match(
      renderToString(
        <MemoryRouter>
          <Cakes />
        </MemoryRouter>,
      ),
      /Lemon Celebration/,
    );
  } finally {
    adminStore.getInitialState = initial;
  }
});
test("archiving hides products from public lists while retaining rules and historical snapshot", async () => {
  await initializeWorkspace();
  const p = adminStore.getState().workspace.products[0];
  const env = environment();
  const req = draft();
  req.configuration = configurationForProduct(p.id);
  const quote = await saved(env, req);
  await saveProduct({ ...p, archived: true });
  const initial = adminStore.getInitialState;
  adminStore.getInitialState = adminStore.getState;
  try {
    const html = renderToString(
      <MemoryRouter>
        <Cakes />
      </MemoryRouter>,
    );
    assert.doesNotMatch(html, new RegExp(`href="/cakes/${p.id}"`));
  } finally {
    adminStore.getInitialState = initial;
  }
  assert.ok(cakePricingStore.getState().rules.productPackages[p.id]);
  assert.equal(
    stableJSON((await env.quotes.getById(quote.id))?.snapshot),
    stableJSON(quote.snapshot),
  );
});
test("designer eligibility removes public customisation links", async () => {
  await initializeWorkspace();
  await saveProduct({
    ...adminStore.getState().workspace.products[0],
    designerEligible: false,
  });
  const initial = adminStore.getInitialState;
  adminStore.getInitialState = adminStore.getState;
  try {
    const html = renderToString(
      <MemoryRouter>
        <Cakes />
      </MemoryRouter>,
    );
    assert.doesNotMatch(html, /href="\/cake-designer\?product=vanilla"/);
    assert.match(html, /href="\/cakes\/vanilla"/);
  } finally {
    adminStore.getInitialState = initial;
  }
});
test("archive restoration and refresh preserve edited fields", async () => {
  await initializeWorkspace();
  const p = product();
  await saveProduct({ ...p, archived: true });
  await saveProduct({ ...p, archived: false, name: "Restored Lemon" });
  await initializeWorkspace();
  const persisted = adminStore
    .getState()
    .workspace.products.find((x) => x.id === p.id);
  assert.equal(persisted?.name, "Restored Lemon");
  assert.equal(persisted?.archived, false);
});
for (const [label, patch] of [
  ["negative price", { price: -1 }],
  ["sub-cent price", { price: 1.001 }],
  ["unsafe price", { price: Number.MAX_SAFE_INTEGER }],
  ["invalid image protocol", { image: "javascript:alert(1)" }],
  ["missing name", { name: "" }],
  ["unknown category", { category: "Invalid" }],
  ["missing boolean", { featured: undefined }],
] as const)
  test(`product validation rejects ${label}`, () =>
    assert.throws(() => validateProduct({ ...product(), ...patch })));
test("new pricing is versioned and reflected in the existing engine after reload", async () => {
  await initializeWorkspace();
  const rules = structuredClone(cakePricingRules);
  rules.basePricesCents[8] = 77777;
  const old = adminStore.getState().workspace.rules.version;
  await publishPricing(rules);
  assert.notEqual(cakePricingStore.getState().rules.version, old);
  assert.equal(
    calculateCakeEstimate(
      defaultConfiguration(),
      cakePricingStore.getState().rules,
    ).estimatedTotalCents,
    77777,
  );
  await initializeWorkspace();
  assert.equal(cakePricingStore.getState().rules.basePricesCents[8], 77777);
});
test("package price publication also synchronises public starting prices", async () => {
  await initializeWorkspace();
  const rules = structuredClone(cakePricingRules);
  rules.productPackages.vanilla.startingPriceCents = 55555;
  await publishPricing(rules);
  assert.equal(
    adminStore.getState().workspace.products.find((p) => p.id === "vanilla")
      ?.price,
    555.55,
  );
});
test("published product baselines are used by designer presets", async () => {
  await initializeWorkspace();
  const rules = structuredClone(cakePricingRules);
  rules.productPackages.vanilla.baseline.flavour = "Lemon";
  await publishPricing(rules);
  cakeDesignerStore.getState().selectProduct("vanilla");
  assert.equal(cakeDesignerStore.getState().configuration.flavour, "Lemon");
});
test("publishing invalid prices never replaces persisted or active rules", async () => {
  await initializeWorkspace();
  const old = stableJSON(adminStore.getState().workspace);
  const rules = structuredClone(cakePricingRules);
  rules.basePricesCents[8] = -10;
  await assert.rejects(() => publishPricing(rules));
  assert.equal(stableJSON(adminStore.getState().workspace), old);
  await initializeWorkspace();
  assert.equal(stableJSON(adminStore.getState().workspace), old);
});
test("pricing preview leaves active rules and workspace untouched", async () => {
  await initializeWorkspace();
  const rules = structuredClone(cakePricingRules);
  rules.basePricesCents[8] = 82000;
  assert.equal(
    calculateCakeEstimate(defaultConfiguration(), rules).estimatedTotalCents,
    82000,
  );
  assert.equal(cakePricingStore.getState().rules.basePricesCents[8], 65000);
  assert.equal(adminStore.getState().workspace.revision, 0);
});
test("version identifiers differ for consecutive publications at the same timestamp", () => {
  assert.notEqual(
    publishedRules(cakePricingRules, 1, NOW).version,
    publishedRules(cakePricingRules, 2, NOW).version,
  );
  assert.equal(
    publishedRules(cakePricingRules, 1, NOW).effectiveDate,
    "2026-10-13",
  );
});
test("inconsistent product and pricing records are rejected", () => {
  const w = defaultWorkspace();
  w.products[0].price = 999;
  assert.throws(() => validateWorkspace(w), /agree/);
});
test("concurrent stale workspace writes are rejected instead of losing changes", async () => {
  const env = environment();
  const w = structuredClone(await env.admin.load());
  const other = structuredClone(w);
  w.revision = 1;
  w.settings.description = "First writer";
  await env.admin.save(w, 0);
  other.revision = 1;
  other.settings.description = "Stale writer";
  await assert.rejects(() => env.admin.save(other, 0), /Another tab/);
  assert.equal((await env.admin.load()).settings.description, "First writer");
});
test("quotation search, status and inclusive event date filters combine", async () => {
  const env = environment();
  const a = await saved(env);
  const d = draft();
  d.customer.fullName = "Another Customer";
  d.event.eventDate = "2026-11-01";
  await saved(env, d);
  await env.quotes.updateStatus(a.id, "Under Review");
  const rows = await env.quotes.list();
  assert.equal(
    filterQuotations(rows, {
      search: "DEMO",
      status: "Under Review",
      from: "2026-10-20",
      to: "2026-10-20",
    }).length,
    1,
  );
  assert.equal(filterQuotations(rows, { search: a.reference }).length, 1);
  assert.equal(
    filterQuotations(rows, { from: "2026-10-21", to: "2026-10-31" }).length,
    0,
  );
});
test("status transitions retain immutable snapshots and do not accept a prepared revision", async () => {
  const env = environment();
  const q = await saved(env);
  await env.admin.appendAudit(q.id, {
    reason: "Additional custom work",
    amountCents: 90000,
  });
  assert.equal((await env.quotes.getById(q.id))?.status, "New");
  await assert.rejects(() => env.quotes.updateStatus(q.id, "Approved"));
  const changed = await env.quotes.updateStatus(q.id, "Under Review");
  assert.equal(stableJSON(changed.snapshot), stableJSON(q.snapshot));
});
test("revision history retains original amount, pricing version and configuration", async () => {
  const env = environment();
  const q = await saved(env);
  await env.admin.appendAudit(q.id, {
    reason: "Handmade flowers",
    amountCents: 88000,
  });
  const audit = await env.admin.appendAudit(q.id, {
    reason: "Updated flower count",
    amountCents: 92000,
  });
  assert.equal(audit.revisions.length, 2);
  assert.equal(audit.revisions[0].originalEstimateCents, 65000);
  assert.equal(
    audit.revisions[0].originalPricingVersion,
    q.snapshot.pricingRules.version,
  );
  assert.equal(audit.revisions[0].at, NOW.toISOString());
  assert.deepEqual(
    audit.revisions[0].originalConfiguration,
    q.snapshot.configuration,
  );
  assert.equal(
    (await env.admin.audit(q.id)).revisions[1].revisedAmountCents,
    92000,
  );
  assert.equal(
    stableJSON((await env.quotes.getById(q.id))?.snapshot),
    stableJSON(q.snapshot),
  );
});
test("concurrent internal notes append without losing either note", async () => {
  const env = environment();
  const q = await saved(env);
  await Promise.all([
    env.admin.appendAudit(q.id, { note: "First note" }),
    env.admin.appendAudit(q.id, { note: "Second note" }),
  ]);
  const audit = await env.admin.audit(q.id);
  assert.equal(audit.notes.length, 2);
  assert.ok(Object.isFrozen(audit.notes));
  assert.equal(audit.revisions.length, 0);
});
test("invalid revisions and notes cannot create audit history", async () => {
  const env = environment();
  const q = await saved(env);
  await assert.rejects(() =>
    env.admin.appendAudit(q.id, { reason: "", amountCents: 20000 }),
  );
  await assert.rejects(() =>
    env.admin.appendAudit(q.id, { reason: "Invalid", amountCents: -1 }),
  );
  await assert.rejects(() =>
    env.admin.appendAudit(q.id, { reason: "Invalid", amountCents: 1.5 }),
  );
  await assert.rejects(() => env.admin.appendAudit(q.id, { note: " " }));
  assert.equal((await env.admin.audit(q.id)).revisions.length, 0);
  assert.equal((await env.admin.audit(q.id)).notes.length, 0);
});
test("notes and revisions require an existing validated quotation", async () => {
  const env = environment();
  await assert.rejects(() =>
    env.admin.appendAudit(crypto.randomUUID(), { note: "Missing quote" }),
  );
});
test("manual quotation revisions retain null estimate and original indicative amount", async () => {
  const env = environment();
  const request = draft();
  request.configuration.quotationRequirements.complexBespoke = true;
  const q = await saved(env, request);
  const audit = await env.admin.appendAudit(q.id, {
    reason: "Bespoke work priced",
    amountCents: 150000,
  });
  assert.equal(audit.revisions[0].originalEstimateCents, null);
  assert.equal(
    audit.revisions[0].originalIndicativeCents,
    q.snapshot.estimate.indicativeTotalCents,
  );
});
test("invalid audit metadata is detected", () => {
  assert.throws(() =>
    validateAudit({
      id: crypto.randomUUID(),
      schemaVersion: 9,
      notes: [],
      revisions: [],
    }),
  );
  assert.throws(() =>
    validateAudit({
      id: crypto.randomUUID(),
      schemaVersion: 1,
      notes: [{ id: crypto.randomUUID(), text: "Valid", at: "invalid" }],
      revisions: [],
    }),
  );
});
test("dashboard metrics derive counts and estimates from original saved records only", async () => {
  const env = environment();
  const q = await saved(env);
  const manual = draft();
  manual.configuration.quotationRequirements.complexBespoke = true;
  await saved(env, manual);
  const declined = draft();
  declined.event.eventDate = "2026-10-21";
  const d = await saved(env, declined);
  await env.quotes.updateStatus(d.id, "Declined");
  await env.admin.appendAudit(q.id, {
    reason: "Revision",
    amountCents: 999999,
  });
  const a = quotationAnalytics(await env.quotes.list(), "2026-10-13");
  assert.equal(a.total, 3);
  assert.equal(a.status.New, 2);
  assert.equal(a.status.Declined, 1);
  assert.equal(a.estimatedValueCents, 130000);
  assert.equal(a.manualCount, 1);
  assert.equal(a.upcoming.length, 2);
  assert.deepEqual(a.flavours, [["Vanilla", 3]]);
  assert.deepEqual(a.sizes, [["8 inch base", 3]]);
});
test("analytics return genuine zero empty states", () => {
  const a = quotationAnalytics([], "2026-10-13");
  assert.equal(a.total, 0);
  assert.equal(a.estimatedValueCents, 0);
  assert.equal(a.upcoming.length, 0);
  assert.deepEqual(a.activity, []);
  assert.equal(a.status.Approved, 0);
});
test("decoration and demand reports count selections and group event months", async () => {
  const env = environment();
  const d = draft();
  d.configuration.decorations.flowers = true;
  d.configuration.decorations.pearls = true;
  d.event.eventDate = "2026-11-05";
  const q = await saved(env, d);
  const a = quotationAnalytics([q], "2026-10-13");
  assert.deepEqual(a.decorations, [
    ["flowers", 1],
    ["pearls", 1],
  ]);
  assert.deepEqual(a.demand, [["2026-11", 1]]);
});
test("calendar groups multiple requests by month and status without auto approval", async () => {
  const env = environment();
  const a = await saved(env);
  const second = await saved(env);
  await env.quotes.updateStatus(second.id, "Under Review");
  const rows = await env.quotes.list();
  assert.equal(groupCalendarEvents(rows, "2026-10")["2026-10-20"].length, 2);
  assert.equal(
    groupCalendarEvents(rows, "2026-10", "New")["2026-10-20"][0].id,
    a.id,
  );
  assert.deepEqual(groupCalendarEvents(rows, "2026-11"), {});
  assert.deepEqual(groupCalendarEvents(rows, "2026-10", "Approved"), {});
});
test("upcoming demand excludes past and declined requests while local approved is not revenue", async () => {
  const env = environment();
  const q = await saved(env);
  await env.quotes.updateStatus(q.id, "Under Review");
  await env.quotes.updateStatus(q.id, "Quoted");
  const approved = await env.quotes.updateStatus(q.id, "Approved");
  const a = quotationAnalytics([approved], "2026-10-21");
  assert.equal(a.status.Approved, 1);
  assert.equal(a.upcoming.length, 0);
  assert.equal(a.estimatedValueCents, 65000);
});
test("version 1 database migration preserves Phase 4 snapshots and image blobs", async () => {
  const env = environment();
  const source = environment();
  const d = draft();
  const bytes = new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFcAAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  d.references = [
    {
      id: crypto.randomUUID(),
      name: "reference.png",
      type: "image/png",
      size: bytes.length,
      blob: new Blob([bytes], { type: "image/png" }),
    },
  ];
  const q = await saved(source, d);
  const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = env.factory.open(env.name, 1);
    r.onupgradeneeded = () =>
      r.result
        .createObjectStore("quotations", { keyPath: "id" })
        .createIndex("reference", "reference", { unique: true });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  await localTransaction(legacy, ["quotations"], "readwrite", (tx) => {
    tx.objectStore("quotations").add(q);
  });
  await env.admin.load();
  const migrated = await env.quotes.getById(q.id);
  assert.equal(stableJSON(migrated?.snapshot), stableJSON(q.snapshot));
  assert.deepEqual(
    new Uint8Array(await migrated!.references[0].blob.arrayBuffer()),
    bytes,
  );
  const db = await openLocalDatabase(env.factory, env.name);
  assert.equal(db.version, 4);
  assert.ok(db.objectStoreNames.contains("quotationAudit"));
  db.close();
});
test("invalid stored workspace is surfaced and never silently replaced by seeds", async () => {
  const env = environment();
  await env.admin.load();
  await rawPut(env, "workspace", { id: "workspace", schemaVersion: 99 });
  await assert.rejects(() => env.admin.load(), /invalid/);
  const db = await openLocalDatabase(env.factory, env.name);
  const raw = await localTransaction<unknown>(
    db,
    ["workspace"],
    "readonly",
    (tx, finish) => {
      const r = tx.objectStore("workspace").get("workspace");
      r.onsuccess = () => finish(r.result);
    },
  );
  assert.deepEqual(raw, { id: "workspace", schemaVersion: 99 });
});
test("storage unavailability provides an actionable error", async () => {
  await assert.rejects(
    () => new IndexedDbAdminRepository(() => undefined).load(),
    /storage is unavailable/,
  );
});
test("aborted multi-store transaction leaves prior data unchanged", async () => {
  const env = environment();
  const q = await saved(env);
  await env.admin.load();
  const db = await openLocalDatabase(env.factory, env.name);
  await assert.rejects(
    () =>
      localTransaction(
        db,
        ["workspace", "quotations"],
        "readwrite",
        (tx, _finish, fail) => {
          tx.objectStore("quotations").clear();
          tx.objectStore("workspace").clear();
          fail(new Error("Simulated storage failure"));
        },
      ),
    /Simulated storage/,
  );
  assert.equal((await env.quotes.list()).length, 1);
  assert.equal((await env.quotes.getById(q.id))?.id, q.id);
  assert.equal((await env.admin.load()).products.length, 61);
});
test("reset requires exact confirmation and preserves data after a rejected confirmation", async () => {
  const env = environment();
  await saved(env);
  await assert.rejects(() => env.admin.reset("RESET"), /confirm/);
  assert.equal((await env.quotes.list()).length, 1);
});
test("confirmed reset atomically clears quotations and audits and restores seeded configuration", async () => {
  const env = environment();
  const q = await saved(env);
  await env.admin.appendAudit(q.id, { note: "Delete this with reset" });
  const w = structuredClone(await env.admin.load());
  w.settings.description = "Changed";
  w.revision = 1;
  await env.admin.save(w, 0);
  const reset = await env.admin.reset("RESET LOCAL DEMO");
  assert.equal((await env.quotes.list()).length, 0);
  assert.equal((await env.admin.audit(q.id)).notes.length, 0);
  assert.deepEqual(reset, defaultWorkspace());
  assert.deepEqual(await env.admin.load(), defaultWorkspace());
});
test("store reset refreshes active pricing and catalogue", async () => {
  await initializeWorkspace();
  const p = product();
  await saveProduct(p);
  await resetLocalDemo("RESET LOCAL DEMO");
  assert.equal(adminStore.getState().workspace.products.length, 61);
  assert.equal(
    cakePricingStore.getState().rules.version,
    cakePricingRules.version,
  );
});
test("settings persist, new request policy applies lead time and supported areas, old snapshots remain valid", async () => {
  await initializeWorkspace();
  const env = environment();
  const q = await saved(env);
  const settings = {
    ...adminStore.getState().workspace.settings,
    minimumLeadDays: 10,
    deliveryAreas: ["Sandton"],
    collectionInstructions: "Arrange collection time",
    disclaimer: "Bakery review required",
  };
  await saveSettings(settings);
  await initializeWorkspace();
  assert.equal(adminStore.getState().workspace.settings.minimumLeadDays, 10);
  const policy = {
    ...quotationRequestPolicy,
    minimumLeadDays: 10,
    deliveryAreas: ["Sandton"],
  };
  assert.ok(validateEvent(draft().event, policy, NOW).eventDate);
  assert.ok(
    validateEvent(
      {
        ...draft().event,
        eventDate: "2026-10-25",
        fulfilment: "Delivery",
        deliveryArea: "Unknown",
      },
      policy,
      NOW,
    ).deliveryArea,
  );
  assert.deepEqual(
    validateEvent(
      {
        ...draft().event,
        eventDate: "2026-10-25",
        fulfilment: "Delivery",
        deliveryArea: "sandton",
      },
      policy,
      NOW,
    ),
    {},
  );
  assert.doesNotThrow(() => validateQuotationRecord(q));
});
test("invalid settings cannot replace active configuration", async () => {
  await initializeWorkspace();
  const settings = {
    ...adminStore.getState().workspace.settings,
    minimumLeadDays: -1,
  };
  await assert.rejects(() => saveSettings(settings));
  assert.equal(adminStore.getState().workspace.settings.minimumLeadDays, 0);
  assert.throws(() =>
    validateSettings({ ...defaultWorkspace().settings, email: "invalid" }),
  );
  assert.throws(() =>
    validateSettings({
      ...defaultWorkspace().settings,
      deliveryAreas: ["Sandton", "sandton"],
    }),
  );
  assert.throws(() =>
    validateRequestPolicy({ ...quotationRequestPolicy, deliveryAreas: [1] }),
  );
});
test("request snapshots preserve additional disclaimer, collection instructions and delivery policy", async () => {
  const env = environment();
  const policy = {
    ...quotationRequestPolicy,
    businessDisclaimer: "Subject to approval",
    collectionInstructions: "Arrange a time",
    deliveryAreas: ["Sandton"],
  };
  const q = await submitQuotation(draft(), () => cakePricingRules, env.quotes, {
    now: () => NOW,
    policy,
  });
  assert.equal(
    (await env.quotes.getById(q.id))?.snapshot.requestPolicy.businessDisclaimer,
    "Subject to approval",
  );
  assert.equal(
    (await env.quotes.getById(q.id))?.snapshot.requestPolicy
      .collectionInstructions,
    "Arrange a time",
  );
  policy.deliveryAreas.push("New area");
  assert.deepEqual(q.snapshot.requestPolicy.deliveryAreas, ["Sandton"]);
});
test("money parsing and display retain cents and reject ambiguous input", () => {
  assert.equal(moneyToCents("765.25"), 76525);
  assert.equal(moneyToCents("0"), 0);
  assert.equal(moneyToCents("1.2"), 120);
  for (const n of ["", "-1", "1.001", "1e2", "Infinity", "NaN", "1,000"])
    assert.throws(() => moneyToCents(n));
  assert.match(formatRand(765.25), /765[.,]25/);
  assert.match(formatZARCents(76525), /765[.,]25/);
  setCurrencyLocale("en-GB");
  assert.match(formatZARCents(76525), /ZAR/);
});
test("admin routes render standalone workspace navigation and clear local access limitations", () => {
  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/pricing",
    "/admin/quotations",
    "/admin/calendar",
    "/admin/reports",
    "/admin/settings",
  ]) {
    const html = renderToString(
      <MemoryRouter initialEntries={[path]}>
        <Admin />
      </MemoryRouter>,
    );
    assert.match(html, /<main/);
    assert.match(html, /Administration/);
    assert.match(html, /no authentication/);
    assert.doesNotMatch(html, /Made for your special moments/);
  }
});
test("dashboard, reports and quotation list render actual stored metrics and empty states without GPU", async () => {
  const env = environment();
  const q = await saved(env);
  assert.match(
    recordsHTML(<Overview />, [q]),
    /Original estimated|original estimated/,
  );
  assert.match(recordsHTML(<Overview />, [q]), /650/);
  assert.match(recordsHTML(<Reports />, [q]), /Vanilla/);
  assert.match(recordsHTML(<Quotations />, [q]), new RegExp(q.reference));
  assert.match(recordsHTML(<Reports />, []), /No saved quotation requests/);
  assert.match(recordsHTML(<Calendar />, []), /verified booking/);
  assert.match(recordsHTML(<QuotationDetail />, [q]), /Quotation not found/);
});
test("public product detail reflects edited products and rejects archived identifiers", () => {
  const initial = adminStore.getInitialState;
  const w = defaultWorkspace();
  w.products[0].name = "Updated Vanilla";
  adminStore.setState({ workspace: w });
  adminStore.getInitialState = adminStore.getState;
  const detail = () =>
    renderToString(
      <MemoryRouter initialEntries={["/cakes/vanilla"]}>
        <Routes>
          <Route path="cakes/:id" element={<CakeDetail />} />
        </Routes>
      </MemoryRouter>,
    );
  try {
    assert.match(detail(), /Updated Vanilla/);
    adminStore.setState({
      workspace: {
        ...w,
        products: w.products.map((p) => ({ ...p, archived: true })),
      },
    });
    assert.match(detail(), /Cake not found/);
  } finally {
    adminStore.getInitialState = initial;
  }
});
test("copied estimates use the active custom product name", async () => {
  await initializeWorkspace();
  const p = product();
  await saveProduct(p);
  const rules = cakePricingStore.getState().rules;
  const text = buildEstimateSummary(
    configurationForProduct(p.id, rules),
    rules,
  );
  assert.match(text, /Catalogue inspiration: Lemon Celebration/);
  assert.doesNotMatch(text, /undefined/);
});
test("a reset custom product cannot produce an invalid quotation snapshot", () => {
  const config = defaultConfiguration();
  config.selectedProductId = product().id;
  assert.throws(
    () =>
      captureQuotationSnapshot(
        config,
        cakePricingRules,
        [],
        quotationRequestPolicy,
      ),
    /no longer has active pricing/,
  );
});
test("report totals do not display unsafe rounded money", async () => {
  const env = environment();
  const q = await saved(env);
  const second = {
    ...q,
    id: crypto.randomUUID(),
    snapshot: {
      ...q.snapshot,
      estimate: {
        ...q.snapshot.estimate,
        estimatedTotalCents: Number.MAX_SAFE_INTEGER,
      },
    },
  };
  const a = quotationAnalytics([q, second], "2026-10-13");
  assert.equal(a.estimatedValueCents, null);
  assert.match(
    recordsHTML(<Overview />, [q, second]),
    /Total exceeds reporting range/,
  );
});
test("tampered revision snapshots are detected when reading audit history", async () => {
  const env = environment();
  const q = await saved(env);
  const audit = structuredClone(
    await env.admin.appendAudit(q.id, {
      reason: "Flowers",
      amountCents: 90000,
    }),
  );
  audit.revisions[0].originalEstimateCents = 1;
  await rawPut(env, "quotationAudit", audit);
  await assert.rejects(() => env.admin.audit(q.id), /does not match/);
  assert.equal(
    (await env.quotes.getById(q.id))?.snapshot.estimate.estimatedTotalCents,
    65000,
  );
});
