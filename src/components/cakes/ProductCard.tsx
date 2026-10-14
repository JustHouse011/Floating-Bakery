import { Link } from "react-router-dom";
import type { Product } from "../../types";
import { formatRand } from "../../utils/currency";
import ProductPhoto from '../ui/ProductPhoto';
import { catalogueCategory } from '../../services/cataloguePricing';
import { useCakePricingRules } from '../../store/cakePricingStore';
export default function ProductCard({ product }: { product: Product; enquiry?: boolean }) {
  const rules = useCakePricingRules();
  return (
    <article className={`product-card ${product.kind === 'catalogue' ? 'catalogue-product' : product.kind === 'official-cake' ? 'official-cake-product' : ''}`}>
      <Link to={`/cakes/${product.id}`} className="product-image">
        <ProductPhoto src={product.responsiveImages?.thumbnail || product.image} srcSet={product.responsiveImages?.srcSet} sizes="(max-width: 560px) 92vw, (max-width: 1024px) 45vw, 30vw" alt={product.name} />
      </Link>
      <div className="product-meta">
        <span>{catalogueCategory(product)}</span>
      </div>
      <h3>
        <Link to={`/cakes/${product.id}`}>{product.name}</Link>
      </h3>
      <p className="fine-print">{product.kind === 'official-cake' ? product.description : product.description || product.imageNote || 'Availability requires confirmation.'}</p>
      <div className="product-card-actions"><p className="product-starting-price">{product.kind === 'official-cake' ? `From ${formatRand((rules.officialCatalogue?.minimumBaseCents ?? 148000) / 100)}` : product.kind === 'catalogue' && product.quantityOptions?.length === 1 ? `${formatRand(product.price)} / ${product.quantityOptions[0].pieces} pieces` : `From ${formatRand(product.price)}`}</p><Link className="text-link" to={`/cakes/${product.id}`}>View Product <span aria-hidden="true">→</span></Link></div>
    </article>
  );
}
