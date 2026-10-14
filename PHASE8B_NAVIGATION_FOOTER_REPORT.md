# Phase 8B — Navigation and footer refinement

## Implementation

Public navigation now has Home / About / Catalogue on the left, the existing bakery logo in the centre, and Catering / Cake Designer / Contact / Request a Quote on the right. The white footer has brand/location, EXPLORE and GET IN TOUCH columns, followed by dynamic copyright and the exact developer credit.

The prompt attachment contained no footer reference image. Its written three-column composition guided the implementation; no visual comparison against an unavailable image is claimed.

## Changed files

- `src/components/layout/Layout.tsx`: split navigation groups, centred logo, coherent mobile breakpoint, logo/menu closing and shared footer component.
- `src/components/layout/SiteFooter.tsx` (new): brand/location, seven sitemap links, real contact links and exact developer credit.
- `src/styles/navigation-footer.css` (new): header grid, responsive drawer, white footer layout and restrained hover effects.
- `src/pages/Home.tsx`: removed the testimonial import and entire sample review section.
- `src/data/testimonials.ts` (deleted): unreferenced sample data, not customer records.
- `src/styles/index.css`: removed unused testimonial/grid/quote-mark styles, including responsive variants.
- `src/components/layout/PublicInteractions.tsx`: includes the footer grid in the existing scroll reveal observer.
- `e2e/navigationFooter.spec.mjs` (new): centring, overlap, link, footer, credit, accessibility and menu checks.
- `e2e/workflow.spec.mjs`: scopes the retained Request a Quote focus assertion to the main navigation now that the footer also provides that link.
- `playwright.config.mjs`: includes the new checks, adds a 1280-pixel navigation project and includes small-screen footer checks at 320 pixels.
- `scripts/qa-catalogue-layout.mjs`: audits the new footer grid rather than the removed legacy contact block, checking readable column widths and overflow; writes new evidence under `qa/evidence/phase8b`.
- `README.md` and this report: review information.

Diagnostic scripts/logs under `.tools/` and screenshots/results under `qa/evidence/` are local QA artifacts.

## Testimonials removal and routes

There was one sample homepage section, one sample data file and a `/#testimonials` navigation entry. All have been removed. The unused CSS was removed as well. A source scan finds no testimonial references in `src`.

There was no dedicated testimonial page, carousel, component or registered `/testimonials` route. That path continues through the existing “A little detour” not-found handler, verified in Chrome. All sitemap/navigation links use existing destinations; no replacement route was invented. Saved enquiries, quotations and other historical records were not deleted or reset.

## Logo centring and navigation

Desktop uses CSS Grid with **`minmax(0, 1fr) auto minmax(0, 1fr)`**, equal gaps and symmetric header padding. The left and right groups occupy their explicit side columns; the logo occupies column two. Their unequal content widths therefore do not affect the logo centre. One existing semantic main-navigation landmark contains both groups.

The real asset remains **`/images/catalogue/official-logo.webp`**, 287 × 266 pixels. It links home, has the bakery's accessible alternative text and retains its proportions through `object-fit: contain`; no asset was generated, replaced or recompressed. A tiny hover scale does not change layout.

Measured logo centres:

| Viewport | Logo centre | Viewport centre |
| ---: | ---: | ---: |
| 1440 | 720 | 720 |
| 1280 | 640 | 640 |
| 1024 | 512 | 512 |
| 900 | 450 | 450 |
| 390 | 195 | 195 |
| 320 | 160 | 160 |

All measured layouts have no horizontal overflow. Tests require the logo centre to be within one pixel and desktop groups not to overlap it.

At 950 pixels and below, the menu trigger occupies the left grid column, the logo stays in the centre, and the navigation becomes a stacked drawer. All seven links remain available. The existing focus trap, Escape, focus return and body-scroll locking are preserved. Resizing above the same breakpoint closes the drawer; clicking the logo closes it before returning home.

An inherited rule hid the quotation CTA below 1100 pixels. The new navigation overrides that rule, keeping Request a Quote visible at 1024 pixels and in the mobile drawer. Default links are dark; active/hover states use burgundy and an animated burgundy underline. The quotation action remains transparent and underline-only.

## Footer

The background remains **#FFFFFF**, with light dividers, burgundy headings/links, small gold heading rules and rose icon accents.

1. Brand/location: the real logo, Floating Bakery & Caterers, “Freshness in Every Bite.”, the supplied short brand description and Thatchfield Crescent Estate / Thatchfield, The Reeds / Centurion, 0158, South Africa.
2. EXPLORE: Home, About Us, Catalogue, Catering, Cake Designer, Contact Us and Request a Quote, all using existing routes.
3. GET IN TOUCH: `tel:+27731268382`, `mailto:guguminnaar@gmail.com`, the supplied website and an existing Contact page CTA. Matching Lucide phone/mail/location icons are decorative to screen readers.

No valid official social profiles or working newsletter service existed in the implementation. No fictional social links, newsletter field or backend were added. Stored admin settings remain untouched; the footer displays the contact values explicitly supplied for this redesign.

The lower row shows **© [current year] Floating Bakery & Caterers. All rights reserved.** and the complete linked credit:

**Designed and Developed by Bongani Nombamba** → `https://www.locate.africa`.

The credit uses `target="_blank"`, `rel="noopener noreferrer"`, a subtle burgundy hover underline and visible keyboard focus, with no extra icon. Its text is not truncated.

Desktop has three columns. At 950 pixels and below the brand spans a two-column arrangement; at 600 pixels and below all columns stack in brand → sitemap → contact order. The copyright/credit stack on mobile. Website and email text can wrap safely on narrow screens.

## Motion and accessibility

The footer uses the existing intersection-based reveal system. Logo/icon effects and underlines are short transform/colour animations; content remains visible before animation. Existing reduced-motion overrides disable them. No animation library or subscription service was introduced.

Semantic headings, a sitemap list, address markup, meaningful link names, decorative-icon hiding, minimum-height navigation targets and existing focus outlines are retained. Footer component screenshots temporarily hide unrelated fixed controls in the diagnostic browser only, so sticky headers do not cover the captured component. Application styles are not altered by that artifact step.

## Validation

Strict TypeScript, ESLint, **all 222 existing unit/integration tests** and the production build pass. The two retained desktop/mobile drawer regression cases also pass, including public/admin keyboard focus, Escape and scroll locking.

**All 39 final responsive/browser cases pass** in one 12.2-minute run, plus the **two retained drawer cases**: 41 cases total across these runs. The final run includes eight navigation/footer cases, eighteen retained route/viewport/About/accessibility cases, six public-theme journeys and seven contact-preservation cases. Sizes include 1920, 1440, 1280, 1024, 768, 390, 360 and 320 pixels. Contact records/validation, the estate map configuration, official catalogue image frames, Designer/quotation/admin route availability, zero horizontal overflow, automated WCAG checks and reduced motion remain covered.

The new cases verify logo centring within one pixel, non-overlapping desktop groups, visible/functional quotation CTA, logo-to-home behaviour, mobile focus/Escape/scroll locking, white footer, every sitemap destination, phone/email targets, exact complete credit and external-link attributes, no subscription field, no public testimonial copy, and existing not-found handling. Their console/error listeners report no errors.

The updated six-size footer audit also passes. Header/desktop/mobile footer screenshots were visually inspected, and the separate 900-pixel diagnostic confirms the intermediate mobile/two-column-footer layout. Preliminary checks exposed the hidden 1024-pixel CTA; that CSS conflict was corrected without dropping its assertion. The updated focus test remains scoped to the header's intended link rather than becoming ambiguous with the new sitemap link. No unresolved defect remains in the tested scope.

Evidence: `.tools/phase8b-{typecheck,lint,tests,build}.log`, `.tools/phase8b-keyboard.log`, `.tools/phase8b-browser-final.log`, `.tools/phase8b-review.log`, `qa/evidence/playwright-results-phase8b-final.json`, and `qa/evidence/final/phase8b-{header,footer}-*.png`.

Measured production bundles: main 502.55 KB / 158.68 KB gzip; CSS 55.42 KB / 12.04 KB gzip; lazy CakeScene 901.08 KB / 243.71 KB gzip. The existing bundle-size advisories remain visible; no warning threshold was raised.

## Remaining limits and preservation

Physical phones, Firefox/Safari and complete assistive-technology testing remain unverified. Mobile checks are Chrome touch emulation. External fonts/maps still require network access. The reference-image comparison is unavailable because no image was attached.

No cake products/images, pricing/flavour calculations, Designer pipeline, quotation submission/snapshot schema, admin workflow, Contact form, estate map or Chef Gugu content was changed. No stored owner data was reset. No push, deployment, email integration or newsletter backend was added.

Local review: http://127.0.0.1:5173.
