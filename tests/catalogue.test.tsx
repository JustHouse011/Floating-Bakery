import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { officialProducts } from '../src/data/officialCatalogue';
import { cataloguePrice, filterCatalogue } from '../src/services/cataloguePricing';
import { defaultWorkspace, mergeOfficialCatalogue, validateWorkspace, validateProduct, IndexedDbAdminRepository } from '../src/services/adminRepository';
import { makeProductEnquiry, ProductEnquiryRepository, validateProductEnquiry } from '../src/services/catalogueEnquiries';
import { quotationRequestPolicy } from '../src/data/quotation';
import CatalogueDetail from '../src/pages/CatalogueDetail';
import { readFileSync } from 'node:fs';
import type { Product } from '../src/types';

const find = (id: string): Product => structuredClone(officialProducts.find(p => p.id === id)!);
const customer = { fullName: 'Test Customer', email: 'test@example.com', contactNumber: '0821234567', preferredContactMethod: 'Email' as const };
const event = { eventType: 'Birthday' as const, eventDate: '2026-12-20', fulfilment: 'Collection' as const, deliveryArea: '', guests: '1', specialInstructions: '' };
const now = new Date('2026-10-13T10:00:00Z');
const enquiry = () => makeProductEnquiry(find('plain-scones'), 10, customer, event, quotationRequestPolicy, true, now);

test('all twelve official products have unique stable ids, exact classification and no designer access', () => {
  assert.equal(officialProducts.length, 12); assert.equal(new Set(officialProducts.map(p => p.id)).size, 12);
  officialProducts.forEach(p => { assert.equal(p.demo, false); assert.equal(p.designerEligible, false); assert.equal(p.kind, 'catalogue'); assert.equal(p.availability, 'Enquiry'); validateProduct(p); });
});
test('nine Sweet Treats prices are exact fixed dozen amounts', () => {
  const expected = [310, 240, 420, 300, 320, 380, 240, 220, 260];
  officialProducts.slice(0, 9).forEach((p, i) => { assert.equal(cataloguePrice(p, 12), expected[i] * 100); assert.throws(() => cataloguePrice(p, 24)); });
});
for (const [id, prices] of [['plain-scones', [300, 550, 980]], ['raisin-scones', [380, 650, 1100]], ['chocolate-chip-scones', [400, 700, 1200]]] as const) {
  test(`${id} supports only exact 5/10/20-piece menu prices`, () => { [5, 10, 20].forEach((q, i) => assert.equal(cataloguePrice(find(id), q), prices[i] * 100)); [0, 1, 6, 12, 15, 30, 5.5, NaN].forEach(q => assert.throws(() => cataloguePrice(find(id), q))); });
}
test('archived and unavailable products cannot be priced for an enquiry', () => { const p = find('plain-scones'); p.archived = true; assert.throws(() => cataloguePrice(p, 5)); p.archived = false; p.availability = 'Unavailable'; assert.throws(() => cataloguePrice(p, 5)); });
test('search and category filters combine and exclude archived products', () => { assert.equal(filterCatalogue(officialProducts, ' chocolate ', 'Brownies').length, 2); assert.equal(filterCatalogue(officialProducts, '', 'Scones').length, 3); const p = find('plain-scones'); p.archived = true; assert.equal(filterCatalogue([p], '', 'All products').length, 0); assert.equal(filterCatalogue(defaultWorkspace().products, '', 'Custom Cakes').length, 49); });
test('raisin scones transparently reuse the actual supplied plain photograph', () => { assert.equal(find('raisin-scones').image, find('plain-scones').image); assert.match(find('raisin-scones').imageNote!, /reused/); });
test('every official image is a local decodable WebP asset', () => { officialProducts.forEach(p => { const bytes = readFileSync(`public${p.image}`); assert.equal(bytes.subarray(0,4).toString(), 'RIFF'); assert.equal(bytes.subarray(8,12).toString(), 'WEBP'); }); });
test('catalogue validator rejects duplicate quantities, fractional cents and designer eligibility', () => { const p = find('plain-scones'); p.quantityOptions!.push(p.quantityOptions![0]); assert.throws(() => validateProduct(p)); const other = find('plain-scones'); other.quantityOptions![0].priceCents = 30000.1; assert.throws(() => validateProduct(other)); const eligible = find('plain-scones'); eligible.designerEligible = true; assert.throws(() => validateProduct(eligible)); });
test('catalogue quantities do not create synthetic cake pricing packages', () => { const w = defaultWorkspace(); assert.equal(Object.keys(w.rules.productPackages).length, 6); assert.equal(w.products.length, 61); validateWorkspace(w); });
test('one-time seed merge preserves legitimate edits, archive flags, contacts and pricing', () => { const old = defaultWorkspace(); delete old.catalogueVersion; old.products = old.products.slice(0, 6); old.products[0].description = 'Owner edit'; old.settings.email = 'owner@example.com'; const edited = find('plain-scones'); edited.archived = true; edited.description = 'Owner scone edit'; old.products.push(edited); const rules = JSON.stringify(old.rules); const merged = mergeOfficialCatalogue(old); assert.equal(merged.products.length, 18); assert.equal(merged.products[0].description, 'Owner edit'); assert.equal(merged.products.find(p => p.id === edited.id)!.archived, true); assert.equal(merged.products.find(p => p.id === edited.id)!.description, edited.description); assert.equal(merged.settings.email, old.settings.email); assert.equal(JSON.stringify(merged.rules), rules); assert.equal(mergeOfficialCatalogue(merged), merged); });
test('scones require explicit quantity before Request Quote is enabled', () => { const html = renderToStaticMarkup(<MemoryRouter><CatalogueDetail product={find('plain-scones')}/></MemoryRouter>); assert.match(html, /Choose a quantity/); assert.match(html, /disabled=""/); assert.doesNotMatch(html, /cake-designer/); });
test('dozen detail displays its exact price and never a designer link', () => { const html = renderToStaticMarkup(<MemoryRouter><CatalogueDetail product={find('fudge-brownies')}/></MemoryRouter>); assert.match(html, /310/); assert.match(html, /12 pieces/); assert.match(html, /product-enquiry/); assert.doesNotMatch(html, /cake-designer/); });
test('product enquiry snapshot is frozen, normalised and independent of later changes', () => { const p = find('plain-scones'); const r = makeProductEnquiry(p, 10, customer, event, quotationRequestPolicy, true, now); p.quantityOptions![1].priceCents = 90000; p.description = 'Changed'; assert.equal(r.snapshot.priceCents, 55000); assert.equal(r.customer.contactNumber, '+27821234567'); assert.equal(r.snapshot.deliveryFeeCents, null); assert.ok(Object.isFrozen(r.snapshot.product.quantityOptions)); assert.equal(r.kind, 'catalogue'); assert.ok(!('configuration' in r.snapshot)); validateProductEnquiry(r); });
test('unsupported quantities, unavailable products and missing consent cannot create snapshots', () => { assert.throws(() => makeProductEnquiry(find('plain-scones'), 12, customer, event, quotationRequestPolicy, true, now)); assert.throws(() => makeProductEnquiry(find('plain-scones'), 5, customer, event, quotationRequestPolicy, false, now)); });
test('delivery requires an area without inventing a delivery fee', () => { assert.throws(() => makeProductEnquiry(find('plain-scones'), 5, customer, { ...event, fulfilment: 'Delivery' }, quotationRequestPolicy, true, now)); const r = makeProductEnquiry(find('plain-scones'), 5, customer, { ...event, fulfilment: 'Delivery', deliveryArea: 'Centurion' }, quotationRequestPolicy, true, now); assert.equal(r.snapshot.priceCents, 30000); assert.equal(r.snapshot.deliveryFeeCents, null); });
test('tampered pricing snapshot is rejected', () => { const original = enquiry(); const r = { ...original, snapshot: { ...original.snapshot, priceCents: 1 } }; assert.throws(() => validateProductEnquiry(r)); });
test('IndexedDB retains original product snapshot after admin prices and descriptions change', async () => { const factory = new IDBFactory(); const name = `catalogue-${crypto.randomUUID()}`; const repo = new ProductEnquiryRepository(() => factory, name); const admin = new IndexedDbAdminRepository(() => factory, name); const r = await repo.create(enquiry()); const w = structuredClone(await admin.load()); const p = w.products.find(p => p.id === 'plain-scones')!; p.description = 'Updated after request'; p.quantityOptions![1].priceCents = 99900; w.revision += 1; await admin.save(w, w.revision - 1); assert.equal((await repo.get(r.id))!.snapshot.priceCents, 55000); assert.notEqual((await repo.get(r.id))!.snapshot.product.description, p.description); assert.equal((await repo.list()).length, 1); assert.equal((await admin.load()).products.find(item => item.id === p.id)!.quantityOptions![1].priceCents, 99900); });
test('unavailable storage never pretends that product enquiry was saved', async () => { await assert.rejects(new ProductEnquiryRepository(() => undefined).create(enquiry()), /storage is unavailable/); });
