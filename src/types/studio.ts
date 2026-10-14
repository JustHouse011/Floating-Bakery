export const FINISHES = ['Smooth buttercream', 'Smooth fondant', 'Textured buttercream', 'Rustic frosting', 'Vertical ridges', 'Horizontal grooves', 'Pleated', 'Ruffled', 'Quilted fondant', 'Embossed', 'Ombré', 'Marble', 'Watercolour', 'Metallic accents'] as const;
export const ORNAMENTS = ['Rose cluster', 'Blossoms', 'Leaves', 'Pearls', 'Beaded border', 'Gold leaf', 'Drip', 'Ribbon', 'Bow', 'Topper', 'Plaque', 'Geometric ornament', 'Print reference'] as const;
export type OrnamentKind = typeof ORNAMENTS[number];
export interface StudioTier { width: number; height: number; depth: number; taper: number; offset: number; colour: string }
export interface StudioDecoration { id: string; kind: OrnamentKind; tier: number; region: 'Top' | 'Front' | 'Left' | 'Right'; scale: number; rotation: number; colour: string; density: number; text: string }
export interface StudioDesign {
  version: 1;
  templateId: string | null;
  shape: 'Round' | 'Square' | 'Rectangular';
  tiers: StudioTier[];
  finish: typeof FINISHES[number];
  secondaryColour: string;
  board: { visible: boolean; colour: string; finish: 'Matte' | 'Gold' | 'Silver' };
  decorations: StudioDecoration[];
  personalisation: { name: string; number: string; message: string; event: string; scheme: string };
  referenceOnly: string[];
}
