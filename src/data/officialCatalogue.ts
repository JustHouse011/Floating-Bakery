import type { Product, CatalogueProduct } from '../types';

export const CATALOGUE_CATEGORIES = ['Custom Cakes', 'Brownies', 'Cookies', 'Pastries', 'Scones', 'Catering'] as const;
export const OFFICIAL_CONTACT = { businessName: 'Floating Bakery & Caterers', phone: '073 126 8382', email: 'guguminnaar@gmail.com', location: 'Thatchfield, Centurion', website: 'www.floatingbakeryandcaterers.com', tagline: 'Freshness in Every Bite' };
export const DELIVERY_NOTICE = 'Delivery available at an additional cost.';
const sweet: [string, string, Product['category'], number, string][] = [
  ['fudge-brownies', 'Fudge Brownies', 'Brownies', 310, 'Chocolate brownies with a rich, fudgy centre.'],
  ['chocolate-chip-cookies', 'Chocolate Chip Cookies', 'Cookies', 240, 'Cookies studded with chocolate chips, ready to share.'],
  ['chocolate-cheesecake-brownies', 'Chocolate Cheesecake Brownies', 'Brownies', 420, 'Chocolate brownies layered with cheesecake.'],
  ['chocolate-eclairs', 'Chocolate Éclairs', 'Pastries', 300, 'Filled choux pastries finished with chocolate.'],
  ['cream-puffs', 'Cream Puffs', 'Pastries', 320, 'Light choux pastries with a cream filling.'],
  ['profiteroles', 'Profiteroles', 'Pastries', 380, 'Filled choux bites with a chocolate finish.'],
  ['chouquettes', 'Chouquettes', 'Pastries', 240, 'Small choux pastries topped with sugar.'],
  ['palmiers', 'Palmiers', 'Pastries', 220, 'Golden, folded puff pastries for a sweet break.'],
  ['madeleines', 'Madeleines', 'Pastries', 260, 'Delicate shell-shaped cakes to enjoy with tea.'],
];
const base = { kind: 'catalogue' as const, quantityUnit: 'pieces' as const, demo: false, designerEligible: false as const, archived: false, featured: false, availability: 'Enquiry' as const, flavour: 'As supplied on the menu' };
export const officialProducts: CatalogueProduct[] = [
  ...sweet.map(([id, name, category, price, description]) => ({ ...base, id, name, category, price, description, image: `/images/catalogue/${id}.webp`, quantityOptions: [{ pieces: 12, priceCents: price * 100 }] })),
  ...([
    ['plain-scones', 'Plain Scones', [300, 550, 980], 'plain-scones', 'Golden plain scones, freshly baked to share.'],
    ['raisin-scones', 'Raisin Scones', [380, 650, 1100], 'plain-scones', 'Scones with raisins, available in the menu quantities.'],
    ['chocolate-chip-scones', 'Chocolate Chip Scones', [400, 700, 1200], 'chocolate-chip-scones', 'Scones with chocolate chips for a sweet treat.'],
  ] as [string, string, number[], string, string][]).map(([id, name, prices, photo, description]) => ({ ...base, id, name, category: 'Scones' as const, price: prices[0], description, image: `/images/catalogue/${photo}.webp`, quantityOptions: [5, 10, 20].map((pieces, i) => ({ pieces, priceCents: prices[i] * 100 })), ...(id === 'raisin-scones' ? { imageNote: 'Plain scone menu photograph reused; a distinct raisin photograph was not supplied.' } : {}) })),
];
