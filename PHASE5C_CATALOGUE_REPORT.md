# Phase 5C — official catalogue integration

Implemented locally, 13 October 2026. No deployment, push, payments, backend or Supabase work. Existing 3D geometry and cake pricing engine are retained.

## Products and exact menu prices

| Product | Pieces | Price |
| --- | ---: | ---: |
| Fudge Brownies | 12 | R310 |
| Chocolate Chip Cookies | 12 | R240 |
| Chocolate Cheesecake Brownies | 12 | R420 |
| Chocolate Éclairs | 12 | R300 |
| Cream Puffs | 12 | R320 |
| Profiteroles | 12 | R380 |
| Chouquettes | 12 | R240 |
| Palmiers | 12 | R220 |
| Madeleines | 12 | R260 |
| Plain Scones | 5 / 10 / 20 | R300 / R550 / R980 |
| Raisin Scones | 5 / 10 / 20 | R380 / R650 / R1,100 |
| Chocolate Chip Scones | 5 / 10 / 20 | R400 / R700 / R1,200 |

Twelve stable product IDs match their filename slugs. Each official product has a description, category, photograph, explicit pieces unit, exact integer-cent quantity options, availability configuration, demonstration flag false and designer eligibility false. Six sample cakes remain identified as demonstration products. Availability means enquiry permitted, not stock or booking confirmation.

## Photography and logo

Inspected both menus and the duplicate Sweet Treats file. Extracted nine Sweet Treats photos plus plain/chocolate-chip scones as native-resolution WebP assets under `public/images/catalogue/`. No menu borders, prices or captions remain in the food crops. Original source files remain unchanged; extraction coordinates, original SHA-256 hashes and output sizes are in `EXTRACTION.json`. Cards use 4:3 containment rather than stretching or cutting food to fit.

Raisin Scones reuse the supplied plain-scone photograph, disclosed on both card and detail page. No distinct raisin photo was supplied. Existing illustrative cake images are retained for demonstration cakes only.

The owner explicitly selected **Sweet Treats FB&C logo**. It is cropped from the supplied artwork for header/footer, without redrawing; both source treatments remain preserved and linked from administration settings. The original artwork clips the top of this logo, which is preserved rather than reconstructed. Native source crops are approximately 311–412 pixels wide; larger original photos and a standalone logo export remain desirable.

## Catalogue, pricing and branding

The existing `/cakes` catalogue now covers Custom Cakes, Brownies, Cookies, Pastries, Scones and Catering, with combined search/category filters. Legacy cake categories map to Custom Cakes for public display without rewriting owner category edits. Catering has no invented product or price list; the existing catering page remains available.

Product details show supplied photography, description, supported quantities, exact price/unit and Request Quote. Scones start without a selection; choosing 5/10/20 immediately updates price. Dozen products use the fixed 12-piece amount. Unsupported quantities never extrapolate. Non-cakes have no designer link. Currency remains ZAR, formatted with the existing display locale.

Homepage featured-product wording also distinguishes official quantity prices from demonstration cakes, so featuring a real catalogue product does not relabel its price as a demonstration.

Cream/chocolate/blush/gold styling retains the editorial layout. Supplied phone, email, location, website and Freshness in Every Bite tagline are displayed. No street address is invented. New admin workspaces use supplied contact defaults; existing owner settings are preserved, with supplied fallback contact information shown where legacy fields are blank. Delivery available at an additional cost is disclosed; no delivery rate is invented.

## Persistence and administration

Database version 3 adds only `productEnquiries`; existing cake quotation/reference/audit stores are not rewritten. Workspace metadata `catalogueVersion: 1` controls a one-time merge of missing official IDs. Existing matching products, descriptions, prices, archive/featured flags, cake pricing and contact edits remain intact. A migrated workspace increments revision for stale-tab protection. Further loads do not reseed deleted/edited products.

Official products can edit descriptions, photographs, quantity/price options, availability and featured flags, and can be archived/restored. Preview displays the proposed photograph, description, categories and all price options without publishing. Publishing persists changes; modifying the form after preview requires another preview. Cake product management remains on its existing path. Quantity-based products never acquire synthetic cake packages; cake rule publication preserves their independent prices.

The existing explicitly confirmed Reset demonstration data action includes new product enquiries. Automated reset tests use isolated test-created records; no owner data was reset.

## Quotation integration

`CatalogueProduct`, fixed-quantity integer-cent pricing and `ProductEnquiryRecord` distinguish catalogue products from cake configurations. Customer requests use `/product-enquiry/:id`; saved records reopen at `/product-enquiries/:id`. Customer/contact/date/delivery validation reuses existing quotation validators and current policy. Review shows the selected product and quantity. A product/policy change before saving requires another review.

An immutable snapshot stores the full product, all original quantity prices, chosen quantity/price, contact/event details and policy. Delivery fee is null and requires bakery confirmation. Later price/description/archive changes cannot mutate a saved enquiry. Submissions remain browser-local, explicitly unsent enquiries rather than purchases. Existing custom cake snapshots and calculation logic are preserved.

The admin quotations page includes searchable Bakery product enquiries with links to original snapshots. Existing cake statuses, audit, calendar and reports remain unchanged and cover cake requests; product enquiries are shown separately and do not inflate cake reports or revenue estimates.

## Validation and evidence

Final command and browser results are recorded in `.tools/phase5c-*.log` and ignored `qa/evidence/` outputs. All 168 previous test cases are retained, with old six-product/blank-contact/database-version assertions updated to the requested 18 products, supplied contacts and version 3. Twenty new regressions cover exact menu prices, unsupported quantities, availability, image assets, search/categories, explicit selection, seed merge preservation, immutable snapshots and admin persistence.

Initial failures were investigated: obsolete seed/contact/schema expectations; an intentionally tampered readonly snapshot test needed a cloned object; catalogue select locators needed the accessible combobox role; locale prices use spaces, not mandatory commas. Vite also watched generated Playwright HTML traces, causing reloads and a stalled server. Generated QA artifacts are now excluded from Vite watching and Tailwind scanning is limited to `src`. The verified workspace Vite process was restarted; no unrelated browser processes were terminated. The extraction tool now reads local source bytes directly, avoiding both page resource loading and SVG-document canvas namespace problems.

Final verification:

- **188 unit/integration cases pass**, including all 168 retained cases and twenty new catalogue regressions. TypeScript and source lint pass.
- Production build passes; the unchanged lazy Three scene remains 901.07 KB / 243.70 KB gzip and retains its documented bundle warning. Final artifacts are recorded in `.tools/phase5c-build-verified.log`.
- **25 unique Chrome cases pass across the primary and targeted reruns**: four desktop/mobile catalogue/enquiry cases, nine existing desktop cake/admin/GPU cases, and twelve layout/Axe cases at 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 and 360×800. This is not a claim of one clean combined 25-case run. Real desktop GPU checks cover 54 decorated configurations plus orbit/reset/context-loss recovery.
- All twelve official product image elements loaded real WebP photos; local asset tests check actual WebP signatures. The eleven photographs total **197,356 bytes**, plus the 8,942-byte supplied logo crop. Source hashes remain unchanged.
- Visual review caught a footer inheritance defect despite no page overflow: contact paragraphs were laid out horizontally and became narrow columns. A dedicated contact block fixes it. `scripts/qa-catalogue-layout.mjs` checks readable paragraph widths at all six sizes and captures final footer evidence.

Browser evidence: `qa/evidence/playwright-results-phase5c-reviewed.json` (catalogue cases), `playwright-results-phase5c-enquiry-review.json` (both enquiry/publication journeys), `playwright-results-phase5c-regression.json` plus `playwright-results-phase5c-cake-review.json` (existing cake paths), and `playwright-results-phase5c-responsive.json` (all twelve responsive cases). Corresponding HTML reports/traces preserve initial failures. `qa/evidence/final/*phase5c*.png` contains catalogue/detail/confirmation/admin captures; `qa/evidence/phase5c/footer-layout.json` and footer PNGs contain final contact-layout evidence. Earlier full-page screenshots retain the pre-repair footer; the final footer captures supersede that portion.

Additional harness repairs: matching the displayed arrow in Request Quote's accessible name, using the accessible textbox role for a prefilled description, and waiting for the cake detail URL/heading before selecting its designer link. Existing cake assertions were retained. Early piece-based catalogue records without quantity-unit metadata are normalised in a copied value without changing owner prices or overwriting stored records.

## Remaining limitations and review

Browser-only persistence; no request is sent to the bakery. Physical phones, Firefox/WebKit, screen readers and physical printing remain outside this environment's verification. A distinct raisin photo, higher-resolution images and an unclipped original logo would improve visual fidelity. Delivery prices and the official cake price list remain outstanding. Cake prices remain demonstrations; product enquiry totals exclude delivery. Product enquiries currently have separate read-only admin snapshot listings, without cake status/audit/report integration. The existing large Three bundle warning remains documented.

Review locally at http://127.0.0.1:5173/cakes and `/admin/products`. Work stops for review after validation. No Phase 6 implementation, deployment or push.
