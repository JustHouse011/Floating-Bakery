import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { CakePricingRules } from "../types/pricing";
import { cakePricingRules } from "../data/cakePricing";
import { validatePricingRules } from "../services/pricingEngine";
export const cakePricingStore = createStore<{
  rules: CakePricingRules;
  setRules(rules: CakePricingRules): void;
}>((set) => ({
  rules: cakePricingRules,
  setRules: (rules) => {
    validatePricingRules(rules);
    set({ rules: structuredClone(rules) });
  },
}));
export function useCakePricingRules() {
  return useStore(cakePricingStore, (state) => state.rules);
}
