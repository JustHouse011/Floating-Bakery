import type { Product } from "../types";
const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
export const products: Product[] = [
  {
    id: "vanilla",
    name: "Classic Vanilla Cake",
    category: "Classics",
    price: 450,
    image: photo("photo-1578985545062-69928b1d9587"),
    description:
      "A timeless celebration of soft vanilla sponge and delicate buttercream. Simple, elegant and made for sharing.",
    flavour: "Vanilla",
    demo: true,
  },
  {
    id: "chocolate",
    name: "Chocolate Celebration Cake",
    category: "Classics",
    price: 550,
    image: photo("photo-1606313564200-e75d5e30476c"),
    description:
      "Rich chocolate layers with a silky chocolate finish. A little indulgence for a special moment.",
    flavour: "Chocolate",
    demo: true,
  },
  {
    id: "red-velvet",
    name: "Red Velvet Cake",
    category: "Classics",
    price: 650,
    image: photo("photo-1586788680434-30d324b2d46f"),
    description:
      "Velvety red sponge paired with a soft cream finish, styled with understated elegance.",
    flavour: "Red Velvet",
    demo: true,
  },
  {
    id: "floral",
    name: "Floral Birthday Cake",
    category: "Celebrations",
    price: 850,
    image: photo("photo-1535254973040-607b92a401c8"),
    description:
      "A floral-inspired centrepiece in gentle colours, designed around your celebration.",
    flavour: "Choose your flavour",
    demo: true,
  },
  {
    id: "two-tier",
    name: "Two-Tier Celebration Cake",
    category: "Celebrations",
    price: 1400,
    image: photo("photo-1623428187969-5da2dcea5ebf"),
    description:
      "Two beautifully balanced tiers for gatherings that deserve something extra special.",
    flavour: "Choose your flavour",
    demo: true,
  },
  {
    id: "wedding",
    name: "Luxury Wedding Cake",
    category: "Weddings",
    price: 2500,
    image: photo("photo-1523438885200-e635ba2c371e"),
    description:
      "An elegant wedding centrepiece. Every detail will be discussed with the bakery for an individual quotation.",
    flavour: "Bespoke consultation",
    demo: true,
  },
];
