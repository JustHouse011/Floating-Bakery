import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productEnquiryRepository } from '../../services/catalogueEnquiries';
import type { ProductEnquiryRecord } from '../../types/catalogue';
import { formatZARCents } from '../../utils/currency';

export default function ProductEnquiries() {
  const [records, setRecords] = useState<ProductEnquiryRecord[]>([]); const [error, setError] = useState(''); const [query, setQuery] = useState('');
  useEffect(() => { let live = true; const load = () => productEnquiryRepository.list().then(r => { if(live) { setRecords(r); setError(''); } }).catch(e => { if(live) setError(e instanceof Error ? e.message : 'Product enquiries could not be opened.'); }); void load(); window.addEventListener('focus', load); return () => { live = false; window.removeEventListener('focus', load); }; }, []);
  const filtered = records.filter(r => `${r.customer.fullName} ${r.reference} ${r.snapshot.product.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="admin-card"><h2>Bakery product enquiries</h2><p>Fixed quantity prices, stored separately from custom cake requests. These are local enquiries, not purchases. Cake reports/calendar currently cover custom cake requests only.</p><label className="admin-field">Search product enquiries<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>{error && <p role="alert" className="admin-error">{error}</p>}{!error && !filtered.length && <p>No matching product enquiries.</p>}<div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Customer / reference</th><th>Product / quantity</th><th>Original catalogue price</th><th>Requested date</th><th>Snapshot</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td>{r.customer.fullName}<small>{r.reference}</small></td><td>{r.snapshot.product.name}<small>{r.snapshot.pieces} pieces</small></td><td>{formatZARCents(r.snapshot.priceCents)}<small>Delivery not included</small></td><td>{r.event.eventDate}</td><td><Link to={`/product-enquiries/${r.id}`} target="_blank" rel="noreferrer">Open saved enquiry ↗</Link></td></tr>)}</tbody></table></div></section>;
}
