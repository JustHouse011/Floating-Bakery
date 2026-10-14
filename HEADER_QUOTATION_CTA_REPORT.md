# Header refinement & quotation CTA integration

## Header

The original bakery logo remains mathematically centred through equal CSS Grid side tracks. The left group now aligns toward the logo and the right group starts beside it, replacing the former outer-edge placement. Desktop link gaps are 28 pixels, reducing to 24 pixels on narrower desktops. Menu-to-logo separation is clamped between 40 and 65 pixels. Desktop header height is 104 pixels, with reduced vertical padding; mobile remains 92 pixels.

Measured final layouts:

| Width | Logo centre | Left/right separation | Link gap |
| ---: | ---: | ---: | ---: |
| 1440 | 720 | 51.83 px | 28 px |
| 1280 | 640 | 46.08 px | 28 px |
| 1024 | 512 | 40 px | 24 px |
| 900 | 450 | Mobile drawer | — |
| 390 | 195 | Mobile drawer | — |
| 320 | 160 | Mobile drawer | — |

All measured layouts have no horizontal overflow. The logo uses its existing 287 × 266 asset with native dimensions and automatic rendered height, preserving its natural aspect ratio. The announcement bar is unchanged.

Main navigation contains only Home, About, Catalogue, Catering, Cake Designer and Contact. Request a Quote is absent from the desktop/sticky header and mobile drawer. It was also removed from the footer sitemap; the footer retains a contextual quote link in GET IN TOUCH. Existing mobile focus trapping, Escape, scroll locking and resize/close behaviour remain.

## CTA placements and destinations

| Location | CTA | Existing destination/behaviour |
| --- | --- | --- |
| Home hero | Explore Our Cakes | `/cakes` |
| Home hero | Request a Custom Quote | `/quote-request`, current/resumed draft |
| Featured cake cards | Enquire About This Cake | `/quote-request`, stable product/design context |
| Home catering preview | Plan Your Event | `/contact?type=Catering` |
| Home final invitation | Request a Quote | `/quote-request` |
| Official and legacy cake details | Request a Quote for This Cake | `/quote-request`, current cake context |
| Catalogue bottom | Request a Custom Quote | `/quote-request` |
| Cake Designer | Existing Request This Cake actions | `/quote-request`, latest configuration |
| Catering introduction | Discuss Your Event | `/contact?type=Catering` |
| After catering services | Request a Catering Quote | `/contact?type=Catering` |
| Catering bottom | Let's Plan Your Celebration | `/contact?type=Catering` |
| After Chef Gugu's biography | Let's Create Something Special | `/quote-request` |
| About final invitation | Request a Quotation | `/quote-request` |
| Below Contact details | Request a Cake Quote | `/quote-request` |
| Footer GET IN TOUCH | Request a Quote | `/quote-request` |

The Home bottom invitation uses the approved “Let's Create Something Beautiful.” heading and description. The founder invitation uses “Inspired by Passion. Crafted for Your Celebration.” without editing the biography or portrait. The Contact form, estate map and three contact items remain intact; only the contextual link below them is added. Non-cake quantity enquiries continue using their existing product-enquiry route.

The Designer's existing label is retained because the proposed replacement was optional. Its action now uses the shared preservation helper. Existing customise/designer actions remain available on cake cards and details.

## Quotation state behaviour

`QuoteLink` reuses the existing `/quote-request` route, pricing store, designer store and quotation draft store. There is no second quotation system.

General CTAs resume an existing in-memory draft without clearing customer, occasion, uploaded references, consent or current step. Without a draft they start from the active configuration. On a freshly loaded homepage with the untouched default configuration, the existing valid session design is restored before starting; unavailable/corrupt session storage falls back without blocking the request.

Cake-specific actions use the stable product ID. An already configured matching cake retains shape, tiers, colours, flavour and notes; a newly selected cake uses its existing product configuration. Official details initialise from a matching design and retain geometry when applying flavour/notes. Approved product reference/name/category metadata remains supplied by the existing pricing/snapshot pipeline.

Identical configurations resume their draft. Explicit design changes create a fresh draft and preserve customer/occasion fields; matching-cake inspiration uploads are also retained. A different cake does not automatically inherit another cake's inspiration uploads. Changed designs reset consent and review progress so the updated request can be reviewed. No saved quotation record or historical snapshot is modified.

Unsaved customer form drafts remain in memory, as in the existing application; they are not made durable across hard reloads or new tabs. The existing session design and saved IndexedDB quotations retain their established persistence.

Catering CTAs preselect Catering through the existing Contact search parameter. The local-only saving notices/consent remain accurate; no email backend was introduced.

## Files

Created:

- `src/components/quotation/QuoteLink.tsx`: shared contextual quotation link.
- `src/services/quotationNavigation.ts`: draft resume/preservation and session-design restoration.
- `src/styles/quotation-ctas.css`: restrained white contextual invitation spacing.
- `tests/quotationNavigation.test.tsx`: three meaningful state-preservation regressions.
- `e2e/quotationCtas.spec.mjs`: page routing and desktop/mobile cake-context regressions.
- This report.

Modified public components/pages: `Layout.tsx`, `SiteFooter.tsx`, `ProductCard.tsx`, `Home.tsx`, `Cakes.tsx`, `OfficialCakeDetail.tsx`, `CakeDesigner.tsx`, `Info.tsx`, `About.tsx`, `Contact.tsx`, `main.tsx` and `navigation-footer.css`.

Modified validation/docs: `scripts/test.mjs`, `playwright.config.mjs`, `e2e/navigationFooter.spec.mjs`, `e2e/responsive.spec.mjs`, `e2e/workflow.spec.mjs` and `README.md`. Existing navigation assertions now expect Contact as the final menu item, no quote menu link and compact measured gaps. About's quotation destination assertion now checks the standard quotation flow.

## Styling and validation

The pure-white theme, thin burgundy underlines, gold/rose accents, small arrow transitions, focus outlines and reduced-motion support are reused. No magnetic effect, animation library, image replacement or extra WebGL renderer was added.

TypeScript, ESLint, the production build and **225 unit/integration tests pass**: all 222 previous cases plus three new draft-preservation cases. Both focused desktop/mobile restoration journeys pass, including photo/product/flavour/notes/geometry, customer fields, session reload restoration and the Designer's quotation action.

**All 47 final Chrome browser cases pass in one 13.5-minute run**: 39 responsive/navigation/theme/contact cases across 1920, 1440, 1280, 1024, 768, 390, 360 and 320 pixels, four retained official-cake desktop/mobile journeys, and four new CTA integration journeys. They verify compact gaps, centred logo, no menu quote item, footer/menu navigation, keyboard focus/Escape, reduced motion, automated WCAG checks, no overflow, Contact saving without record loss, all 44 image paths, actual 3D rendering, official range/flavour pricing, immutable saved quotation metadata, admin confirmations, general draft resume and selected/session design context.

Both restoration cases also passed in a separate focused run. Preliminary test-harness failures were corrected: a default-configuration factory was treated as an object, the quotation photo selector used the wrong sidebar class, and a cake title link was ambiguous with its equally named image link. No application assertion was removed to force a pass. No unresolved defect remains in the tested scope.

Evidence: `.tools/header-cta-{typecheck,lint,tests,build}.log`, `.tools/header-cta-restoration.log`, `.tools/header-cta-browser-final.log`, `.tools/header-cta-layout.log`, `qa/evidence/playwright-results-header-cta-final.json`, and `qa/evidence/final/header-cta-*.png`. The 1440-pixel compact header screenshot was visually inspected.

Final measured bundles: main 503.86 KB / 159.04 KB gzip; CSS 55.79 KB / 12.12 KB gzip; catalogue data 58.68 KB / 4.55 KB gzip; lazy CakeScene 901.08 KB / 243.71 KB gzip. The existing size advisories remain, with no threshold increase.

## Remaining limits

Physical devices, Firefox/Safari and a complete assistive-technology review remain unverified. Mobile browser checks use desktop Chrome touch emulation. Existing external fonts/maps require internet. Form delivery remains local; production email integration is still needed if delivery is expected.

No product IDs/images, pricing rules/flavour fees, historical snapshot schema, admin workflow or stored owner data was changed/reset. No push, deployment, backend or new quotation route was introduced. Review locally at http://127.0.0.1:5173.
