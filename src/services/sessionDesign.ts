import type { CakeConfiguration } from "../types/cakeDesigner";
import { validateConfiguration } from "./cakeConfiguration";
import type { StorageAdapter } from "./designerStorage";
export const SESSION_DESIGN_KEY = "floating:session-cake-design";
export function readSessionDesign(
  storage: StorageAdapter,
  productId?: string | null,
): CakeConfiguration | null {
  const raw = storage.getItem(SESSION_DESIGN_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (value?.version !== 1) throw new Error("Unsupported session design");
  const configuration = validateConfiguration(value.configuration);
  if (
    productId &&
    productId !== value.originProductId &&
    productId !== configuration.selectedProductId
  )
    return null;
  return configuration;
}
export function writeSessionDesign(
  config: CakeConfiguration,
  storage: StorageAdapter,
  originProductId?: string | null,
) {
  storage.setItem(
    SESSION_DESIGN_KEY,
    JSON.stringify({
      version: 1,
      originProductId,
      configuration: validateConfiguration(config),
    }),
  );
}
