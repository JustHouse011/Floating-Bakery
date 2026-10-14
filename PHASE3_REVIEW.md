# Phase 3 review — Live cake pricing

Implemented locally on 13 October 2026. The existing local app serves `/cake-designer`; run `npm run dev` or use the portable-runtime commands in README when needed.

## Pricing architecture

`calculateCakeEstimate(configuration, pricingRules)` is a pure TypeScript function. It depends on typed configuration validation and the same `tierDimensions` function used by the cake model, with no React, Zustand or Three.js imports. It validates the pricing configuration before computing anything. All charges, credits, subtotals and totals use safe integer cents; fractional, negative, missing, malformed and overflowing rule amounts are rejected. Money formatting occurs through `Intl.NumberFormat('en-ZA', { currency: 'ZAR', ... })` at the UI / copy boundary.

Results include category subtotals, individual lines, the actual priced tier sizes, an estimated total or an indicative subtotal, pricing version and effective date, manual review reasons, errors and warnings. Invalid inputs receive no numeric total. Pricing rules can be replaced through the dedicated active-rules store without changing the renderer or engine.

## Demonstration rules and assumptions

Version: `demo-2026-10-13.v1`. Effective date: `2026-10-13`. All values and package terms are demonstration assumptions awaiting bakery confirmation.

| Option                                              | Demonstration charge                 |
| --------------------------------------------------- | ------------------------------------ |
| Base 6 / 8 / 10 / 12 inch tier                      | R450 / R650 / R900 / R1,250          |
| Stacking / structure                                | R150 for each additional tier        |
| Vanilla / Chocolate / Red Velvet / Carrot / Lemon   | Included / R70 / R100 / R80 / R60    |
| Buttercream / Fondant / Chocolate Ganache           | Included / R180 / R120               |
| Pearls / ribbon / drip / flowers / topper / message | R80 / R60 / R100 / R180 / R120 / R50 |

Flavour, frosting and decoration amounts initially apply **once per complete cake**, not once per tier. The typed engine also supports an explicitly configured per-tier scope. Stacking always applies per additional tier. The designer's two-inch tier step and six-inch minimum are shared with pricing; incompatible geometry cannot receive a fixed estimate. No shape, colour or delivery surcharge has been invented.

A personalised message is selected by entering valid, non-empty text: Phase 2 already renders that text on its own plaque independently of the star-topper checkbox. Whitespace-only text does not create a plaque or a charge. A message longer than the supported limit cannot be priced.

Generic examples: an eight-inch vanilla buttercream cake is R650; an 8 / 6 inch cake is R1,250 including one stacking fee; a 10 / 8 / 6 inch cake is R2,300 including two stacking fees. A single eight-inch cake with chocolate, fondant, all five decorations and a message is R1,490.

## Catalogue inclusions and double-counting prevention

Catalogue starting prices are unchanged. The pricing module defines an explicit included baseline for each product, which is also used to initialise its designer preset:

| Product                    | Included baseline                                          | Starting price                                    |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Classic Vanilla Cake       | Round 6 inch, vanilla, buttercream                         | R450                                              |
| Chocolate Celebration Cake | Round 6 inch, chocolate, ganache                           | R550                                              |
| Red Velvet Cake            | Round 6 inch, red velvet, buttercream                      | R650                                              |
| Floral Birthday Cake       | Round 8 inch, vanilla, buttercream, flowers                | R850                                              |
| Two-Tier Celebration Cake  | Round 8 / 6 inch, vanilla, buttercream, pearls, stacking   | R1,400                                            |
| Luxury Wedding Cake        | Round 10 / 8 / 6 inch, vanilla, fondant, flowers, stacking | R2,500 indicative only; custom quotation required |

The complete package price replaces its included baseline. Size and tier changes add or credit the difference in actual tier costs; the stacking count is adjusted against the package allowance. Included flavour, frosting and decoration allowances are credited against the chosen options. Removing included options produces explicitly identified negative adjustment lines. Package premiums or discounts remain part of the anchor, so a converted package can differ from the equivalent generic cake. If credits would produce a negative or unsafe total, no price is returned.

For example, the unchanged chocolate package is R550, with no second charge for chocolate or ganache; adding flowers makes it R730. Removing both included flavour and frosting gives explicit credits of R70 and R120. These credit policies need confirmation before real customer use.

New vanilla, chocolate and red velvet selections now initialise at six inches to match their documented starting package. Saved Phase 2 eight-inch designs retain their original dimensions and receive the applicable size difference; restoration never silently shrinks them.

## Designer integration and local saves

The right summary starts with “Your Cake Estimate,” including base cake, additional tiers and structure, flavour, frosting, decorations and total. Included lines and credits are visible. Design details remain available in a native collapsible section. The desktop summary scrolls within the viewport when its receipt is long; mobile shows the current amount above the existing sticky action buttons. Small total transitions respect reduced motion.

The memoised estimate hook derives prices from current configuration and active pricing rules. Price calculation does not run in any 3D component, and estimated totals are not authoritative designer state. Colour and shape changes do not invent fees. The Copy Estimate action recalculates from active rules and includes the business name, complete configuration, itemisation, total / manual-review status, version, effective date and “Estimated Price — Subject to Bakery Confirmation.” Clipboard failures retain the existing manual text-copy fallback.

Storage uses the existing `floating:cake-design` key, with version 2 envelopes. Version 1 designs migrate by adding default review flags and retaining all existing visual selections. Stale stored totals or rule versions are discarded. Version 2 preserves the new review flags. The active rules always determine the restored estimate; there is still one explicit saved configuration per browser and no backend persistence.

## Manual quotations

The wedding package, complex bespoke checkbox and reference-design checkbox require individual review. Their supported selections may have an **indicative subtotal**, while `estimatedTotalCents` remains `null`. Reasons explain that unmodelled bespoke details or matching a reference are outside that amount. The review controls are explicitly non-visual notes. No image upload has been introduced; a future upload workflow must set the reference-review flag.

Unsupported sizes, shapes, tiers, combinations, missing product packages, bad configuration and invalid pricing rules return “Custom Quotation Required” without a numeric estimate. A manual subtotal is never presented as a fixed quote for the complete design.

## Files created

- `src/types/pricing.ts`
- `src/data/cakePricing.ts`
- `src/services/pricingEngine.ts`, `src/services/estimateSummary.ts`
- `src/store/cakePricingStore.ts`
- `src/hooks/useCakeEstimate.ts`
- `src/components/designer/EstimatePanel.tsx`, `MobileEstimate.tsx`
- `src/styles/estimate.css`
- `tests/pricing.test.tsx`
- `PHASE3_REVIEW.md`

## Files modified

- `src/types/cakeDesigner.ts`, `src/data/designer.ts`, `src/services/cakeConfiguration.ts`, `src/store/cakeDesignerStore.ts`: review flags, canonical product presets and validated state actions.
- `src/services/designerStorage.ts`: version 2 saves and version 1 migration.
- `src/utils/currency.ts`: cent-preserving ZAR formatter; existing catalogue formatter preserved.
- `src/components/designer/DesignerControls.tsx`, `DesignerSummary.tsx`, `src/pages/CakeDesigner/CakeDesigner.tsx`: review notes, live estimate, mobile amount and Copy Estimate.
- `src/styles/designer.css`: removed obsolete price-placeholder styles.
- `src/pages/Home.tsx`: one availability note now states that live demo estimates are available; no homepage redesign.
- `scripts/test.mjs`, `tests/designer.test.tsx`: pricing test entry and necessary current-version / current-UI regression expectations.
- `README.md`: current usage, pricing scope and migration documentation.

No dependency changes were needed. Catalogue data and prices, the renderer and existing contact behaviour were preserved. No request submission, email, payment, production backend, deployment or GitHub push was added.

## Validation and performance

- TypeScript passed, including application and test sources.
- ESLint passed without warnings.
- All **72 tests** passed: the existing 22 regressions plus 50 pricing cases covering bases, tiers, scopes, additions, inclusions, credits, manual cases, malformed amounts, integer overflow, migration, restoration under changed rules, currency formatting, copied summaries and server-rendered estimator states.
- Production build passed.
- The original Phase 1 route / enquiry smoke script was rerun and passed separately.
- The existing local designer route and transformed pricing module returned HTTP 200. These are server-readiness checks, not browser interaction verification.
- Browser automation and GPU testing were unavailable. Live click updates, mobile overflow, actual rendered cake / price agreement, browser storage and clipboard permissions, camera interaction and browser console errors remain unverified. Tests use server rendering and simulated storage where noted.
- Bundle review confirmed that the pricing UI and the 3D scene remain separately lazy-loaded. The pricing UI chunk is about 11.46 KB compressed; the scene is about 242.86 KB compressed. The initial storefront JavaScript is about 133.61 KB compressed and does not eagerly download the renderer. The 3D chunk still exceeds Vite's uncompressed 500 KB threshold. Splitting required renderer code further would divide the download without removing it; no warning threshold was suppressed and no model feature was removed.

## Browser review and Phase 4 readiness

Review the designer on desktop and mobile: change tiers, flavour, frosting and every decoration; enter and clear a message; compare the receipt with the visible cake. Confirm a catalogue preset starts at its package price, included choices stay included and upgrades / removals produce the correct adjustments. Save, reset, restore and reload before restoring. Enable both review notes and inspect the indicative-only label. Copy the estimate with and without clipboard permission, then inspect the console.

Phase 4 can use the typed configuration, serialisable estimate, rule version, disclaimer and manual-review reasons in a quotation request snapshot. Reference uploads should set the reference-design review flag. Delivery details, dates, availability checks, image storage and actual request submission are deliberately pending. Active pricing must be recalculated when creating or confirming a quotation; stored totals remain non-authoritative.

Work stops here for Phase 3 review.
