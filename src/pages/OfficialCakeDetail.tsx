import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { OFFICIAL_FLAVOURS, type OfficialFlavour } from '../types/officialCake';
import { useCakePricingRules } from '../store/cakePricingStore';
import { useCakeDesignerStore } from '../store/cakeDesignerStore';
import { beginQuotation } from '../services/quotationNavigation';
import { configurationForProduct } from '../services/cakeConfiguration';
import { officialRange, formatPriceRange, OFFICIAL_PRICE_NOTICE } from '../services/officialCakePricing';
import BakeryImage from '../components/ui/BakeryImage';

export default function OfficialCakeDetail({ product }: { product: Product }) {
  const rules = useCakePricingRules(); const navigate = useNavigate();
  const active = useCakeDesignerStore.getState().configuration; const existing = active.selectedProductId === product.id ? active : null;
  const [flavour, setFlavour] = useState<OfficialFlavour>(existing?.officialFlavour || 'Vanilla'); const [notes, setNotes] = useState(existing?.personalisationInstructions || ''); const [cover, setCover] = useState(product.image);
  const pricing = rules.officialCatalogue;
  if (!pricing) return <section className="section"><h1>Official cake pricing unavailable</h1><p>Please contact the bakery for a quotation.</p></section>;
  const estimate = officialRange(pricing, flavour);
  function select(request: boolean) {
    const config = { ...(useCakeDesignerStore.getState().configuration.selectedProductId === product.id ? useCakeDesignerStore.getState().configuration : configurationForProduct(product.id, rules)), officialFlavour: flavour, personalisationInstructions: notes };
    useCakeDesignerStore.getState().restoreConfiguration(config);
    if (request) { beginQuotation(config); navigate('/quote-request'); }
    else navigate(`/cake-designer?product=${product.id}`);
  }
  return <section className="section detail official-cake-detail"><div><BakeryImage src={cover} srcSet={cover === product.image ? product.responsiveImages?.srcSet : undefined} sizes="(max-width: 760px) 92vw, 48vw" alt={product.name} decoding="async"/><div className="cake-gallery">{[product.image, ...(product.gallery || [])].map((src, i) => <button key={src} aria-label={`View ${product.name} photograph ${i + 1}`} aria-pressed={cover === src} onClick={() => setCover(src)}><BakeryImage src={src} alt={`${product.name}, photograph ${i + 1}`} loading="lazy"/></button>)}</div></div><div><Link to="/cakes" className="text-link">← Back to catalogue</Link><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{product.description}</p><p>Vanilla base range: {formatPriceRange(pricing.minimumBaseCents, pricing.maximumBaseCents)}</p><label className="catalogue-field">Flavour<select value={flavour} onChange={e => setFlavour(e.target.value as OfficialFlavour)}>{OFFICIAL_FLAVOURS.map(f => <option key={f}>{f}</option>)}</select></label><p className="detail-price" aria-live="polite" aria-atomic="true">{formatPriceRange(estimate.minimumCents, estimate.maximumCents)}</p><p>{OFFICIAL_PRICE_NOTICE}</p><p>The photograph is your design reference. Our interactive 3D cake is a conceptual preview and may not reproduce detailed character decorations or sugar craft. Sizes and servings need bakery confirmation.</p><label className="catalogue-field">Personalisation instructions<textarea maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tell us about colours, wording and your occasion."/></label><div className="actions"><button className="button" onClick={() => select(false)} disabled={product.designerEligible === false}>Customise This Cake</button><button className="text-link" onClick={() => select(true)}>Request a Quote for This Cake ↗</button></div><p className="fine-print">Delivery available at an additional cost. No automatic size, tier or decoration surcharges. Availability, final base price and additional charges require confirmation.</p></div></section>;
}
