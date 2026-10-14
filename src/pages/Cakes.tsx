import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useLocalProducts } from '../store/adminStore';
import ProductCard from '../components/cakes/ProductCard';
import ProductPhoto from '../components/ui/ProductPhoto';
import { formatRand } from '../utils/currency';
import { CATALOGUE_CATEGORIES, DELIVERY_NOTICE } from '../data/officialCatalogue';
import { catalogueCategory, filterCatalogue } from '../services/cataloguePricing';
import CatalogueDetail from './CatalogueDetail';
import OfficialCakeDetail from './OfficialCakeDetail';
import { CAKE_CATEGORIES } from '../services/officialCakePricing';
import QuoteLink from '../components/quotation/QuoteLink';

export function Cakes() {
  const [params] = useSearchParams();
  const products = useLocalProducts();
  const [query, setQuery] = useState('');
  const categories = ['All products', 'Featured cakes', ...CAKE_CATEGORIES, ...CATALOGUE_CATEGORIES];
  const requested = params.get('category');
  const [category, setCategory] = useState(requested && categories.includes(requested) ? requested : 'All products');
  const filtered = filterCatalogue(products, query, category);
  return <div className="section catalogue"><div className="page-heading"><span className="eyebrow">FIND YOUR SOMETHING SWEET</span><h1>The bakery <em>collection.</em></h1><p>Celebration cakes, Sweet Treats by the dozen and freshly baked scones.</p><QuoteLink>Request a Custom Quote</QuoteLink></div>
    <div className="catalogue-toolbar"><div className="filters" aria-label="Product categories">{categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><label className="search"><Search size={18}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find something sweet" aria-label="Search products"/></label></div>
    <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div>{!filtered.length && <div className="empty"><h2>No products found.</h2><p>Try another search or category.</p><button className="button" onClick={() => { setQuery(''); setCategory('All products'); }}>Show all products</button></div>}
    <p className="fine-print">Cake ranges include the vanilla base price; one selected flavour surcharge applies. Sweet Treats prices are per 12 pieces; scones use the listed quantities. {DELIVERY_NOTICE} Availability and delivery rates require bakery confirmation.</p></div>;
}
export function CakeDetail() {
  const products = useLocalProducts();
  const {id} = useParams();
  const p = products.find(p => !p.archived && p.visible !== false && (p.id === id || p.slug === id));
  if (!p) return <div className="section"><h1>Cake not found</h1><Link to="/cakes">Return to the collection</Link></div>;
  if (p.kind === 'catalogue') return <CatalogueDetail key={p.id} product={p}/>;
  if (p.kind === 'official-cake') return <OfficialCakeDetail key={p.id} product={p}/>;
  return <section className="section detail"><ProductPhoto src={p.image} alt={p.name}/><div><Link to="/cakes" className="text-link"><ArrowLeft size={16}/> Back to the collection</Link><span className="eyebrow">{catalogueCategory(p)}</span><h1>{p.name}</h1><p>{p.description}</p><p className="detail-price">From {formatRand(p.price)}</p><p className="fine-print">Estimated Price — Subject to Bakery Confirmation.</p><dl><dt>Flavour inspiration</dt><dd>{p.flavour}</dd><dt>Design</dt><dd>Discuss colours, finish and occasion with the bakery.</dd></dl>{p.designerEligible !== false && <Link className="button" to={`/cake-designer?product=${p.id}`}>Customise This Cake <ArrowUpRight size={18}/></Link>}<QuoteLink product={p}>Request a Quote for This Cake</QuoteLink></div></section>;
}
