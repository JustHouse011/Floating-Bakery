import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import {
  adminRepository,
  defaultWorkspace,
  publishedRules,
  validateProduct,
  validateSettings,
} from "../services/adminRepository";
import { cakePricingStore } from "./cakePricingStore";
import type { AdminWorkspace, BakerySettings } from "../types/admin";
import type { Product } from "../types";
import type { CakePricingRules } from "../types/pricing";
import { defaultConfiguration } from "../data/designer";
import { setCurrencyLocale } from "../utils/currency";
import { validateOfficialPricing } from '../services/officialCakePricing';
import { southAfricanDate } from '../utils/quotation';
import {
  writeSessionDesign,
  SESSION_DESIGN_KEY,
} from "../services/sessionDesign";
interface AdminState {
  workspace: AdminWorkspace;
  ready: boolean;
  error: string;
  busy: boolean;
}
export const adminStore = createStore<AdminState>(() => ({
  workspace: defaultWorkspace(),
  ready: false,
  error: "",
  busy: false,
}));
function apply(workspace: AdminWorkspace) {
  setCurrencyLocale(workspace.settings.locale);
  cakePricingStore.getState().setRules(workspace.rules);
  adminStore.setState({ workspace, ready: true, error: "" });
}
let loading: Promise<void> | undefined;
export function initializeWorkspace(): Promise<void> {
  if (!loading)
    loading = adminRepository
      .load()
      .then(apply)
      .catch((e) => {
        adminStore.setState({
          error: e instanceof Error ? e.message : "Local storage failed.",
          ready: false,
        });
      })
      .finally(() => {
        loading = undefined;
      });
  return loading;
}
async function commit(change: (current: AdminWorkspace) => AdminWorkspace) {
  if (adminStore.getState().busy)
    throw new Error("Wait for the current change to finish.");
  if (!adminStore.getState().ready)
    throw new Error("Local storage has not loaded. Retry before editing.");
  adminStore.setState({ busy: true });
  try {
    const current = adminStore.getState().workspace;
    const next = change(structuredClone(current));
    next.revision = current.revision + 1;
    const saved = await adminRepository.save(next, current.revision);
    apply(saved);
  } finally {
    adminStore.setState({ busy: false });
  }
}
export async function saveProduct(product: Product) {
  const clean = validateProduct(product);
  await commit((current) => {
    const found = current.products.findIndex((p) => p.id === clean.id);
    if (found < 0) current.products.push(clean);
    else current.products[found] = clean;
    if (clean.kind === 'official-cake') {
      if (!current.rules.officialCatalogue) throw new Error('Official pricing has not loaded.');
      current.rules.officialCatalogue.products[clean.id] = { name: clean.name, image: clean.image, category: clean.category };
      return current;
    }
    if (clean.kind === 'catalogue') return current;
    const config = defaultConfiguration();
    current.rules.productPackages[clean.id] = {
      ...(current.rules.productPackages[clean.id] ?? {
        baseline: {
          shape: config.shape,
          size: config.size,
          tiers: config.tiers,
          flavour: config.flavour,
          frosting: config.frosting,
          decorations: config.decorations,
          messageIncluded: false,
        },
        manualQuotationRequired: false,
      }),
      name: clean.name,
      startingPriceCents: Math.round(clean.price * 100),
    };
    current.rules = publishedRules(current.rules, current.revision + 1);
    return current;
  });
}
export async function publishPricing(rules: CakePricingRules) {
  await commit((current) => {
    current.rules = publishedRules({ ...rules, ...(current.rules.officialCatalogue ? { officialCatalogue: current.rules.officialCatalogue } : {}) }, current.revision + 1);
    current.products = current.products.map((p) => ({
      ...p,
      price: p.kind === 'catalogue' || p.kind === 'official-cake' ? p.price : current.rules.productPackages[p.id]?.startingPriceCents / 100,
    }));
    return current;
  });
}
export async function publishOfficialPricing(pricing: import('../types/officialCake').OfficialCakePricing) {
  validateOfficialPricing(pricing);
  await commit(current => {
    if (current.rules.officialCatalogue) (current.officialPricingHistory ??= []).push(structuredClone(current.rules.officialCatalogue));
    const now = new Date();
    current.rules.officialCatalogue = { ...structuredClone(pricing), products: structuredClone(current.rules.officialCatalogue?.products || {}), version: `official-${now.toISOString()}-r${current.revision + 1}`, effectiveDate: southAfricanDate(now) };
    return current;
  });
}
export async function saveSettings(settings: BakerySettings) {
  const clean = validateSettings(settings);
  await commit((current) => ({ ...current, settings: clean }));
}
export async function resetLocalDemo(confirmation: string) {
  if (adminStore.getState().busy)
    throw new Error("Wait for the current change to finish.");
  adminStore.setState({ busy: true });
  try {
    apply(await adminRepository.reset(confirmation));
    if (typeof sessionStorage !== "undefined") {
      try {
        writeSessionDesign(defaultConfiguration(), sessionStorage, null);
      } catch {
        try {
          sessionStorage.removeItem(SESSION_DESIGN_KEY);
        } catch {
          /* Unavailable tab storage cannot retain a usable design. */
        }
      }
    }
  } finally {
    adminStore.setState({ busy: false });
  }
}
export function useWorkspace() {
  return useStore(adminStore, (state) => state.workspace);
}
export function useLocalProducts() {
  return useStore(adminStore, (state) => state.workspace.products);
}
export function useBakerySettings() {
  return useStore(adminStore, (state) => state.workspace.settings);
}
