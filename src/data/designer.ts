import type { CakeConfiguration } from "../types/cakeDesigner";
export const COLOUR_SWATCHES = [
  { name: "White", hex: "#fff8ee" },
  { name: "Pink", hex: "#eeb4c5" },
  { name: "Lavender", hex: "#c8b9e6" },
  { name: "Blue", hex: "#accde3" },
  { name: "Sage Green", hex: "#afc6aa" },
  { name: "Peach", hex: "#f2bd9e" },
];
export const DECORATION_LABELS = {
  pearls: "Decorative pearls",
  ribbon: "Cake ribbon",
  drip: "Drip effect",
  flowers: "Simple flowers",
  topper: "Star cake topper",
} as const;
export function defaultConfiguration(): CakeConfiguration {
  return {
    shape: "Round",
    size: 8,
    tiers: 1,
    tierColours: ["#eeb4c5", "#fff8ee", "#c8b9e6"],
    flavour: "Vanilla",
    frosting: "Buttercream",
    decorations: {
      pearls: false,
      ribbon: false,
      drip: false,
      flowers: false,
      topper: false,
    },
    decorationColour: "#b84f69",
    message: "",
    selectedProductId: null,
    quotationRequirements: { complexBespoke: false, referenceDesign: false },
  };
}
