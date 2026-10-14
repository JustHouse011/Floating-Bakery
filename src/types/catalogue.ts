import type { Product } from './index';
import type { CustomerDetails, EventDetails, QuotationRequestPolicy, QuotationRecord } from './quotation';

export interface ProductEnquiryRecord {
  readonly kind: 'catalogue';
  readonly version: 1;
  readonly id: string;
  readonly reference: string;
  readonly createdAt: string;
  readonly customer: CustomerDetails;
  readonly event: EventDetails;
  readonly snapshot: {
    readonly product: Product;
    readonly pieces: number;
    readonly priceCents: number;
    readonly currency: 'ZAR';
    readonly pricingKind: 'fixed-quantity';
    readonly deliveryFeeCents: null;
    readonly disclaimer: string;
    readonly requestPolicy: QuotationRequestPolicy;
  };
  readonly localOnly: true;
}
export type BakeryQuotation = ProductEnquiryRecord | (QuotationRecord & { kind?: 'cake' });
