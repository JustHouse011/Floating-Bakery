import { useMemo } from "react";
import { useCakeDesignerStore } from "../store/cakeDesignerStore";
import { useCakePricingRules } from "../store/cakePricingStore";
import { calculateCakeEstimate } from "../services/pricingEngine";
export function useCakeEstimate() {
  const configuration = useCakeDesignerStore((state) => state.configuration);
  const rules = useCakePricingRules();
  return useMemo(
    () => calculateCakeEstimate(configuration, rules),
    [configuration, rules],
  );
}
