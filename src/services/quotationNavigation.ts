import type { CakeConfiguration } from '../types/cakeDesigner';
import { useCakeDesignerStore } from '../store/cakeDesignerStore';
import { useQuotationDraftStore } from '../store/quotationDraftStore';
import { validateConfiguration } from './cakeConfiguration';
import { readSessionDesign } from './sessionDesign';
import { defaultConfiguration } from '../data/designer';

/** Reuse an open request; explicit design updates keep relevant customer context. */
export function beginQuotation(configuration?: CakeConfiguration) {
  const store = useQuotationDraftStore.getState();
  if (!configuration && store.draft) return;
  let active = useCakeDesignerStore.getState().configuration;
  if (!configuration && typeof window !== 'undefined' && JSON.stringify(validateConfiguration(active)) === JSON.stringify(validateConfiguration(defaultConfiguration()))) {
    try {
      const saved = readSessionDesign(sessionStorage);
      if (saved) { active = saved; useCakeDesignerStore.getState().restoreConfiguration(saved); }
    } catch { /* Unavailable/corrupt session storage must not block a new enquiry. */ }
  }
  const next = validateConfiguration(configuration || active);
  if (store.draft && JSON.stringify(store.draft.configuration) === JSON.stringify(next)) return;
  const previous = store.draft;
  store.start(next);
  if (previous) {
    store.setCustomer(previous.customer);
    store.setEvent(previous.event);
    if (previous.configuration.selectedProductId === next.selectedProductId) store.setReferences(previous.references);
  }
}
