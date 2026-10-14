import { useMemo } from "react";
import { useBakerySettings } from "../store/adminStore";
import { quotationRequestPolicy } from "../data/quotation";
import {IS_PUBLIC_SITE} from '../config/siteMode';
export function useQuotationPolicy() {
  const settings = useBakerySettings();
  return useMemo(
    () => ({
      ...quotationRequestPolicy,
      ...(IS_PUBLIC_SITE ? {maximumImageBytes:512*1024,maximumTotalImageBytes:1536*1024} : {}),
      minimumLeadDays: settings.minimumLeadDays,
      deliveryAreas: settings.deliveryAreas,
      businessDisclaimer: settings.disclaimer,
      collectionInstructions: settings.collectionInstructions,
    }),
    [settings],
  );
}
