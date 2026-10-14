import { useCakeEstimate } from "../../hooks/useCakeEstimate";
import { formatZARCents } from "../../utils/currency";
import { formatPriceRange } from '../../services/officialCakePricing';
import {IS_PUBLIC_SITE} from '../../config/siteMode';
export default function MobileEstimate() {
  const estimate = useCakeEstimate();
  if(IS_PUBLIC_SITE&&estimate.pricingMode!=='official-range')return <span className="mobile-estimate"><strong>Bakery quotation required</strong></span>;
  if (estimate.pricingMode === 'official-range') return <span className="mobile-estimate official-mobile-range" aria-live="polite"><span>Estimated range<small>Awaiting bakery confirmation</small></span><strong>{formatPriceRange(estimate.minimumEstimateCents!, estimate.maximumEstimateCents!)}</strong></span>;
  const total = estimate.estimatedTotalCents ?? estimate.indicativeTotalCents;
  return (
    <span className="mobile-estimate">
      <span>
        {estimate.manualQuotationRequired
          ? "Custom Quotation Required"
          : "Estimated total"}
        <small>
          {estimate.manualQuotationRequired
            ? "Supported selections only · subject to bakery confirmation"
            : "Demo · subject to bakery confirmation"}
        </small>
      </span>
      <strong>
        {total === null ? "Review needed" : formatZARCents(total)}
      </strong>
    </span>
  );
}
