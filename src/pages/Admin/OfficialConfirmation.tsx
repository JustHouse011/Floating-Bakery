import { useEffect, useState, type FormEvent } from 'react';
import type { QuotationRecord } from '../../types/quotation';
import type { OfficialConfirmation } from '../../types/officialCake';
import { useWorkspace } from '../../store/adminStore';
import { officialConfirmationRepository } from '../../services/officialConfirmations';
import { moneyToCents } from '../../services/adminMoney';
import { formatZARCents } from '../../utils/currency';
import { formatPriceRange } from '../../services/officialCakePricing';

export default function OfficialConfirmationPanel({ record, refreshed }: { record: QuotationRecord; refreshed?: () => Promise<void> }) {
  const pricing = useWorkspace().rules.officialCatalogue;
  const [history, setHistory] = useState<OfficialConfirmation[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { let live = true; officialConfirmationRepository.list(record.id).then(h => { if(live) setHistory(h); }).catch(e => { if(live) setError(e instanceof Error ? e.message : 'Confirmation history unavailable.'); }); return () => { live = false; }; }, [record.id]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); setError(''); setBusy(true);
    try { await officialConfirmationRepository.confirm(record.id, moneyToCents(String(data.get('base'))), moneyToCents(String(data.get('extra'))), String(data.get('reason')), data.has('override'), data.has('additionsApproved'), pricing!.version); setHistory(await officialConfirmationRepository.list(record.id)); await refreshed?.(); }
    catch(e) { setError(e instanceof Error ? e.message : 'Confirmation could not be saved.'); } finally { setBusy(false); }
  }
  if (!record.snapshot.official || !pricing) return null;
  return <section className="admin-card"><h2>Confirm official cake price</h2><p>Original estimate: {formatPriceRange(record.snapshot.official.minimumEstimateCents, record.snapshot.official.maximumEstimateCents)}. Current approved base: {formatPriceRange(pricing.minimumBaseCents, pricing.maximumBaseCents)}.</p><p>The request's frozen flavour surcharge ({formatZARCents(record.snapshot.official.flavourSurchargeCents)}) is applied once. Bakery confirmation is not customer acceptance; this request moves to Quoted.</p>{error && <p role="alert" className="admin-error">{error}</p>}<form className="no-print" onSubmit={e => void submit(e)}><fieldset disabled={busy || ['Approved', 'Declined'].includes(record.status)}><label className="admin-field">Confirmed base price (ZAR)<input name="base" type="number" min="0" step="0.01" required/></label><label className="admin-field">Explicitly approved additional charges (ZAR)<input name="extra" type="number" min="0" step="0.01" required defaultValue="0"/></label><label className="admin-field">Confirmation or adjustment reason<textarea name="reason" maxLength={2000} required/></label><label className="admin-check"><input name="additionsApproved" type="checkbox"/>I explicitly approve the listed additional charges</label><label className="admin-check"><input name="override" type="checkbox"/>I explicitly authorise a documented base-price override outside the approved range</label><button className="admin-button">{busy ? 'Saving…' : 'Confirm price locally'}</button></fieldset></form><h3>Confirmation revision history</h3>{!history.length && <p>Awaiting bakery confirmation.</p>}{history.map(h => <article key={h.id}><strong>Manually quoted fixed amount: {formatZARCents(h.confirmedTotalCents)}</strong><p>Base {formatZARCents(h.confirmedBaseCents)} + flavour {formatZARCents(h.flavourSurchargeCents)} + approved additions {formatZARCents(h.approvedAdditionalCents)}</p><p>{h.reason}{h.overrideAuthorised ? ' · Explicit override authorised' : ''}</p><small>{new Date(h.at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} · Approved base pricing {h.pricingVersion} · Flavour pricing {h.flavourPricingVersion} · Quoted, not accepted</small></article>)}</section>;
}
