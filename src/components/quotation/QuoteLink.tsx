import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '../../types';
import { useCakeDesignerStore } from '../../store/cakeDesignerStore';
import { useCakePricingRules } from '../../store/cakePricingStore';
import { configurationForProduct } from '../../services/cakeConfiguration';
import { beginQuotation } from '../../services/quotationNavigation';

export default function QuoteLink({ children, product, className = 'text-link' }: {children: ReactNode; product?: Product; className?: string}) {
  const rules = useCakePricingRules();
  return <Link className={className} to="/quote-request" onClick={() => {
    if (!product) { beginQuotation(); return; }
    const active = useCakeDesignerStore.getState().configuration;
    const configuration = active.selectedProductId === product.id ? active : configurationForProduct(product.id, rules);
    useCakeDesignerStore.getState().restoreConfiguration(configuration);
    beginQuotation(configuration);
  }}>{children} <ArrowUpRight size={18} aria-hidden="true" /></Link>;
}
