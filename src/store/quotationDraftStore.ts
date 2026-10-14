import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { CakeConfiguration } from "../types/cakeDesigner";
import type {
  QuotationDraft,
  CustomerDetails,
  EventFormValues,
  ReferenceImage,
} from "../types/quotation";
import { emptyCustomer, emptyEvent } from "../data/quotation";
import { validateConfiguration } from "../services/cakeConfiguration";
import { deepFreeze } from "../utils/quotation";
interface QuotationDraftState {
  draft: QuotationDraft | null;
  step: number;
  start(configuration: CakeConfiguration): void;
  setCustomer(patch: Partial<CustomerDetails>): void;
  setEvent(patch: Partial<EventFormValues>): void;
  setReferences(references: ReferenceImage[]): void;
  setConsent(value: boolean): void;
  setStep(step: number): void;
  clear(): void;
}
export const quotationDraftStore = createStore<QuotationDraftState>((set) => ({
  draft: null,
  step: 0,
  start: (configuration) =>
    set({
      draft: {
        id: crypto.randomUUID(),
        configuration: deepFreeze(validateConfiguration(configuration)),
        customer: emptyCustomer(),
        event: emptyEvent(),
        references: [],
        demoConsent: false,
      },
      step: 0,
    }),
  setCustomer: (patch) =>
    set((state) =>
      state.draft
        ? {
            draft: {
              ...state.draft,
              customer: { ...state.draft.customer, ...patch },
            },
          }
        : state,
    ),
  setEvent: (patch) =>
    set((state) =>
      state.draft
        ? {
            draft: {
              ...state.draft,
              event: { ...state.draft.event, ...patch },
            },
          }
        : state,
    ),
  setReferences: (references) =>
    set((state) =>
      state.draft
        ? { draft: { ...state.draft, references: [...references] } }
        : state,
    ),
  setConsent: (value) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, demoConsent: value } } : state,
    ),
  setStep: (step) => {
    if (!Number.isInteger(step) || step < 0 || step > 3)
      throw new Error("Invalid quotation form step");
    set({ step });
  },
  clear: () => set({ draft: null, step: 0 }),
}));
function useDraftStore(): QuotationDraftState;
function useDraftStore<T>(selector: (state: QuotationDraftState) => T): T;
function useDraftStore(selector?: (state: QuotationDraftState) => unknown) {
  return useStore(quotationDraftStore, selector ?? ((state) => state));
}
export const useQuotationDraftStore = Object.assign(
  useDraftStore,
  quotationDraftStore,
);
