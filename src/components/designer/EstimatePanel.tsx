import { motion, useReducedMotion } from "framer-motion";
import { useCakeEstimate } from "../../hooks/useCakeEstimate";
import { formatZARCents } from "../../utils/currency";
import { ESTIMATE_DISCLAIMER } from "../../services/estimateSummary";
import type { PriceCategory, CakeEstimate } from "../../types/pricing";
import "../../styles/estimate.css";
import { formatPriceRange, OFFICIAL_PRICE_NOTICE } from '../../services/officialCakePricing';
import {IS_PUBLIC_SITE} from '../../config/siteMode';
const groups: { key: PriceCategory; label: string }[] = [
  { key: "base", label: "Base cake" },
  { key: "tiers", label: "Additional tiers" },
  { key: "flavour", label: "Flavour" },
  { key: "frosting", label: "Frosting" },
  { key: "decorations", label: "Decorations" },
];
export function EstimateReceipt({ estimate }: { estimate: CakeEstimate }) {
  const reducedMotion = useReducedMotion();
  if(IS_PUBLIC_SITE&&estimate.pricingMode!=='official-range')return <section className="estimate-panel" aria-label="Your Cake Estimate"><h3>Your cake quotation</h3><p>Choose an official catalogue cake for its approved price range, or ask the bakery for a bespoke quotation.</p><p>Final pricing, delivery and availability require confirmation.</p></section>;
  if (estimate.pricingMode === 'official-range') return <section className="estimate-panel" aria-label="Your Cake Estimate"><span className="eyebrow">OFFICIAL CATALOGUE RANGE</span><h3>Your cake estimate</h3><div className="estimate-total" aria-live="polite" aria-atomic="true"><span>Estimated range</span><strong>{formatPriceRange(estimate.minimumEstimateCents!, estimate.maximumEstimateCents!)}</strong></div><ul>{estimate.breakdown.map(line => <li key={line.key}>{line.label}: {line.included ? 'Included' : formatZARCents(line.amountCents)}<small>{line.note}</small></li>)}</ul><p>{OFFICIAL_PRICE_NOTICE}</p><p>No automatic size, tier, frosting or decoration surcharges. Delivery and any additional charges need explicit confirmation.</p><p className="estimate-version">Pricing {estimate.pricingRuleVersion}</p></section>;
  const total = estimate.estimatedTotalCents ?? estimate.indicativeTotalCents;
  return (
    <section className="estimate-panel" aria-label="Your Cake Estimate">
      <span className="eyebrow">THOUGHTFULLY PRICED · DEMO</span>
      <h3>
        Your Cake <em>Estimate</em>
      </h3>
      {estimate.breakdown.length > 0 && (
        <div className="estimate-breakdown">
          {groups.map((group) => {
            const lines = estimate.breakdown.filter(
              (line) => line.category === group.key,
            );
            return (
              <div className="estimate-group" key={group.key}>
                <h4>{group.label}</h4>
                {lines.length ? (
                  <ul>
                    {lines.map((line) => (
                      <li key={line.key}>
                        <span>
                          <span>{line.label}</span>
                          {line.note && <small>{line.note}</small>}
                        </span>
                        <strong>
                          {line.included
                            ? "Included"
                            : formatZARCents(line.amountCents)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="estimate-included">
                    {group.key === "tiers"
                      ? "Single tier — no stacking needed"
                      : "No extras selected"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      {estimate.manualQuotationRequired && (
        <div className="manual-quotation" role="status">
          <h4>Custom Quotation Required</h4>
          <ul>
            {estimate.manualQuotationReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {total !== null && (
            <p>
              This indicative amount covers supported selections only. The
              complete design needs a bakery quotation.
            </p>
          )}
        </div>
      )}
      <div className="estimate-total" aria-live="polite" aria-atomic="true">
        <span>
          {estimate.manualQuotationRequired
            ? "Indicative amount only"
            : "Estimated total"}
        </span>
        <motion.strong
          key={`${total}-${estimate.manualQuotationRequired}`}
          initial={reducedMotion ? false : { opacity: 0.6, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
        >
          {total === null ? "Awaiting bakery review" : formatZARCents(total)}
        </motion.strong>
      </div>
      <p className="estimate-disclaimer">{ESTIMATE_DISCLAIMER}</p>
      <p className="estimate-warning">
        Demonstration prices. Delivery, special reference details and
        availability are not included.
      </p>
      <p className="estimate-version">
        Pricing {estimate.pricingRuleVersion}
        <br />
        Effective{" "}
        <time dateTime={estimate.effectiveDate}>
          {estimate.effectiveDate || "unavailable"}
        </time>
      </p>
    </section>
  );
}
export default function EstimatePanel() {
  const estimate = useCakeEstimate();
  return <EstimateReceipt estimate={estimate} />;
}
