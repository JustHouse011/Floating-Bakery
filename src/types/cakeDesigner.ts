export const CAKE_SIZES = [6, 8, 10, 12] as const;
export const CAKE_SHAPES = ["Round", "Square"] as const;
export const FLAVOURS = [
  "Vanilla",
  "Chocolate",
  "Red Velvet",
  "Carrot",
  "Lemon",
] as const;
export const FROSTINGS = [
  "Buttercream",
  "Fondant",
  "Chocolate Ganache",
] as const;
export const DECORATIONS = [
  "pearls",
  "ribbon",
  "drip",
  "flowers",
  "topper",
] as const;
export type CakeSize = (typeof CAKE_SIZES)[number];
export type CakeShape = (typeof CAKE_SHAPES)[number];
export type Flavour = (typeof FLAVOURS)[number];
export type Frosting = (typeof FROSTINGS)[number];
export type Decoration = (typeof DECORATIONS)[number];
export type TierCount = 1 | 2 | 3;
export type TierColours = [string, string, string];
export interface QuotationRequirements {
  complexBespoke: boolean;
  referenceDesign: boolean;
}
export interface CakeConfiguration {
  studio?: import('./studio').StudioDesign;
  shape: CakeShape;
  size: CakeSize;
  tiers: TierCount;
  tierColours: TierColours;
  flavour: Flavour;
  frosting: Frosting;
  decorations: Record<Decoration, boolean>;
  decorationColour: string;
  message: string;
  selectedProductId: string | null;
  quotationRequirements: QuotationRequirements;
  officialFlavour?: import('./officialCake').OfficialFlavour;
  personalisationInstructions?: string;
}
export interface TierDimension {
  index: number;
  inches: number;
  radius: number;
  height: number;
  bottom: number;
}
