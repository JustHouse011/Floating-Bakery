import type { OfficialCakePricing, OfficialConfirmation } from '../types/officialCake';
import type { QuotationRecord } from '../types/quotation';
import { validateOfficialPricing } from './officialCakePricing';
import { validateWorkspace } from './adminRepository';
import { validateQuotationRecord } from './quotationRecord';
import { deepFreeze, isRecord, isUUID } from '../utils/quotation';
import { openLocalDatabase, localTransaction, LOCAL_DATABASE } from './localDatabase';

export function prepareOfficialConfirmation(record: QuotationRecord, approvedPricing: OfficialCakePricing, baseCents: number, extraCents: number, reason: string, overrideAuthorised: boolean, additionsApproved: boolean, now = new Date()): OfficialConfirmation {
  const quote = validateQuotationRecord(record); validateOfficialPricing(approvedPricing);
  if (!quote.snapshot.official) throw new Error('This request does not use official catalogue range pricing.');
  if (quote.status === 'Approved' || quote.status === 'Declined') throw new Error('This completed request cannot be revised.');
  if (!Number.isSafeInteger(baseCents) || baseCents < 0 || !Number.isSafeInteger(extraCents) || extraCents < 0 || typeof reason !== 'string' || !reason.trim() || reason.length > 2000 || typeof overrideAuthorised !== 'boolean' || typeof additionsApproved !== 'boolean') throw new Error('Enter valid amounts and a documented confirmation reason.');
  if ((baseCents < approvedPricing.minimumBaseCents || baseCents > approvedPricing.maximumBaseCents) && !overrideAuthorised) throw new Error('Confirmed base must be within the approved range unless an explicit reasoned override is authorised.');
  if (extraCents > 0 && !additionsApproved) throw new Error('Additional charges require explicit approval and a documented reason.');
  const flavour = quote.snapshot.official.flavourSurchargeCents;
  const total = baseCents + flavour + extraCents;
  if (!Number.isSafeInteger(total)) throw new Error('Confirmed amount is too large.');
  return deepFreeze({ id: crypto.randomUUID(), quotationId: quote.id, at: new Date(Math.max(now.getTime(), Date.parse(quote.updatedAt))).toISOString(), originalMinimumCents: quote.snapshot.official.minimumEstimateCents, originalMaximumCents: quote.snapshot.official.maximumEstimateCents, confirmedBaseCents: baseCents, flavourSurchargeCents: flavour, approvedAdditionalCents: extraCents, confirmedTotalCents: total, reason: reason.trim(), overrideAuthorised, approvedPricing: structuredClone(approvedPricing), pricingVersion: approvedPricing.version, flavourPricingVersion: quote.snapshot.official.pricingVersion, status: 'Quoted' });
}
export function validateOfficialConfirmation(value: unknown): OfficialConfirmation {
  if (!isRecord(value) || !isUUID(value.id) || !isUUID(value.quotationId) || typeof value.at !== 'string' || !Number.isFinite(Date.parse(value.at)) || typeof value.reason !== 'string' || !value.reason.trim() || typeof value.overrideAuthorised !== 'boolean' || value.status !== 'Quoted' || typeof value.flavourPricingVersion !== 'string') throw new Error('Invalid stored cake confirmation.');
  validateOfficialPricing(value.approvedPricing);
  for (const key of ['originalMinimumCents', 'originalMaximumCents', 'confirmedBaseCents', 'flavourSurchargeCents', 'approvedAdditionalCents', 'confirmedTotalCents']) if (!Number.isSafeInteger(value[key]) || (value[key] as number) < 0) throw new Error('Invalid confirmation amount.');
  if (value.confirmedTotalCents !== (value.confirmedBaseCents as number) + (value.flavourSurchargeCents as number) + (value.approvedAdditionalCents as number) || value.pricingVersion !== value.approvedPricing.version || (!value.overrideAuthorised && ((value.confirmedBaseCents as number) < value.approvedPricing.minimumBaseCents || (value.confirmedBaseCents as number) > value.approvedPricing.maximumBaseCents))) throw new Error('Stored confirmation does not agree with approved pricing.');
  return deepFreeze(structuredClone(value) as unknown as OfficialConfirmation);
}
export class OfficialConfirmationRepository {
  constructor(private factory: () => IDBFactory | undefined = () => globalThis.indexedDB, private name = LOCAL_DATABASE) {}
  async list(id: string): Promise<OfficialConfirmation[]> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(db, ['officialConfirmations'], 'readonly', (tx, finish, fail) => { const r = tx.objectStore('officialConfirmations').getAll(); r.onsuccess = () => { try { finish(r.result.map(validateOfficialConfirmation).filter(r => r.quotationId === id).sort((a,b) => a.at.localeCompare(b.at))); } catch(e) { fail(e); } }; });
  }
  async confirm(id: string, baseCents: number, extraCents: number, reason: string, overrideAuthorised: boolean, additionsApproved: boolean, expectedVersion: string): Promise<OfficialConfirmation> {
    const db = await openLocalDatabase(this.factory(), this.name);
    return localTransaction(db, ['quotations', 'workspace', 'officialConfirmations'], 'readwrite', (tx, finish, fail) => {
      const q = tx.objectStore('quotations').get(id); q.onsuccess = () => {
        const w = tx.objectStore('workspace').get('workspace'); w.onsuccess = () => { try {
          const pricing = validateWorkspace(w.result).rules.officialCatalogue;
          if (!pricing || pricing.version !== expectedVersion) throw new Error('Official pricing changed. Reload and review before confirming.');
          const record = validateQuotationRecord(q.result);
          const confirmation = prepareOfficialConfirmation(record, pricing, baseCents, extraCents, reason, overrideAuthorised, additionsApproved);
          tx.objectStore('officialConfirmations').add(confirmation);
          let history = structuredClone(record.statusHistory);
          if (record.status === 'New' || record.status === 'Awaiting Customer') history = [...history, { from: record.status, to: 'Under Review', at: confirmation.at }];
          const from = record.status === 'New' || record.status === 'Awaiting Customer' ? 'Under Review' : record.status;
          if (from !== 'Quoted') history.push({ from, to: 'Quoted', at: confirmation.at });
          const changed = validateQuotationRecord({ ...structuredClone(record), status: 'Quoted', updatedAt: record.status === 'Quoted' ? record.updatedAt : confirmation.at, statusHistory: history });
          tx.objectStore('quotations').put(changed); finish(confirmation);
        } catch(e) { fail(e); } };
      };
    });
  }
}
export const officialConfirmationRepository = new OfficialConfirmationRepository();
