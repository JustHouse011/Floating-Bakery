import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLocalProducts } from '../../store/adminStore';
import { useQuotationPolicy } from '../../hooks/useQuotationPolicy';
import { emptyCustomer, emptyEvent } from '../../data/quotation';
import { EVENT_TYPES, CONTACT_METHODS } from '../../types/quotation';
import { makeProductEnquiry, productEnquiryRepository } from '../../services/catalogueEnquiries';
import { cataloguePrice } from '../../services/cataloguePricing';
import { formatZARCents } from '../../utils/currency';
import { stableJSON, southAfricanDate } from '../../utils/quotation';
import type { ProductEnquiryRecord } from '../../types/catalogue';
import { DELIVERY_NOTICE } from '../../data/officialCatalogue';
import BakeryImage from '../../components/ui/BakeryImage';
import '../../styles/quotation.css';

export function ProductEnquirySummary({ record }: { record: ProductEnquiryRecord }) {
  return <div className="catalogue-enquiry-summary"><BakeryImage src={record.snapshot.product.image} alt={record.snapshot.product.name} /><h2>{record.snapshot.product.name}</h2><p>{record.snapshot.pieces} pieces · <strong>{formatZARCents(record.snapshot.priceCents)}</strong></p><p>{record.customer.fullName} · {record.customer.email} · {record.customer.contactNumber}</p><p>{record.event.eventDate} · {record.event.fulfilment}{record.event.deliveryArea ? ` · ${record.event.deliveryArea}` : ''}</p>{record.event.specialInstructions && <p>{record.event.specialInstructions}</p>}<p>{DELIVERY_NOTICE} Delivery fee is not included and requires confirmation.</p><p className="fine-print">{record.snapshot.disclaimer}</p></div>;
}
export default function ProductEnquiry() {
  const { id } = useParams(); const [params] = useSearchParams(); const navigate = useNavigate();
  const product = useLocalProducts().find(p => p.id === id && !p.archived && p.kind === 'catalogue');
  const policy = useQuotationPolicy();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [event, setEvent] = useState(() => ({ ...emptyEvent(), guests: '1' }));
  const [pieces, setPieces] = useState(params.get('pieces') || '');
  const [consent, setConsent] = useState(false);
  const [review, setReview] = useState<ProductEnquiryRecord | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submitting = useRef(false);
  let price: number | null = null;
  if (product) { try { price = cataloguePrice(product, Number(pieces)); } catch { /* Unsupported quantities cannot be submitted. */ } }
  if (!product) return <section className="section"><h1>Product unavailable</h1><Link to="/cakes">Return to the catalogue</Link></section>;
  function inspect(e: FormEvent) {
    e.preventDefault(); setError('');
    try { setReview(makeProductEnquiry(product!, Number(pieces), customer, event, policy, consent)); }
    catch(e) { setError(e instanceof Error ? e.message : 'Check your request details.'); }
  }
  async function submit() {
    if (!review || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const checked = makeProductEnquiry(product!, Number(pieces), customer, event, policy, consent);
      if (stableJSON(checked.snapshot) !== stableJSON(review.snapshot)) { setReview(checked); throw new Error('Product or policy changed. Review the updated request before saving.'); }
      await productEnquiryRepository.create(review);
      navigate(`/product-enquiries/${review.id}`);
    } catch(e) { setError(e instanceof Error ? e.message : 'Local request could not be saved. Retry after enabling storage.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <section className="section quotation-page"><Link to={`/cakes/${product.id}`} className="text-link">← Back to product</Link><span className="eyebrow">BAKERY PRODUCT ENQUIRY</span><h1>{review ? 'Review your request' : 'Request a quotation'}</h1><p>Saved in this browser only. Contact the bakery directly to send your enquiry.</p>{error && <p role="alert" className="admin-error">{error}</p>}
    {review ? <><ProductEnquirySummary record={review}/><div className="actions"><button className="button" onClick={() => void submit()} disabled={busy}>{busy ? 'Saving…' : 'Save Local Request'}</button><button className="text-link" onClick={() => setReview(null)} disabled={busy}>Back to details</button></div></> : <form className="catalogue-enquiry-form" onSubmit={inspect}>
      <h2>{product.name}</h2><label>Quantity<select required value={pieces} onChange={e => setPieces(e.target.value)}><option value="">Choose a quantity</option>{product.quantityOptions?.map(o => <option key={o.pieces} value={o.pieces}>{o.pieces} pieces</option>)}</select></label><p aria-live="polite">{price === null ? 'Choose a supported quantity' : `${formatZARCents(price)} / ${pieces} pieces`}</p>
      <label>Full name<input required maxLength={100} autoComplete="name" value={customer.fullName} onChange={e => setCustomer({ ...customer, fullName: e.target.value })}/></label>
      <label>Email<input required type="email" autoComplete="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })}/></label>
      <label>South African contact number<input required type="tel" autoComplete="tel" value={customer.contactNumber} onChange={e => setCustomer({ ...customer, contactNumber: e.target.value })}/></label>
      <label>Preferred contact method<select value={customer.preferredContactMethod} onChange={e => setCustomer({ ...customer, preferredContactMethod: e.target.value as typeof customer.preferredContactMethod })}>{CONTACT_METHODS.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Occasion<select value={event.eventType} onChange={e => setEvent({ ...event, eventType: e.target.value as typeof event.eventType })}>{EVENT_TYPES.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Requested date<input required type="date" min={southAfricanDate(new Date())} value={event.eventDate} onChange={e => setEvent({ ...event, eventDate: e.target.value })}/></label>
      <label>Collection or delivery<select value={event.fulfilment} onChange={e => setEvent({ ...event, fulfilment: e.target.value as typeof event.fulfilment })}><option>Collection</option><option>Delivery</option></select></label>
      {event.fulfilment === 'Delivery' && <label>Delivery area<input required maxLength={160} value={event.deliveryArea} onChange={e => setEvent({ ...event, deliveryArea: e.target.value })}/></label>}
      <p>{DELIVERY_NOTICE} Rates and availability require bakery confirmation.</p><label>Special instructions<textarea maxLength={2000} value={event.specialInstructions} onChange={e => setEvent({ ...event, specialInstructions: e.target.value })}/></label>
      <label className="catalogue-consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/>I understand this enquiry is saved locally, has not been sent and is not a confirmed purchase.</label><button className="button" disabled={price === null}>Review Request</button>
    </form>}
  </section>;
}
export function ProductEnquiryConfirmation() {
  const { id } = useParams(); const [record, setRecord] = useState<ProductEnquiryRecord>(); const [error, setError] = useState('');
  useEffect(() => { let live = true; productEnquiryRepository.get(id || '').then(r => { if(live) { setRecord(r); if(!r) setError('No product enquiry exists at this address in this browser.'); } }).catch(e => { if(live) setError(e instanceof Error ? e.message : 'Local storage is unavailable.'); }); return () => { live = false; }; }, [id]);
  return <section className="section quotation-page"><h1>Your local product enquiry</h1>{error && <p role="alert">{error}</p>}{!record && !error && <p role="status">Opening your saved request…</p>}{record && <><p>Saved locally · {record.reference}</p><ProductEnquirySummary record={record}/><button className="button no-print" onClick={() => window.print()}>Print enquiry</button><p>Contact the bakery directly; this request has not been sent.</p></>}<Link className="text-link no-print" to="/cakes">Return to catalogue</Link></section>;
}
