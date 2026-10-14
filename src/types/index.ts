export interface Product {
  id: string;
  name: string;
  category: "Classics" | "Celebrations" | "Weddings" | "Custom Cakes" | "Brownies" | "Cookies" | "Pastries" | "Scones" | "Catering" | "Birthday Cakes" | "Kids' Cakes" | "Luxury Cakes" | "Floral Cakes" | "Graduation Cakes" | "Custom Celebration Cakes";
  price: number;
  image: string;
  description: string;
  flavour: string;
  demo: boolean;
  kind?: "cake" | "catalogue" | "official-cake";
  slug?: string;
  categories?: string[];
  gallery?: string[];
  sourceImages?: string[];
  availableFlavours?: string[];
  dateAdded?: string;
  visible?: boolean;
  featuredOrder?: number;
  reviewNotes?: string[];
  pricingMode?: 'official-range';
  responsiveImages?: { thumbnail: string; detail: string; srcSet: string };
  quantityOptions?: { pieces: number; priceCents: number }[];
  quantityUnit?: 'pieces';
  availability?: "Enquiry" | "Unavailable";
  imageNote?: string;
  archived?: boolean;
  featured?: boolean;
  designerEligible?: boolean;
}
export interface CatalogueProduct extends Product {
  kind: 'catalogue';
  designerEligible: false;
  quantityUnit: 'pieces';
  quantityOptions: { pieces: number; priceCents: number }[];
}
