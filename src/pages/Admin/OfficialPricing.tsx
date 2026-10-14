import { useState, type FormEvent } from 'react';
import { useWorkspace, publishOfficialPricing } from '../../store/adminStore';
import { OFFICIAL_FLAVOURS } from '../../types/officialCake';
import { validateOfficialPricing, officialRange, formatPriceRange } from '../../services/officialCakePricing';
import { moneyToCents } from '../../services/adminMoney';
import { stableJSON } from '../../utils/quotation';

export default function OfficialPricing() {
  const workspace = useWorkspace(); const pricing = workspace.rules.officialCatalogue;
  const [preview, setPreview] = useState<typeof pricing>(); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  if (!pricing) return null;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); const data = new FormData(e.currentTarget);
    try {
      const draft = structuredClone(pricing!); for (const f of OFFICIAL_FLAVOURS) draft.flavourSurchargesCents[f] = f === 'Vanilla' ? 0 : moneyToCents(String(data.get(f)));
      validateOfficialPricing(draft);
      if (!preview || stableJSON(preview.flavourSurchargesCents) !== stableJSON(draft.flavourSurchargesCents)) { setPreview(draft); setNotice('Preview only; active pricing has not changed.'); return; }
      setBusy(true); await publishOfficialPricing(draft); setPreview(undefined); setNotice('Official pricing published locally. Historical snapshots remain unchanged.');
    } catch(e) { setError(e instanceof Error ? e.message : 'Official pricing could not be published.'); } finally { setBusy(false); }
  }
  return <section className="admin-card"><h2>Official catalogue cake pricing</h2><p>Approved vanilla base range: {formatPriceRange(pricing.minimumBaseCents, pricing.maximumBaseCents)}. One flavour surcharge per cake; no automatic size, tier or decoration charges.</p>{error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<form key={pricing.version} onSubmit={e => void submit(e)}><fieldset disabled={busy}><div className="admin-form-grid">{OFFICIAL_FLAVOURS.map(f => <label className="admin-field" key={f}>{f} surcharge (ZAR)<input name={f} type="number" min="0" step="0.01" required defaultValue={pricing.flavourSurchargesCents[f] / 100} disabled={f === 'Vanilla'}/></label>)}</div><button className="admin-button">{busy ? 'Publishing…' : preview ? 'Publish official pricing locally' : 'Preview official pricing'}</button></fieldset></form>{preview && <section aria-label="Official price preview"><h3>Price-range preview</h3>{OFFICIAL_FLAVOURS.map(f => { const r = officialRange(preview, f); return <p key={f}>{f}: {formatPriceRange(r.minimumCents, r.maximumCents)}</p>; })}</section>}<details><summary>Official pricing version history</summary><p>Active: {pricing.version}</p>{workspace.officialPricingHistory?.map(p => <section key={p.version}><h4>{p.version}</h4><p>Effective {p.effectiveDate} · {formatPriceRange(p.minimumBaseCents, p.maximumBaseCents)}</p>{OFFICIAL_FLAVOURS.map(f => <small key={f}>{f}: R{p.flavourSurchargesCents[f] / 100} · </small>)}</section>)}</details></section>;
}
