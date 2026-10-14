import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  CakeConfiguration,
  CakeShape,
  CakeSize,
  TierCount,
  Flavour,
  Frosting,
  Decoration,
  QuotationRequirements,
} from "../types/cakeDesigner";
import { defaultConfiguration } from "../data/designer";
import { cakePricingStore } from "./cakePricingStore";
import { studioFromConfiguration, validateStudio } from '../services/studioDesign';
import type { StudioDesign } from '../types/studio';
import {
  compatibleSize,
  minimumSize,
  isHexColour,
  validateConfiguration,
  configurationForProduct,
} from "../services/cakeConfiguration";
interface DesignerState {
  past: CakeConfiguration[];
  future: CakeConfiguration[];
  selectedDecoration: string | null;
  cameraView: 'Perspective' | 'Front' | 'Side' | 'Top';
  background: 'White' | 'Warm' | 'Cool';
  editStudio(studio: StudioDesign): void;
  selectDecoration(id: string | null): void;
  undo(): void;
  redo(): void;
  resetTemplate(): void;
  duplicateDesign(): void;
  setCameraView(view: DesignerState['cameraView']): void;
  setBackground(background: DesignerState['background']): void;
  configuration: CakeConfiguration;
  cameraResetKey: number;
  setShape(shape: CakeShape): void;
  setSize(size: CakeSize): void;
  setTiers(tiers: TierCount): void;
  setTierColour(index: number, colour: string): void;
  setFlavour(flavour: Flavour): void;
  setOfficialFlavour(flavour: import('../types/officialCake').OfficialFlavour): void;
  setPersonalisationInstructions(instructions: string): void;
  setFrosting(frosting: Frosting): void;
  toggleDecoration(decoration: Decoration): void;
  setDecorationColour(colour: string): void;
  setMessage(message: string): void;
  setQuotationRequirement(
    key: keyof QuotationRequirements,
    value: boolean,
  ): void;
  resetCamera(): void;
  resetDesign(): void;
  restoreConfiguration(configuration: unknown): void;
  selectProduct(id: string): void;
}
export const cakeDesignerStore = createStore<DesignerState>((set, get) => {
  const update = (patch: Partial<CakeConfiguration>) =>
    set((state) => ({
      past: [...state.past.slice(-49), structuredClone(state.configuration)], future: [],
      configuration: validateConfiguration({
        ...state.configuration,
        ...patch,
      }),
    }));
  return {
    past: [], future: [], selectedDecoration: null, cameraView: 'Perspective', background: 'White',
    editStudio: (studio) => update({studio: validateStudio(studio)}),
    selectDecoration: (selectedDecoration) => set({selectedDecoration}),
    setCameraView: (cameraView) => set(s => ({cameraView, cameraResetKey:s.cameraResetKey+1})),
    setBackground: (background) => set({background}),
    undo: () => set(s => s.past.length ? {configuration:s.past[s.past.length-1],past:s.past.slice(0,-1),future:[structuredClone(s.configuration),...s.future],selectedDecoration:null} : {}),
    redo: () => set(s => s.future.length ? {configuration:s.future[0],future:s.future.slice(1),past:[...s.past,structuredClone(s.configuration)],selectedDecoration:null} : {}),
    resetTemplate: () => { const c = get().configuration; if(c.selectedProductId) update({...configurationForProduct(c.selectedProductId,cakePricingStore.getState().rules),officialFlavour:c.officialFlavour,personalisationInstructions:c.personalisationInstructions}); else update(defaultConfiguration()); },
    duplicateDesign: () => update({studio: {...studioFromConfiguration(get().configuration),templateId:null}}),
    configuration: defaultConfiguration(),
    cameraResetKey: 0,
    setShape: (shape) => update({ shape, ...(get().configuration.studio ? {studio:{...get().configuration.studio!,shape,tiers:get().configuration.studio!.tiers.map(t=>({...t,depth:t.width}))}} : {}) }),
    setSize: (size) => {
      if (!compatibleSize(size, get().configuration.tiers))
        throw new Error("Choose a larger base size for this tier count");
      const studio = get().configuration.studio;
      const base = studio ? Math.max(size/4,.9+.5*(studio.tiers.length-1)) : size/4;
      update({ size, ...(studio ? {studio:{...studio,tiers:studio.tiers.map((t,i)=>({...t,width:base-i*.5,depth:base-i*.5,offset:0,taper:0}))}} : {}) });
    },
    setTiers: (tiers) =>
      update({
        tiers,
        size: Math.max(
          get().configuration.size,
          minimumSize(tiers),
        ) as CakeSize,
        ...(get().configuration.studio ? {studio:{...get().configuration.studio!,tiers:Array.from({length:tiers},(_,i)=>({...get().configuration.studio!.tiers[Math.min(i,get().configuration.studio!.tiers.length-1)],width:(Math.max(get().configuration.size,minimumSize(tiers))-i*2)/4,depth:(Math.max(get().configuration.size,minimumSize(tiers))-i*2)/4,offset:0,taper:0})),decorations:get().configuration.studio!.decorations.map(d=>({...d,tier:d.region==='Top'&&!['Beaded border','Ribbon','Drip'].includes(d.kind)?tiers-1:Math.min(d.tier,tiers-1)}))}} : {}),
      }),
    setTierColour: (index, colour) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index > 2 ||
        !isHexColour(colour)
      )
        throw new Error("Invalid tier colour");
      const colours = [
        ...get().configuration.tierColours,
      ] as CakeConfiguration["tierColours"];
      colours[index] = colour;
      update({ tierColours: colours, ...(get().configuration.studio ? {studio:{...get().configuration.studio!,tiers:get().configuration.studio!.tiers.map((t,i)=>i===index?{...t,colour}:t)}} : {}) });
    },
    setFlavour: (flavour) => update({ flavour }),
    setOfficialFlavour: (officialFlavour) => update({ officialFlavour }),
    setPersonalisationInstructions: (personalisationInstructions) => update({ personalisationInstructions }),
    setFrosting: (frosting) => update({ frosting, ...(get().configuration.studio ? {studio:{...get().configuration.studio!,finish:frosting==='Fondant'?'Smooth fondant':'Smooth buttercream'}} : {}) }),
    toggleDecoration: (decoration) => {
      const c=get().configuration,studio=c.studio;
      const kinds={pearls:'Beaded border',ribbon:'Ribbon',drip:'Drip',flowers:'Rose cluster',topper:'Topper'} as const;
      update({
        decorations: {
          ...get().configuration.decorations,
          [decoration]: !get().configuration.decorations[decoration],
        },
        ...(studio ? {studio:{...studio,decorations:c.decorations[decoration] ? studio.decorations.filter(d=>d.id!==`legacy-${decoration}`) : [...studio.decorations,{id:`legacy-${decoration}`,kind:kinds[decoration],tier:studio.tiers.length-1,region:decoration==='drip'||decoration==='ribbon'?'Front':'Top',scale:1,rotation:0,colour:c.decorationColour,density:3,text:''}]}} : {}),
      });
    },
    setDecorationColour: (colour) => update({ decorationColour: colour }),
    setMessage: (message) =>
      update({
        message: Array.from(message)
          .filter(
            (character) =>
              character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
          )
          .join("")
          .slice(0, 32),
      }),
    resetCamera: () =>
      set((state) => ({ cameraView: 'Perspective', cameraResetKey: state.cameraResetKey + 1 })),
    setQuotationRequirement: (key, value) =>
      update({
        quotationRequirements: {
          ...get().configuration.quotationRequirements,
          [key]: value,
        },
      }),
    resetDesign: () =>
      set((state) => ({
        configuration: defaultConfiguration(),
        past: [...state.past.slice(-49), structuredClone(state.configuration)], future: [], selectedDecoration: null,
        cameraResetKey: state.cameraResetKey + 1,
      })),
    restoreConfiguration: (configuration) =>
      set((state) => ({
        configuration: validateConfiguration(configuration),
        past: [...state.past.slice(-49), structuredClone(state.configuration)], future: [], selectedDecoration: null,
        cameraResetKey: state.cameraResetKey + 1,
      })),
    selectProduct: (id) => {
      if (get().configuration.selectedProductId !== id)
        set((state) => ({
          configuration: configurationForProduct(
            id,
            cakePricingStore.getState().rules,
          ),
          past: [...state.past.slice(-49), structuredClone(state.configuration)], future: [], selectedDecoration: null,
          cameraResetKey: state.cameraResetKey + 1,
        }));
    },
  };
});
function useDesignerStore(): DesignerState;
function useDesignerStore<T>(selector: (state: DesignerState) => T): T;
function useDesignerStore(selector?: (state: DesignerState) => unknown) {
  return useStore(cakeDesignerStore, selector ?? ((state) => state));
}
export const useCakeDesignerStore = Object.assign(
  useDesignerStore,
  cakeDesignerStore,
);
