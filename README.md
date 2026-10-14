# Floating Bakery & Caterers

Stage 9A backend foundations are prepared for review. See [architecture audit](docs/PHASE9A_ARCHITECTURE_AUDIT.md), [review report](docs/PHASE9A_REVIEW_REPORT.md) and [setup instructions](docs/PHASE9A_SETUP.md). Supabase migrations remain unapplied, administration is disabled until configured, and database-backed dashboard integration begins only after Stage 9A approval.

Customer storefront, official product catalogue and advanced 3D cake studio. The public build uses Vercel API functions and configurable Resend email delivery. Online submissions remain unavailable until the sender and service are configured and tested. Historical browser-local administration is available only through the separate internal mode. See [production deployment instructions](docs/PRODUCTION_DEPLOYMENT.md).

## Run locally

Install Node.js 22 LTS or newer, then run `npm install` and `npm run dev`. Open the URL printed by Vite.

On this workspace, a portable Node.js 22.14.0 runtime is available in the ignored `.tools` folder. Run `./start-local.ps1` from PowerShell to use it automatically.

If this machine's PowerShell policy blocks the `.ps1` launcher, start the app without changing that policy:

```powershell
$env:Path = (Join-Path (Get-Location) '.tools/node-v22.14.0-win-x64') + ';' + $env:Path
& '.\.tools\node-v22.14.0-win-x64\npm.cmd' run dev
```

Validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Included routes

Public routes: `/`, `/cakes`, `/cakes/:id`, `/about`, `/catering`, `/contact`, `/cake-designer`, `/quote-request`, `/product-enquiry/:id` and `/request-received`. Public admin and historical local confirmation URLs show an unavailable page. Search and category filters work together; product selections carry through to the studio and enquiries. Internal mode retains the historical admin and local-record routes.

## Cake studio

The following sections document the earlier internal architecture as well as shared design features. For current public submission behaviour and deployment requirements, use [the production guide](docs/PRODUCTION_DEPLOYMENT.md).

Run `./start-local.ps1` and visit `/cake-designer`. Drag to rotate, scroll or pinch to zoom, and use Reset view to return to a camera framing that adapts to your cake and viewport. Customise round or square cakes, one to three tiers, a 6–12 inch base, individual tier colours, flavour and finish. Upper tiers decrease by two inches, with a six-inch minimum; increasing tiers raises the base size when necessary.

Buttercream is matte with horizontal piping, fondant is smooth, and ganache is glossy chocolate brown. Ganache retains your chosen tier colours for switching back, but disables colour selectors while its brown finish is active. Flavour is a saved preference and does not change the outside of the cake.

Pearls, ribbon, drips, flowers and a star topper are rendered as geometry. A personalised message appears on a two-sided topper plaque using a locally generated canvas texture. Decoration colours apply to ribbons, drips, petals, the star and lettering; pearls remain ivory.

Save design stores one versioned configuration in `floating:cake-design` on this browser. Restore saved validates it before applying it. Phase 2 version 1 saves migrate to the current version 2 format; prices are always recalculated from active rules and never trusted from storage. Reset design restores defaults without deleting the saved design. Options persist in memory when navigating away and back; after a browser reload, choose Restore saved. A different catalogue selection loads its demonstration preset. Copy Estimate includes itemisation, active pricing version and the bakery confirmation disclaimer, with a selectable text fallback when clipboard access is unavailable.

## Live demonstration pricing

The standalone engine is `calculateCakeEstimate(configuration, pricingRules)` in `src/services/pricingEngine.ts`. Its seed rules live in `src/data/cakePricing.ts`; the initial version is `demo-2026-10-13.v1`, effective 13 October 2026. All calculation amounts are integer cents. Base tier prices are R450 / R650 / R900 / R1,250 for 6 / 8 / 10 / 12 inch sizes. Additional tiers use their actual prices plus R150 stacking per additional tier. Flavour, frosting and decoration additions apply once per complete cake under the initial rules.

Catalogue starting prices anchor explicitly defined included packages. Size, tier and option changes add or credit their difference against those inclusions; no package option is charged twice. The initial vanilla, chocolate and red velvet packages start with six-inch cakes. Existing saved eight-inch versions keep their size and receive the matching size adjustment. These inclusion and credit policies are demonstration assumptions, not confirmed bakery terms.

Wedding designs, the Bakery review checkboxes and uploaded references display “Custom Quotation Required.” Where supported selections can be priced, an indicative amount appears, with no estimated final total. Unsupported configurations or invalid pricing rules receive no numeric estimate. Every displayed estimate is subject to bakery confirmation.

## Local quotation requests

In the Cake Designer, select **Request This Cake**. Complete the four steps: customer details, occasion, optional references and final review. The form retains a separate copy of the cake configuration, so later studio changes do not change that draft. Back / edit controls preserve entered information. Drafts stay in memory while navigating this app; they are not saved across a page reload. Start another request from the studio to replace a draft.

Use demonstration customer details. South African numbers accept domestic `0…`, international `+27…` or `0027…` formats and are normalised to `+27`. Validation checks format, not whether a number is assigned or reachable. Dates use the `Africa/Johannesburg` calendar. The configurable demonstration lead time defaults to zero days; this is not the bakery's actual booking policy. Delivery is a preference and requires an area, without any delivery fee or availability promise.

Reference uploads accept JPEG, PNG and WebP: at most three images, two MB each, four MB total. Type, extension, size, file signature and browser decoding are checked. Previews can be removed before submission. References mark the request for manual review without changing the 3D cake.

On Save Demo Request, the service validates all fields and recalculates against active pricing rules. A price change after review requires another review. The reference uses `FB-YYYY-` plus 16 random hexadecimal characters, backed by a unique database index. Submission is idempotent for the same draft, and duplicate references retry.

Completed requests and their image Blobs are saved atomically in IndexedDB database `floating-bakery-quotations`, now schema version 2, object store `quotations`. Phase 5 adds `workspace` and `quotationAudit` stores without rewriting Phase 4 quotation records. No image data is placed in localStorage, and the earlier saved-design / enquiry keys are untouched. Each request contains a frozen design and pricing snapshot. A confirmation at `/quotations/:id` can be reopened in the same browser and origin, copied or printed; it never says an email was sent or an order confirmed.

The administration dashboard connects directly to this repository. Its allowed statuses are local demonstration states, not production access controls or booking confirmations. Internal notes and prepared revisions are append-only audit entries stored separately from the original request.

The route and 3D scene are separately lazy-loaded. The preview needs WebGL 2; loading, renderer-error and context-loss states retain the non-3D controls. No external model, environment map or 3D font download is required.

## Demonstration content

Product data is typed in `src/data/products.ts`; all prices carry `demo: true`. Photography uses illustrative Unsplash images and Google Fonts; internet access is required for those resources. Replace images with approved local bakery photography before launch. Testimonials are prominently labelled samples. About copy and catering categories are placeholders; no address, contact details or business history is invented.

Contact enquiries are saved to browser localStorage under `floating:enquiries`. Nothing is emailed or transmitted to the bakery. Clear this key in browser developer tools to remove saved demonstration enquiries. Storage failures are shown to the user. Do not use real customer information for this prototype.

## Scope boundary

Phase 5 stops before backend integration, authentication and any real bakery submission. The catalogue, estimator, requests and administration use local demonstration data. No deployment or GitHub push is configured.

For production hosting, configure SPA fallback to `index.html` for direct route visits. Future backend integration should replace local persistence behind service modules.

## Phase 1 validation — 13 October 2026

- Dependency installation succeeded; resolved versions are retained in `package-lock.json`.
- TypeScript, ESLint and the production build passed. Build output is in `dist/`.
- Nine route variants rendered successfully in a server-rendering smoke check, including product details, selected-product links and the missing-page view.
- The enquiry service generated an identifier and persisted its demonstration record using simulated localStorage.
- Browser automation was unavailable. Actual click navigation, native form validation, browser storage persistence, image loading, console errors and desktop/mobile overflow have not been verified in a browser.
- The supplied inspiration website was inaccessible through the browsing tool; no screenshot was attached. Design follows the written brief.
- Pricing-engine tests and 3D checks are deferred to their respective implementation phases.
- No deployment or GitHub push was performed. Work stops here for Phase 1 review.

The Phase 2 architecture, changed files, validation and browser review checklist are documented in [PHASE2_REVIEW.md](PHASE2_REVIEW.md).

The Phase 3 pricing assumptions, integration, migration and validation are documented in [PHASE3_REVIEW.md](PHASE3_REVIEW.md).

The Phase 4 workflow, repository, tests and review checklist are documented in [PHASE4_REVIEW.md](PHASE4_REVIEW.md).

## Local administration

Open `/admin` on the same origin as the storefront, for example `http://127.0.0.1:5173/admin`. Product creation, edits, archive/restore, category assignment, image URLs, featured flags and designer eligibility update the public catalogue. New packages begin with a standard 8 inch vanilla buttercream preset. Pricing supports validated draft previews, product inclusions, manual-review flags and versioned publication using the existing engine. Active configuration is loaded before client routes render; storage failures preserve browsing with the last loaded or seeded configuration and offer a retry.

Quotations support search, status and event-date filters, original snapshots, reference images, lifecycle transitions, internal notes, prepared revisions and printing. Reports and charts use actual stored requests, with empty states when there are none. Calendar approval markers mean local approval, not verified bookings. Estimated totals are original estimates, not revenue; manual requests are excluded and prepared revisions never replace customer estimates.

Business settings configure contact information, collection instructions, an additional disclaimer, lead time, supported delivery areas and ZAR display locale. New requests capture the policy; old records retain their original policy. Empty delivery-area settings mean requested areas still need confirmation. Contact details start blank. Currency preferences change display only; all money remains ZAR.

Settings include an explicitly confirmed **Reset demonstration data** action. Typing `RESET LOCAL DEMO` deletes all IndexedDB quotations, reference images and admin audit entries and restores seeded catalogue, pricing and settings atomically. The independent `floating:cake-design` and `floating:enquiries` localStorage entries are retained. This browser and origin are the persistence boundary; `localhost` and `127.0.0.1` do not share records.

This is an openly accessible local demo, with no authentication or authorisation. Read [PHASE5_REVIEW.md](PHASE5_REVIEW.md) for architecture, validation results, changed files, limitations and the review checklist. Phase 6 has not begun.

Phase 5 validation: **158 tests passed** (104 previous regression cases + 54 administration cases), TypeScript, ESLint, production build, existing route/enquiry smoke checks and local route/module HTTP checks. Browser interaction and GPU checks remain manual. The separately loaded 3D scene retains Vite's bundle-size warning; its measured bundle sizes and performance implications are documented in the Phase 5 report.

## Phase 5B local QA

Current validation supersedes the earlier browser-unavailable notes: **168 unit/integration tests**, 30 unique Chrome cases across handover/targeted rerun, six responsive sizes, actual Intel GPU rendering and two Edge customer/admin journeys. See [QA report](PHASE5B_QA_REPORT.md), [issue register](PHASE5B_ISSUE_REGISTER.md) and [manual device checks](PHASE5B_MANUAL_DEVICE_CHECKS.md). Physical phones and Firefox/WebKit remain unverified. The large lazy 3D bundle warning remains documented.

Current cake edits automatically survive refresh in the same tab through configuration-only `floating:session-cake-design` sessionStorage. Manual Save/Restore retains the independent `floating:cake-design` localStorage record. Another selected catalogue product loads its preset. No contacts, images or cached prices enter the session record. Mobile Reset, Restore, Copy and Save are under **More design actions**, with the estimate/request button always visible.

Seed photos now resolve to attributed local illustrative cake imagery without rewriting catalogue URLs. See `public/images/ATTRIBUTION.md`. Other about/catering photos and Google Fonts may still require internet. These are not verified bakery portfolio photographs.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `npm run test:browser`. Browser tests use installed Chrome with isolated storage; `PW_CHANNEL=msedge` selects Edge. `QA_RUN` gives concurrent runs separate artifact directories. Optional Firefox/WebKit projects require their supported binaries; these were not installed or tested here. Additional measurements: `npm run qa:audit`, `npm run qa:gpu`, `npm run qa:bundle`. Local screenshots, traces, JSON and HTML reports under `qa/evidence/` are ignored. QA never resets owner browser data. No deployment or push occurred; Phase 6 has not begun.

## Phase 5C official catalogue

The `/cakes` catalogue now includes twelve official Sweet Treats/scone products alongside six clearly marked sample cakes. Supplied dozen prices and exact 5/10/20-piece scone prices are independent of the unchanged cake engine. Scones require quantity selection; unsupported quantities have no extrapolated price. Product photos come directly from the supplied menus. Raisin Scones disclose reuse of the plain-scone photograph. The owner selected the supplied Sweet Treats FB&C logo, used without redrawing. Business contacts/location/tagline come from the menus; no street address or delivery fee is invented.

Official product enquiries review and save immutable product/quantity/price snapshots locally at `/product-enquiry/:id` and `/product-enquiries/:id`. They are not sent and are not purchases. Admin quotations show product enquiries separately; existing cake reports/calendar remain cake-only. Admin product edits support quantity options, availability and preview before local publication. Historical snapshots retain their original prices/descriptions.

IndexedDB version 3 adds `productEnquiries` without rewriting cake records. A one-time catalogue seed merge preserves existing product/pricing/contact edits and archive flags. Confirmed demonstration reset includes product enquiries; tests use isolated contexts only. New settings use supplied business contacts; existing settings are preserved. These current notes supersede the earlier all-prices/photography-demonstration and blank-contact defaults.

## Phase 6 client cake catalogue

The current catalogue includes **43 official cake products representing all 44 client photographs**, twelve non-cake products and six clearly labelled legacy demonstration cakes. Originals remain unchanged and are traced in `public/images/catalogue/CAKE_IMAGE_INVENTORY.json`; WA0014/WA0020 share one gallery product. Actual client photos now supply the homepage hero, features, birthday/luxury showcases and designer promotion. Slugs/names/categories are editable, with physical specifications awaiting bakery confirmation.

Official vanilla range is **R1,480–R1,950**. Ten standard flavours add R180; four premium flavours add R220; vanilla adds zero. One flavour fee is applied once, with no automatic size/tier/frosting/decoration charge. Product details and the existing 3D designer show the actual reference beside a conceptual preview and live range. Existing configurable demonstration estimates and scone/pastry quantity prices remain separate.

Official quotations freeze reference/price/notes metadata. Admin previews/publishes official flavour versions, retains history, manages cover/gallery/categories/visibility/featured order, and appends controlled base-price confirmations with approved additions and explicit reasoned overrides. Confirmation moves a request to Quoted, not customer acceptance; original snapshots remain unchanged. Requests still save locally and are not sent.

Current IndexedDB version is **4**, adding `officialConfirmations` without rewriting existing records. A one-time cake seed merge preserves owner edits and legacy pricing. No owner database was reset. Current validation: **222 unit/integration tests pass; all 40 Chrome browser cases passed**, followed by 18 affected-case reruns and two desktop/mobile clipboard-export journeys, plus TypeScript, lint, build and smoke checks. Real desktop GPU rendering was checked; mobile is emulation. Physical devices and Firefox/Safari remain unverified. Three's large lazy chunk warning remains documented; catalogue metadata is split into a real cacheable chunk.

Read [PHASE6_CAKE_CATALOGUE_REPORT.md](PHASE6_CAKE_CATALOGUE_REPORT.md) for prices, inventory, migration, evidence and client review items. No deployment, push, Supabase, payments or live email was introduced. Review at `http://127.0.0.1:5173/cakes` and `/admin`.

## Phase 7 About Us and Chef Gugu

The `/about` page now presents the approved brand story, founder biography, philosophy, Centurion location and existing cake/enquiry calls to action. It uses the original `/images/profile/gugu.jpeg` portrait with its natural aspect ratio and visible jacket branding. The existing homepage introduction links to this story, and the shared footer now includes About Us. No pricing, product records or migrations were changed.

Read [PHASE7_ABOUT_REPORT.md](PHASE7_ABOUT_REPORT.md) for changed files, image details, accessibility, validation evidence and remaining review limits. Review locally at `http://127.0.0.1:5173/about`. No push or deployment.

## Phase 8 public design and interactions

Public pages use pure white surfaces, burgundy/rose/gold accents, underlined actions and bottom-border form controls. Product cards share a reserved 4:5 `ProductPhoto` frame, retaining complete client/menu photographs. The shared layout adds restrained section/route motion, sticky navigation, scroll progress, back-to-top and a small native-cursor accent disabled on touch/reduced-motion devices. Contact includes a general Thatchfield Google Maps embed and external map link; enquiries still save locally.

The existing lazy Cake Designer is the sole WebGL renderer. Homepage uses optional CSS photo depth, with static touch/reduced-motion presentation. Pricing, snapshots, catalogue data and admin workflows are retained. Validation: **222 tests and all 52 Chrome browser cases pass**, alongside strict TypeScript, lint and the production build. Read [PHASE8_UI_REPORT.md](PHASE8_UI_REPORT.md) for exact tokens, file changes, browser evidence and review limits. Local review only at `http://127.0.0.1:5173`; no push or deployment.

The subsequent [Contact refinement](CONTACT_REFINEMENT_REPORT.md) moves the map into the left column, resolves to Thatchfield Crescent Estate and places Visit/Call/Email details below the main area. All 222 tests and 13 targeted browser cases pass, including the 320-pixel layout. Enquiries remain local; email delivery requires a production integration. Review at `/contact`.

## Phase 8B navigation and footer

Sample testimonials and their source data/styles have been removed. Desktop navigation now sits on both sides of the mathematically centred original logo; the mobile drawer retains its keyboard/focus behaviour. The pure-white three-column footer provides the estate location, full sitemap, official contact links and “Designed and Developed by Bongani Nombamba” linking to `https://www.locate.africa`. No newsletter or fictional social links were added. All 222 tests, 39 final browser cases and two retained drawer cases pass, plus type checking, lint and build. See [PHASE8B_NAVIGATION_FOOTER_REPORT.md](PHASE8B_NAVIGATION_FOOTER_REPORT.md) for layout, centring measurements, validation and review limits. Local implementation only.

The subsequent [Header and quotation CTA refinement](HEADER_QUOTATION_CTA_REPORT.md) brings menu groups 40–65 pixels from the centred logo, removes quote links from navigation, and adds contextual page CTAs using the existing quote/enquiry workflows. General requests resume an existing draft; cake-specific requests preserve relevant design/customer context, and saved session designs restore from Home. All 225 unit/integration tests and 47 final browser cases pass, plus type checking, lint and build. Pricing and historical saved quotations remain unchanged. Review locally only.

Read [PHASE5C_CATALOGUE_REPORT.md](PHASE5C_CATALOGUE_REPORT.md) for exact prices, extraction evidence, persistence, validation and limitations. `npm test` now covers **188 cases**; all previous cases remain, with seed-count/contact/schema assertions updated for the supplied catalogue. `e2e/catalogue.spec.mjs` covers desktop/mobile catalogue and enquiry/publication journeys. Generated QA files are excluded from Vite watching, and Tailwind scans application source only. No deployment, push, payments or backend work.

## Advanced Cake Design Studio

The existing designer now loads independent templates for all 43 official products, retaining all 44 real photographs as references. It adds individual tier dimensions, four-tier confirmation, procedural finishes and flowers, constrained decoration placement and raycast selection, undo/redo, colour/personalisation tools, mobile bottom sheets and original-photo comparison. Version 3 saves restore older versions; quotation/admin summaries and read-only 3D inspection preserve advanced configurations without changing historical snapshots or the approved single-flavour price range.

Review at `/cake-designer?product=cake-wa-0008`. Read the [catalogue feature audit](docs/CAKE_DESIGN_FEATURE_AUDIT.md) and [implementation and compatibility report](docs/ADVANCED_CAKE_STUDIO_REPORT.md) for supported/approximate features, file changes, validation and outstanding bakery decisions. All 233 unit/integration tests, strict TypeScript, lint and build pass; the broad browser regression run passed all 60 cases, followed by rendering/integration rechecks documented in the report. Local implementation only; nothing pushed or deployed.
