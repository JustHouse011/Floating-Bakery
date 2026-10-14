import type { Product } from '../types';

export function catalogueCategory(product: Product): string {
  return ['Classics', 'Celebrations', 'Weddings'].includes(product.category) ? 'Custom Cakes' : product.category;
}
export function cataloguePrice(product: Product, pieces: number): number {
  if (product.kind !== 'catalogue' || product.archived || product.availability === 'Unavailable') throw new Error('This product is not available for enquiries.');
  const option = product.quantityOptions?.find(o => o.pieces === pieces);
  if (!Number.isSafeInteger(pieces) || !option || !Number.isSafeInteger(option.priceCents) || option.priceCents < 0) throw new Error('Choose a supported quantity. Prices are not extrapolated.');
  return option.priceCents;
}
export function filterCatalogue(products: Product[], query: string, category: string): Product[] {
  const text = query.trim().toLowerCase();
  return products.filter(p => !p.archived && p.visible !== false && (category === 'All products' || (category === 'Featured cakes' && p.kind === 'official-cake' && p.featured) || catalogueCategory(p) === category || p.categories?.includes(category) || (category === 'Custom Cakes' && p.kind === 'official-cake')) && `${p.name} ${p.description}`.toLowerCase().includes(text)).sort((a, b) => Number(b.kind === 'official-cake') - Number(a.kind === 'official-cake') || Number(!!b.featured) - Number(!!a.featured) || (a.featuredOrder ?? 100) - (b.featuredOrder ?? 100));
}
