import { products } from "../data/products";
import { officialProducts, OFFICIAL_CONTACT, CATALOGUE_CATEGORIES } from '../data/officialCatalogue';
import { clientCakeProducts } from '../data/clientCakeCatalogue';
import { CAKE_CATEGORIES, defaultOfficialPricing, validateOfficialPricing } from './officialCakePricing';
import { cakePricingRules } from "../data/cakePricing";
import { ESTIMATE_DISCLAIMER } from "./estimateSummary";
import { validatePricingRules } from "./pricingEngine";
import { validateQuotationRecord } from "./quotationRecord";
import { validateConfiguration } from "./cakeConfiguration";
import {
  deepFreeze,
  isRecord,
  isUUID,
  southAfricanDate,
  stableJSON,
} from "../utils/quotation";
import type { Product } from "../types";
import type {
  AdminWorkspace,
  BakerySettings,
  QuotationAudit,
  AdministrationRepository,
} from "../types/admin";
import type { CakePricingRules } from "../types/pricing";
import type { QuotationRecord } from "../types/quotation";
import {
  openLocalDatabase,
  localTransaction,
  LOCAL_DATABASE,
} from "./localDatabase";
export function defaultWorkspace(): AdminWorkspace {
  return {
    id: "workspace",
    schemaVersion: 1,
    revision: 0,
    catalogueVersion: 1,
    cakeCatalogueVersion: 1,
    officialPricingHistory: [],
    products: [...products, ...officialProducts, ...clientCakeProducts].map((p) => ({
      ...p,
      archived: false,
      featured: p.featured ?? true,
      designerEligible: p.designerEligible ?? true,
    })),
    rules: { ...structuredClone(cakePricingRules), officialCatalogue: { ...defaultOfficialPricing(), products: Object.fromEntries(clientCakeProducts.map(p => [p.id, { name: p.name, image: p.image, category: p.category }])) } },
    settings: {
      businessName: "Floating Bakery & Caterers",
      description: "",
      email: OFFICIAL_CONTACT.email,
      phone: OFFICIAL_CONTACT.phone,
      address: OFFICIAL_CONTACT.location,
      collectionInstructions: "",
      disclaimer: ESTIMATE_DISCLAIMER,
      minimumLeadDays: 0,
      deliveryAreas: [],
      currency: "ZAR",
      locale: "en-ZA",
    },
  };
}
const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  (!required || !!value.trim()) &&
  !Array.from(value).some(
    (c) => c.charCodeAt(0) < 32 && !["\n", "\r", "\t"].includes(c),
  );
export function validProductId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    ([...products, ...officialProducts, ...clientCakeProducts].some((p) => p.id === id) ||
      (id.startsWith("product-") && isUUID(id.slice(8))))
  );
}
export function validateProduct(value: unknown): Product {
  if (
    !isRecord(value) ||
    !validProductId(value.id) ||
    !text(value.name, 100, true) ||
    !["Classics", "Celebrations", "Weddings", ...CATALOGUE_CATEGORIES, ...CAKE_CATEGORIES].includes(
      String(value.category),
    ) ||
    !text(value.description, 3000, true) ||
    !text(value.flavour, 100, true) ||
    typeof value.price !== "number" ||
    !Number.isSafeInteger(Math.round(value.price * 100)) ||
    value.price < 0 ||
    Math.abs(value.price * 100 - Math.round(value.price * 100)) > 0.000001 ||
    !text(value.image, 2000, true) ||
    typeof value.demo !== 'boolean' ||
    typeof value.archived !== "boolean" ||
    typeof value.featured !== "boolean" ||
    typeof value.designerEligible !== "boolean"
  )
    throw new Error(
      "Invalid product. Complete the fields, use a non-negative price with at most two decimals, and a valid image URL.",
    );
  const url = new URL(value.image, 'http://local.invalid');
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("Product images must use an HTTP or HTTPS URL.");
  const clean = structuredClone(value) as unknown as Product;
  if (clean.kind !== undefined && !['cake', 'catalogue', 'official-cake'].includes(clean.kind)) throw new Error('Invalid product type.');
  if (clean.kind === 'official-cake') {
    if (clean.demo || clean.pricingMode !== 'official-range' || !clean.slug || !Array.isArray(clean.gallery) || clean.gallery.some(i => typeof i !== 'string' || !i) || !Array.isArray(clean.sourceImages) || !clean.sourceImages.length || typeof clean.visible !== 'boolean' || !Number.isFinite(clean.featuredOrder)) throw new Error('Official cakes require range pricing, visibility, source references and a valid gallery.');
    if (!(CAKE_CATEGORIES as readonly string[]).includes(clean.category) || clean.categories?.some(c => !(CAKE_CATEGORIES as readonly string[]).includes(c)) || !Number.isInteger(clean.featuredOrder) || clean.featuredOrder! < 0 || clean.featuredOrder! > 10000) throw new Error('Choose valid cake categories and a whole-number featured order.');
  }
  if (clean.availability !== undefined && !['Enquiry', 'Unavailable'].includes(clean.availability)) throw new Error('Invalid availability.');
  if (clean.kind === 'catalogue') {
    // Early local catalogue records already name quantities in pieces; fill metadata without changing owner prices.
    clean.quantityUnit ??= 'pieces';
    if (clean.designerEligible !== false || clean.quantityUnit !== 'pieces' || !Array.isArray(clean.quantityOptions) || !clean.quantityOptions.length || clean.quantityOptions.length > 20) throw new Error('Catalogue products require piece-based quantity options and cannot use the Cake Designer.');
    const quantities = new Set<number>();
    for (const option of clean.quantityOptions) {
      if (!option || !Number.isSafeInteger(option.pieces) || option.pieces < 1 || option.pieces > 10000 || !Number.isSafeInteger(option.priceCents) || option.priceCents < 0 || quantities.has(option.pieces)) throw new Error('Use unique positive quantities and non-negative prices.');
      quantities.add(option.pieces);
    }
    if (Math.round(clean.price * 100) !== clean.quantityOptions[0].priceCents) throw new Error('Catalogue starting price must match the first quantity option.');
  }
  return clean;
}
export function validateSettings(value: unknown): BakerySettings {
  if (
    !isRecord(value) ||
    !text(value.businessName, 100, true) ||
    !text(value.description, 3000) ||
    !text(value.email, 254) ||
    (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) ||
    !text(value.phone, 50) ||
    !text(value.address, 500) ||
    !text(value.collectionInstructions, 2000) ||
    !text(value.disclaimer, 1000, true) ||
    !Number.isInteger(value.minimumLeadDays) ||
    (value.minimumLeadDays as number) < 0 ||
    (value.minimumLeadDays as number) > 365 ||
    !Array.isArray(value.deliveryAreas) ||
    value.deliveryAreas.length > 100 ||
    value.deliveryAreas.some((a) => !text(a, 160, true) || a.length < 2) ||
    new Set(value.deliveryAreas.map((a) => String(a).toLowerCase())).size !==
      value.deliveryAreas.length ||
    value.currency !== "ZAR" ||
    !["en-ZA", "en-GB"].includes(String(value.locale))
  )
    throw new Error(
      "Invalid settings. Check contact fields, delivery areas and lead time (0–365 days).",
    );
  return structuredClone(value) as unknown as BakerySettings;
}
export function validateWorkspace(value: unknown): AdminWorkspace {
  if (
    !isRecord(value) ||
    value.id !== "workspace" ||
    value.schemaVersion !== 1 ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 0 ||
    !Array.isArray(value.products)
  )
    throw new Error(
      "Stored administration data is invalid. It was not replaced.",
    );
  const catalog = value.products.map(validateProduct);
  if (new Set(catalog.map((p) => p.id)).size !== catalog.length)
    throw new Error("Duplicate product identifiers.");
  const rules = value.rules as CakePricingRules;
  validatePricingRules(rules);
  for (const p of catalog) {
    if (p.kind === 'catalogue' || p.kind === 'official-cake') continue;
    const pkg = rules.productPackages[p.id];
    if (
      !pkg ||
      pkg.name !== p.name ||
      pkg.startingPriceCents !== Math.round(p.price * 100)
    )
      throw new Error("Catalogue and product pricing must agree.");
  }
  return deepFreeze({
    id: "workspace",
    schemaVersion: 1,
    revision: value.revision as number,
    ...(value.catalogueVersion === 1 ? { catalogueVersion: 1 as const } : {}),
    ...(value.cakeCatalogueVersion === 1 ? { cakeCatalogueVersion: 1 as const } : {}),
    ...(value.officialPricingHistory !== undefined ? { officialPricingHistory: validateOfficialHistory(value.officialPricingHistory) } : {}),
    products: catalog,
    rules: structuredClone(rules),
    settings: validateSettings(value.settings),
  });
}
export function mergeOfficialCatalogue(current: AdminWorkspace): AdminWorkspace {
  if (current.catalogueVersion === 1) return current;
  const copy = structuredClone(current);
  const ids = new Set(copy.products.map(p => p.id));
  copy.products.push(...officialProducts.filter(p => !ids.has(p.id)).map(p => structuredClone(p)));
  copy.catalogueVersion = 1;
  copy.revision += 1;
  return copy;
}
export function validateOfficialHistory(value: unknown): import('../types/officialCake').OfficialCakePricing[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Invalid official pricing history.');
  for (const entry of value) validateOfficialPricing(entry);
  return structuredClone(value);
}
export function mergeClientCakes(current: AdminWorkspace): AdminWorkspace {
  if (current.cakeCatalogueVersion === 1) return current;
  const copy = structuredClone(current);
  const ids = new Set(copy.products.map(p => p.id));
  copy.products.push(...clientCakeProducts.filter(p => !ids.has(p.id)).map(p => ({ ...structuredClone(p), archived: p.archived ?? false, featured: p.featured ?? false, designerEligible: p.designerEligible ?? true })));
  copy.rules.officialCatalogue ??= defaultOfficialPricing();
  copy.rules.officialCatalogue.products = { ...copy.rules.officialCatalogue.products, ...Object.fromEntries(copy.products.filter(p => p.kind === 'official-cake').map(p => [p.id, { name: p.name, image: p.image, category: p.category }])) };
  copy.officialPricingHistory ??= [];
  copy.cakeCatalogueVersion = 1;
  copy.revision += 1;
  return copy;
}
export function publishedRules(
  rules: CakePricingRules,
  revision: number,
  now = new Date(),
): CakePricingRules {
  const copy = structuredClone(rules);
  copy.version = `local-${now.toISOString()}-r${revision}`;
  copy.effectiveDate = southAfricanDate(now);
  validatePricingRules(copy);
  return copy;
}
export function validateAudit(value: unknown): QuotationAudit {
  if (
    !isRecord(value) ||
    !isUUID(value.id) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.notes) ||
    !Array.isArray(value.revisions)
  )
    throw new Error("Invalid quotation audit data.");
  const validAt = (at: unknown) =>
    typeof at === "string" &&
    Number.isFinite(Date.parse(at)) &&
    new Date(at).toISOString() === at;
  for (const note of value.notes)
    if (
      !isRecord(note) ||
      !isUUID(note.id) ||
      !text(note.text, 3000, true) ||
      !validAt(note.at)
    )
      throw new Error("Invalid internal note.");
  for (const r of value.revisions) {
    if (
      !isRecord(r) ||
      !isUUID(r.id) ||
      !text(r.reason, 2000, true) ||
      !Number.isSafeInteger(r.revisedAmountCents) ||
      (r.revisedAmountCents as number) < 0 ||
      !validAt(r.at) ||
      !text(r.originalPricingVersion, 200, true) ||
      [r.originalEstimateCents, r.originalIndicativeCents].some(
        (n) => n !== null && (!Number.isSafeInteger(n) || (n as number) < 0),
      )
    )
      throw new Error("Invalid quotation revision.");
    validateConfiguration(r.originalConfiguration);
  }
  const ids = [...value.notes, ...value.revisions].map((item) => item.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Duplicate audit entry.");
  return deepFreeze(structuredClone(value) as unknown as QuotationAudit);
}
function checkAuditSnapshot(audit: QuotationAudit, quote: QuotationRecord) {
  if (audit.id !== quote.id)
    throw new Error("Audit identifier does not match the quotation.");
  for (const r of audit.revisions)
    if (
      r.originalPricingVersion !== quote.snapshot.pricingRules.version ||
      stableJSON(r.originalConfiguration) !==
        stableJSON(quote.snapshot.configuration) ||
      r.originalEstimateCents !== quote.snapshot.estimate.estimatedTotalCents ||
      r.originalIndicativeCents !== quote.snapshot.estimate.indicativeTotalCents
    )
      throw new Error(
        "Revision history does not match the original quotation.",
      );
  for (const entries of [audit.notes, audit.revisions]) {
    let previous = quote.createdAt;
    for (const entry of entries) {
      if (entry.at < previous)
        throw new Error(
          "Audit timestamps must follow the quotation and previous entries.",
        );
      previous = entry.at;
    }
  }
}
export class IndexedDbAdminRepository implements AdministrationRepository {
  constructor(
    private factory: () => IDBFactory | undefined = () => globalThis.indexedDB,
    private name = LOCAL_DATABASE,
    private now: () => Date = () => new Date(),
  ) {}
  async load(): Promise<AdminWorkspace> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(
      db,
      ["workspace"],
      "readwrite",
      (tx, finish, fail) => {
        const store = tx.objectStore("workspace");
        const request = store.get("workspace");
        request.onsuccess = () => {
          try {
            const value = validateWorkspace(request.result ? mergeClientCakes(mergeOfficialCatalogue(validateWorkspace(request.result))) : defaultWorkspace());
            if (!request.result) store.add(value);
            else if (request.result.catalogueVersion !== 1 || request.result.cakeCatalogueVersion !== 1) store.put(value);
            finish(value);
          } catch (e) {
            fail(e);
          }
        };
      },
    );
  }
  async save(
    value: AdminWorkspace,
    expectedRevision: number,
  ): Promise<AdminWorkspace> {
    const clean = validateWorkspace(value);
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(
      db,
      ["workspace"],
      "readwrite",
      (tx, finish, fail) => {
        const store = tx.objectStore("workspace");
        const request = store.get("workspace");
        request.onsuccess = () => {
          try {
            const current = validateWorkspace(
              request.result ?? defaultWorkspace(),
            );
            if (current.revision !== expectedRevision)
              throw new Error(
                "Another tab changed the configuration. Reload this page before saving.",
              );
            if (clean.revision !== expectedRevision + 1)
              throw new Error("Invalid workspace revision.");
            store.put(clean);
            finish(clean);
          } catch (e) {
            fail(e);
          }
        };
      },
    );
  }
  async audit(id: string): Promise<QuotationAudit> {
    if (!isUUID(id)) throw new Error("Invalid quotation identifier.");
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(
      db,
      ["quotationAudit", "quotations"],
      "readonly",
      (tx, finish, fail) => {
        const req = tx.objectStore("quotationAudit").get(id);
        req.onsuccess = () => {
          try {
            const audit = validateAudit(
              req.result ?? {
                id,
                schemaVersion: 1,
                notes: [],
                revisions: [],
              },
            );
            if (audit.id !== id)
              throw new Error("Invalid stored audit identifier.");
            if (req.result === undefined) {
              finish(audit);
              return;
            }
            const quote = tx.objectStore("quotations").get(id);
            quote.onsuccess = () => {
              try {
                checkAuditSnapshot(
                  audit,
                  validateQuotationRecord(quote.result),
                );
                finish(audit);
              } catch (e) {
                fail(e);
              }
            };
          } catch (e) {
            fail(e);
          }
        };
      },
    );
  }
  async appendAudit(
    id: string,
    entry: { note: string } | { reason: string; amountCents: number },
  ): Promise<QuotationAudit> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(
      db,
      ["quotations", "quotationAudit"],
      "readwrite",
      (tx, finish, fail) => {
        const q = tx.objectStore("quotations").get(id);
        q.onsuccess = () => {
          try {
            const quote = validateQuotationRecord(q.result);
            const store = tx.objectStore("quotationAudit");
            const req = store.get(id);
            req.onsuccess = () => {
              try {
                const audit = structuredClone(
                  validateAudit(
                    req.result ?? {
                      id,
                      schemaVersion: 1,
                      notes: [],
                      revisions: [],
                    },
                  ),
                );
                const at = new Date(
                  Math.max(
                    this.now().getTime(),
                    Date.parse(quote.updatedAt),
                    ...audit.notes.map((n) => Date.parse(n.at)),
                    ...audit.revisions.map((r) => Date.parse(r.at)),
                  ),
                ).toISOString();
                if ("note" in entry)
                  audit.notes.push({
                    id: crypto.randomUUID(),
                    text: entry.note.trim(),
                    at,
                  });
                else
                  audit.revisions.push({
                    id: crypto.randomUUID(),
                    reason: entry.reason.trim(),
                    revisedAmountCents: entry.amountCents,
                    at,
                    originalEstimateCents:
                      quote.snapshot.estimate.estimatedTotalCents,
                    originalIndicativeCents:
                      quote.snapshot.estimate.indicativeTotalCents,
                    originalPricingVersion: quote.snapshot.pricingRules.version,
                    originalConfiguration: structuredClone(
                      quote.snapshot.configuration,
                    ),
                  });
                const clean = validateAudit(audit);
                checkAuditSnapshot(clean, quote);
                store.put(clean);
                finish(clean);
              } catch (e) {
                fail(e);
              }
            };
          } catch (e) {
            fail(e);
          }
        };
      },
    );
  }
  async reset(confirmation: string): Promise<AdminWorkspace> {
    if (confirmation !== "RESET LOCAL DEMO")
      throw new Error("Type RESET LOCAL DEMO to confirm deletion.");
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(
      db,
      ["quotations", "workspace", "quotationAudit", "productEnquiries", "officialConfirmations"],
      "readwrite",
      (tx, finish) => {
        for (const store of ["quotations", "workspace", "quotationAudit", "productEnquiries", "officialConfirmations"])
          tx.objectStore(store).clear();
        const clean = validateWorkspace(defaultWorkspace());
        tx.objectStore("workspace").put(clean);
        finish(clean);
      },
    );
  }
}
export const adminRepository = new IndexedDbAdminRepository();
