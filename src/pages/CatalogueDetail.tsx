import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import BakeryImage from '../components/ui/BakeryImage';
import { formatZARCents } from '../utils/currency';
import { cataloguePrice } from '../services/cataloguePricing';
import { DELIVERY_NOTICE } from '../data/officialCatalogue';

export default function CatalogueDetail({ product }: { product: Product }) {
  const [pieces, setPieces] = useState<number | ''>(product.quantityOptions?.length === 1 ? product.quantityOptions[0].pieces : '');
  const unavailable = product.availability === 'Unavailable';
  return <section className="section detail catalogue-detail">
    <div><BakeryImage src={product.image} alt={product.name} decoding="async" /><p className="fine-print">{product.imageNote || 'Photograph extracted from the supplied bakery menu.'}</p></div>
    <div><Link to="/cakes" className="text-link">← Back to the collection</Link><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{product.description}</p>
      <label className="catalogue-field">Quantity<select value={pieces} onChange={e => setPieces(e.target.value ? Number(e.target.value) : '')} disabled={unavailable}><option value="">Choose a quantity</option>{product.quantityOptions?.map(o => <option key={o.pieces} value={o.pieces}>{o.pieces} pieces</option>)}</select></label>
      <p className="detail-price" aria-live="polite">{unavailable ? 'Currently unavailable for enquiries' : pieces ? `${formatZARCents(cataloguePrice(product, pieces))} / ${pieces} pieces` : 'Select a quantity to see its price'}</p>
      {!pieces && !unavailable && <p className="fine-print">{product.quantityOptions?.map(o => `${o.pieces} pieces: ${formatZARCents(o.priceCents)}`).join(' · ')}</p>}
      <p>{DELIVERY_NOTICE}</p><p className="fine-print">Catalogue price. Availability and delivery costs require bakery confirmation; this is not a confirmed purchase.</p>
      {pieces && !unavailable ? <Link className="button" to={`/product-enquiry/${product.id}?pieces=${pieces}`}>Request Quote ↗</Link> : <button className="button" disabled>Request Quote</button>}
    </div>
  </section>;
}
