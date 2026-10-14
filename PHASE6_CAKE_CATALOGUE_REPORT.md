# Phase 6 — client cake catalogue, official ranges and designer integration

13 October 2026. Implemented locally at http://127.0.0.1:5173. No deployment, GitHub push, Supabase, payments, live email or subsequent development phase. Existing pricing, Three.js architecture, browser storage and administration remain in place.

## 1. Source photographs discovered

The specified folder contains **56 supported image files**: **44 new client JPGs** named `IMG-20261013-WA*.jpg`, plus the **12 existing Phase 5C WebP assets**. Thus the whole-folder count exceeds 44, while the client cake source count is exactly 44. The old assets were neither mistaken for new cakes nor replaced. All 44 originals decode successfully; none are corrupt or unsupported.

`public/images/catalogue/CAKE_IMAGE_INVENTORY.json` records every filename, original URL, dimensions, byte size, SHA-256 hash, product association, cover/gallery role, crop and derivative. Original files were not renamed, deleted or overwritten; the processing script verifies their hashes remain unchanged.

## 2. Catalogue products created

**43 official cake products represent all 44 photographs**. Together with twelve official non-cake products and six retained demonstration cakes, the initial workspace has 61 products. Stable `cake-wa-XXXX` IDs anchor the supplied cakes; descriptive slugs and names, primary/secondary categories, descriptions, galleries, source references, flavour availability, visibility, featured order and date added are stored in typed product records. New admin-created cakes use existing UUID product IDs.

Names describe visible colours, flowers, toppers and themes. They do not establish ingredients, dimensions or servings. Descriptive names/categories require bakery approval and are recorded in review notes. Product detail URLs continue using stable identifiers to preserve the existing routing architecture; slugs remain editable metadata.

## 3. Duplicates and gallery handling

There are **44 distinct content hashes and no byte-identical duplicates**. WA0014 and WA0020 confidently show the same gold-sculpture cake design and share one product: WA0014 is the cover and WA0020 is its gallery image. Both originals, derivatives and inventory entries remain accessible. Similar themes were not otherwise collapsed. Every source is represented by a cover or gallery; no photograph was silently discarded.

## 4. Product categories

Primary categories: Birthday Cakes, Kids' Cakes, Luxury Cakes, Floral Cakes, Graduation Cakes and Custom Celebration Cakes. Optional secondary categories participate in filtering. Brownies, Cookies, Pastries, Scones and Catering remain compatible. Featured cakes and All cake designs controls expose curated and complete cake views. Search and category filtering combine, exclude archived/hidden products, and prioritise real client cakes. Homepage links open relevant categories. Catalogue copy distinguishes official cake ranges from legacy demonstration prices; filter touch targets are at least 44px.

Six historical demonstration products are retained and clearly labelled, after real cakes in the public catalogue. They were not automatically archived because this phase did not audit every user-owned quotation/manual saved-design reference or authorise replacement of owner edits. Their identifiers and demonstration estimator remain available. The seeded homepage's six featured cakes and new showcases use actual client photography.

## 5. Image optimisation

| Asset set | Bytes | Comparison |
| --- | ---: | --- |
| 44 original JPGs | 5,910,954 | Preserved |
| 44 detail WebPs | 5,528,248 | 6.5% smaller; native resolution retained except explicit crops |
| 44 thumbnail WebPs | 1,716,100 | 71.0% smaller than originals |

There are **88 derivatives** under `public/images/cakes/client/`, including derivatives for the secondary gallery photograph. Responsive sources advertise actual widths; thumbnails do not distort proportions. Catalogue frames contain complete cake photographs, and official-image overlays do not cover the supplied branding. Detail/reference photographs use containment. Images load lazily, show a neutral loading background and have a graceful fallback; failing responsive sources are cleared when falling back.

Two conservative crops remove unambiguous non-cake boundaries: WA0017's mobile gallery screenshot and WA0044's black letterboxing. Cake details, existing logos and watermarks remain. WA0017's small visual-search overlay inside the photograph is retained rather than retouched; its review note flags this. Both complete originals remain available in administration/source inventory.

Reproduction/verification: `scripts/qa-cake-inventory.mjs`; attribution: `public/images/catalogue/CAKE_ATTRIBUTION.md`. It verifies all original hashes, all 88 derivative decodes/dimensions, and complete source/gallery coverage. The asset work used original pixels, not stock replacements or generative reconstruction.

## 6. Confirmed pricing configuration

All client designs share the **R1,480–R1,950 vanilla base range**. Cards display From R1,480 using the existing ZAR locale; details, designer, request review and saved quotations show a range. No midpoint or final amount is manufactured.

| Flavours | Surcharge once per complete cake |
| --- | ---: |
| Vanilla | Included, R0 |
| Chocolate; Marble (Chocolate & Vanilla); Vanilla Caramel; Red Velvet; Vanilla Coconut; Lemon Poppyseed; Doughnut; Orange; Vanilla Cinnamon; Strawberry | R180 |
| Carrot; Lemon Poppyseed Blueberry; Chocolate Caramel; Chocolate Bar One | R220 |

Internally all calculations use integer cents. Vanilla: R1,480–R1,950; standard flavour: R1,660–R2,130; premium flavour: R1,700–R2,170. These fees are independent of size, tiers, shape, frosting, visible decorations and complexity. No automatic delivery charge or arbitrary additional charge was introduced.

## 7. Pricing-engine changes

`CakePricingRules.officialCatalogue`, typed `OfficialFlavour` and explicit `official-range` estimates extend the existing engine. A registered official product takes the range branch before demonstration tier/decorative pricing. Estimates keep minimum/maximum cents, a once-only flavour line, version/effective date and confirmation notices. Fixed/indicative total fields remain null until a separate manual confirmation exists.

Existing configurable demonstration estimates retain their formulas. Non-cake quantity prices remain independent. Legacy pricing publication preserves active official rules; official publication changes only its own configuration and appends the preceding version to history. Invalid ranges/surcharges, nonzero included vanilla and unsafe amounts are rejected. Accepted configurations without separate official flavour metadata use the same flavour resolution in the engine and snapshot, avoiding inconsistent totals.

## 8. 3D Cake Designer integration

All 43 product records—including the grouped 44th photograph—are designer eligible. Detail selections carry product ID, flavour and personalisation notes into the existing store; direct card selection loads its reference and vanilla range. Restoring/navigating does not overwrite the detail-selected flavour/notes. Desktop retains controls left, live 3D centre and reference/estimate right. Mobile shows the 3D preview, reference/estimate and collapsible controls with a visible range/request toolbar.

The actual photograph is explicitly labelled the design reference. The existing procedural scene remains a conceptual preview and does not claim to recreate elaborate characters or sugar craft. Existing supported shapes, tier compatibility, colours, finishes, decorations, rotation, zoom/reset, demand rendering and renderer-error recovery remain. No image-to-3D reconstruction or new Three.js architecture was introduced.

## 9. Quotation workflow

The existing multi-step cake request now captures immutable official metadata: product ID/name, photograph path/category, flavour/surcharge, minimum/maximum base and estimate, personalisation instructions, supported configuration and official pricing version. Existing customer/event/collection/delivery data and uploaded references remain in the original model. Range announcements/reference photographs appear during request review and on confirmation.

Snapshots remain frozen and are checked against their own saved rules, never repriced against the active version. Product/photo/price changes do not rewrite old requests. Existing historical records without official metadata remain valid. The range status is preserved as the original estimate; separate appended confirmations show manually quoted fixed amounts or awaiting confirmation. Requests are browser-local, unsent and never described as confirmed purchases.

## 10. Administration enhancements

Cake management supports create/edit, categories, cover selection from the supplied-photo datalist, gallery/source paths, descriptions, visibility/archive, featured flags and ordering. An expandable inventory exposes all 44 unchanged originals. Cake changes can be previewed before local publication. Changing a cover clears old responsive metadata so the previous thumbnail cannot replace the chosen image. Reloading does not reseed edited or hidden products. The homepage selects the first six featured designs by its priority/order.

Official pricing management shows the approved range, all fifteen flavour fees, range previews, versioned publication and historical configurations. The vanilla base range is displayed rather than editable per product; the confirmed policy is not replaced by photo-specific prices.

Official quote confirmation requires an entered base amount within the currently approved range, a documented reason, and explicit approval of positive additional charges. An out-of-range base requires a separate explicit reasoned override. Confirmation uses the request's frozen flavour fee once, preserving the customer's original pricing even after new publication. It records approved-base pricing and frozen-flavour pricing versions separately.

Confirmed total = entered base + original flavour surcharge + approved additions. Each revision is appended with timestamp, original range, amounts, reason/override and Quoted status. Prior revisions/original snapshots are preserved. The request moves to Quoted through permitted review transitions, never automatically Approved. Subsequent confirmations append history. Public saved-request pages display this separate history. Generic prepared revision entry is disabled for official range requests; the controlled confirmation path supplies their fixed amount.

IndexedDB **version 4** adds `officialConfirmations` without rewriting existing quotation/reference/audit/product-enquiry stores. A one-time `cakeCatalogueVersion` merge adds only missing client IDs and preserves existing products, flags, legacy rules, official policy/history and contact settings. No user-owned database was reset. The existing explicitly confirmed reset feature remains, including its new confirmation store; reset tests run only in disposable contexts.

## 11. Files modified

New data/assets: `src/data/clientCakeCatalogue.ts`, all 88 derivatives, `public/images/catalogue/CAKE_IMAGE_INVENTORY.json`, `CAKE_ATTRIBUTION.md` and `scripts/qa-cake-inventory.mjs`.

Types/services: `src/types/officialCake.ts`, existing Product/Configuration/Pricing/Quotation/Admin types, `officialCakePricing.ts`, `officialConfirmations.ts`, existing pricing engine, configuration validation, quotation snapshot/record normalisation, estimate summary, admin repository and local database.

Application: designer/admin stores; `OfficialCakeDetail.tsx`; existing Cakes/Home, ProductCard/BakeryImage, controls/summary/estimate/mobile estimate, quotation request/summary/confirmation; new `OfficialConfirmationHistory.tsx`, `Admin/OfficialPricing.tsx` and `Admin/OfficialConfirmation.tsx`; existing admin configuration/quotation pages and shared styles.

QA/build: `tests/officialCake.test.tsx`, retained test assertion/setup updates, test runner, `e2e/officialCake.spec.mjs`, `officialCakeAdmin.spec.mjs`, existing catalogue/helper schema assertions, Playwright project registration and Vite's catalogue-data chunk. No production test dependencies or hosting configuration were added. Documentation: this report and README.

## 12. Automated validation

**222 unit/integration tests pass**: all 188 prior cases retained plus 34 official catalogue regressions. Earlier seed-count/schema assertions now reflect 61 products and version 4. The live-featured-product regression explicitly selects its tested product for the capped homepage rather than dropping its assertion.

Coverage includes 44-source completeness/hash uniqueness, group/gallery handling, IDs/categories/assets, all fifteen exact flavour fees, once-only range pricing, no geometry surcharges, legacy isolation, invalid rules, notes/flavour normalisation, search/filter/navigation, immutable snapshots, controlled amount/addition/override validation, stale-version rejection, repeated confirmations, and idempotent migration preserving owner data.

TypeScript, ESLint, production build and nine-route/local-enquiry smoke checks pass. Final logs: `.tools/phase6-typecheck-final.log`, `phase6-lint-final.log`, `phase6-tests-final.log`, `phase6-smoke.log`, `phase6-build-final.log`.

Investigated failures: official snapshot normalisation initially omitted its new metadata; migrated raw cake seeds lacked archive defaults. Both defects were repaired and regression tests pass. Browser harness corrections used the actual 3 tiers label, GPU calls property, datalist combobox role, correct quotation steps and a new required reason for each confirmation revision. No prior test was removed to force a pass.

## 13. Browser verification

**All 40 Chrome cases passed in the complete regression run** (`.tools/phase6-browser-regression.log`, `qa/evidence/playwright-results-phase6-regression.json` and corresponding HTML report/traces). This includes six new official desktop/mobile cases, prior cake/admin/non-cake/storage-error workflows and twelve responsive/Axe cases. Sizes: 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 and 360×800. Six new cases also passed separately before the full run.

After the final catalogue filters and range labels changed, all 18 affected responsive and official workflow cases passed again (`.tools/phase6-browser-handover.log`). The final Copy Estimate correction exports the official flavour, product name and personalisation notes; both desktop and mobile quotation journeys passed with clipboard assertions (`.tools/phase6-browser-export.log`, `qa/evidence/playwright-results-phase6-export.json`). Newly created admin cakes use the current South African date. Type checking, lint, all 222 unit/integration cases and the production build passed on this final source.

All 43 cover photographs load, the 44th gallery switches correctly, and all 44 original URLs respond. Flavour changes update ranges; product/flavour/photo/notes reach the real renderer and saved request. Admin price publication preserves original snapshots, out-of-range confirmation rejects without override, approved charges calculate correctly and two confirmations persist. Cover/category/gallery/featured/visibility edits survive reload without reseeding.

Real GPU tests rendered **108 decorated configurations** (54 desktop, 54 mobile emulation), plus orbit/zoom/reset/context-loss recovery. Renderer evidence reports ANGLE Intel UHD Graphics, Direct3D11; decorated memory remains bounded at four textures. New official journeys additionally verify actual WebGL draw calls and unchanged ranges after geometry/decorative changes. Mobile is emulation on this desktop GPU, not physical-phone verification.

Evidence: `qa/evidence/final/*phase6*.png`, desktop/mobile GPU matrices, and `qa/evidence/phase6/contact-*.jpg` inspection sheets. Inventory/verification output is authoritative for source hashes and derivative sizes. Evidence is local and ignored by version control.

## 14. Performance and remaining limitations

| Final bundle | Minified | Gzip |
| --- | ---: | ---: |
| Main application | 491.46 KB | 155.67 KB |
| Client cake data | 58.68 KB | 4.55 KB |
| Lazy 3D scene | 901.08 KB | 243.71 KB |

Separating actual catalogue metadata moved the main below 500 KB (the unsplit Phase 6 main was 549.51 KB), creating a separately cacheable data chunk. This does not claim a reduction in aggregate download bytes. Three remains dominant in the lazily loaded scene; Phase 5B's prior contribution analysis and measured instancing/resource fixes are retained. Its warning is still visible, with no threshold increase or speculative renderer rewrite. No FPS, physical-phone, battery/heat or cold-network improvement is claimed.

Physical iPhone/Android, Firefox/Safari/WebKit, full screen-reader/zoom/forced-colour testing and physical print output remain unverified. Google Fonts and remaining non-cake illustrative catering/About resources can still require internet. The prototype has no production authentication, server delivery, backup, payment or availability guarantee. Public routes use stable IDs; slugs are metadata. Admin gallery management uses supplied paths/URLs rather than a media-upload service.

Reference snapshots retain photograph paths rather than duplicate asset bytes; the original files and derivatives must remain available for historical reference. Reports retain their existing original-estimate semantics: ranges are not converted into fictitious fixed totals/revenue. Confirmation amounts are presented in their separate history, not silently substituted into original estimates.

## 15. Client confirmation and readiness

Review descriptive names/categories, the WA0014/WA0020 grouping and screenshot crops, including the retained WA0017 overlay. Confirm any physical size/serving/ingredient specifications, exact recreation feasibility, availability and delivery rates; none were inferred or invented. Review old demonstration products against user-owned quotation/saved-design references before deciding to archive them. Production permissions/override authority and remote persistence remain future work, not part of this local phase.

The local implementation is ready for review with automated validation passing. No known critical defect remains in the tested scope. Physical-device and client-content review remain outstanding. Development server stays available at http://127.0.0.1:5173. No push, deployment, backend integration or subsequent phase was started.
