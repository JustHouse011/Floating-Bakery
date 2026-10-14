import type { CakeConfiguration } from "../types/cakeDesigner";
import { validateConfiguration } from "./cakeConfiguration";
export const DESIGN_STORAGE_KEY = "floating:cake-design";
export const DESIGN_STORAGE_VERSION = 3;
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function saveDesign(
  config: CakeConfiguration,
  storage: StorageAdapter = localStorage,
): void {
  storage.setItem(
    DESIGN_STORAGE_KEY,
    JSON.stringify({
      version: DESIGN_STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      configuration: validateConfiguration(config),
    }),
  );
}
export function restoreDesign(
  storage: StorageAdapter = localStorage,
): CakeConfiguration {
  const raw = storage.getItem(DESIGN_STORAGE_KEY);
  if (!raw) throw new Error("No saved design was found on this browser.");
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved design could not be read. Save a new design to replace it.",
    );
  }
  if (
    typeof saved !== "object" ||
    saved === null ||
    !("version" in saved) ||
    (saved.version !== 1 && saved.version !== 2 && saved.version !== DESIGN_STORAGE_VERSION) ||
    !("configuration" in saved)
  )
    throw new Error("This saved design version is not supported.");
  try {
    if (saved.version === 1) {
      if (
        typeof saved.configuration !== "object" ||
        saved.configuration === null ||
        Array.isArray(saved.configuration)
      )
        throw new Error("Invalid saved design");
      return validateConfiguration({
        ...saved.configuration,
        quotationRequirements: {
          complexBespoke: false,
          referenceDesign: false,
        },
      });
    }
    return validateConfiguration(saved.configuration);
  } catch {
    throw new Error(
      "The saved design contains invalid options. Save a new design to replace it.",
    );
  }
}
