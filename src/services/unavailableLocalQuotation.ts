/** Public bundles cannot access historical browser-local customer records. */
export const quotationRepository = {};
export class PricingChangedError extends Error {}
export async function submitQuotation():Promise<never>{throw new Error('Online submissions are temporarily unavailable.');}
