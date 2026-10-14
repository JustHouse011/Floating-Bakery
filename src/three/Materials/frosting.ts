import type { Frosting } from "../../types/cakeDesigner";
export function frostingMaterial(frosting: Frosting, colour: string) {
  if (frosting === "Chocolate Ganache")
    return {
      color: "#48251b",
      roughness: 0.23,
      metalness: 0.02,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
    };
  if (frosting === "Fondant")
    return {
      color: colour,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.12,
      clearcoatRoughness: 0.6,
    };
  return {
    color: colour,
    roughness: 0.88,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 1,
  };
}
