import type { Product } from '../types';
import type { ProductEnquiryRecord } from '../types/catalogue';
import type { CustomerDetails, EventFormValues, QuotationRequestPolicy } from '../types/quotation';
import { cataloguePrice } from './cataloguePricing';
import { validateProduct } from './adminRepository';
import { normalizeCustomer, normalizeEvent, validateCustomer, validateEvent, validateRequestPolicy } from './quotationValidation';
import { deepFreeze, isRecord, isUUID } from '../utils/quotation';
import { openLocalDatabase, localTransaction, LOCAL_DATABASE } from './localDatabase';

export const CATALOGUE_DISCLAIMER = 'Catalogue product price. Availability and delivery cost require bakery confirmation. This enquiry is saved in this browser only; it has not been sent and is not a confirmed purchase.';
export function makeProductEnquiry(product: Product, pieces: number, customer: CustomerDetails, event: EventFormValues, policy: QuotationRequestPolicy, consent: boolean, now = new Date()): ProductEnquiryRecord {
  validateRequestPolicy(policy);
  const errors = { ...validateCustomer(customer), ...validateEvent(event, policy, now) };
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  if (!consent) throw new Error('Confirm that this request is saved locally and has not been sent.');
  const clean = validateProduct(product);
  const priceCents = cataloguePrice(clean, pieces);
  const id = crypto.randomUUID();
  return deepFreeze({ kind: 'catalogue', version: 1, id, reference: `FB-P-${id}`, createdAt: now.toISOString(), customer: normalizeCustomer(customer), event: normalizeEvent(event), snapshot: { product: structuredClone(clean), pieces, priceCents, currency: 'ZAR', pricingKind: 'fixed-quantity', deliveryFeeCents: null, disclaimer: CATALOGUE_DISCLAIMER, requestPolicy: structuredClone(policy) }, localOnly: true });
}
export function validateProductEnquiry(value: unknown): ProductEnquiryRecord {
  if (!isRecord(value) || value.kind !== 'catalogue' || value.version !== 1 || !isUUID(value.id) || value.reference !== `FB-P-${value.id}` || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || value.localOnly !== true || !isRecord(value.snapshot) || !isRecord(value.customer) || !isRecord(value.event)) throw new Error('Invalid stored product enquiry.');
  const record = value as unknown as ProductEnquiryRecord;
  const product = validateProduct(record.snapshot.product);
  validateRequestPolicy(record.snapshot.requestPolicy);
  if (record.snapshot.currency !== 'ZAR' || record.snapshot.pricingKind !== 'fixed-quantity' || record.snapshot.deliveryFeeCents !== null || typeof record.snapshot.disclaimer !== 'string' || record.snapshot.priceCents !== cataloguePrice(product, record.snapshot.pieces) || Object.keys(validateCustomer(record.customer)).length || Object.keys(validateEvent({ ...record.event, guests: String(record.event.guests) }, record.snapshot.requestPolicy, new Date(record.createdAt))).length) throw new Error('Invalid stored product snapshot.');
  return deepFreeze(structuredClone(record));
}
export class ProductEnquiryRepository {
  constructor(private factory: () => IDBFactory | undefined = () => globalThis.indexedDB, private name = LOCAL_DATABASE) {}
  async create(record: ProductEnquiryRecord): Promise<ProductEnquiryRecord> {
    const clean = validateProductEnquiry(record);
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(db, ['productEnquiries'], 'readwrite', (tx, finish) => { tx.objectStore('productEnquiries').add(clean); finish(clean); });
  }
  async list(): Promise<ProductEnquiryRecord[]> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(db, ['productEnquiries'], 'readonly', (tx, finish, fail) => { const r = tx.objectStore('productEnquiries').getAll(); r.onsuccess = () => { try { finish(r.result.map(validateProductEnquiry).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); } catch (e) { fail(e); } }; });
  }
  async get(id: string): Promise<ProductEnquiryRecord | undefined> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(db, ['productEnquiries'], 'readonly', (tx, finish, fail) => { const r = tx.objectStore('productEnquiries').get(id); r.onsuccess = () => { try { finish(r.result ? validateProductEnquiry(r.result) : undefined); } catch(e) { fail(e); } }; });
  }
}
export const productEnquiryRepository = new ProductEnquiryRepository();
