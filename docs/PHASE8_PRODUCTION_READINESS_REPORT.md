# Phase 8 production readiness report

Prepared 14 October 2026. The site is ready for an authenticated **review-only Preview** with enquiry delivery disabled. No production deployment or DNS changes have been performed. Live email delivery has not been configured or tested.

## Changes

- Customer catalogue cards show photograph, category, name, description, accessible gold price and **View Product →**. Cards navigate to detail pages; cake details retain flavour selection, **Customise This Cake** and quotation actions. Non-cake products use product enquiry forms.
- Shared card photography uses a reserved 4:5 cover frame, descriptive alt text and lazy loading. All 43 official cake products, 44 original photographs, 12 menu products and approved prices are preserved. Card prices are 24px desktop/22px mobile, weight 600, gold `#80631e` with 5.64:1 contrast on white.
- Removed obsolete public demo/phase/sample testimonial text. Preserved genuine conceptual-3D and final-price disclaimers. Unsupported bespoke pricing is explicitly marked as requiring a bakery quotation.
- Contact, cake and menu-product enquiries use Vercel APIs and configurable Resend. No local customer submission fallback exists in the public build. Missing configuration, disabled service, unverified sender or unavailable Redis leave submissions unavailable. Failure retains fields; success requires provider acceptance.
- Email contains validated customer/occasion details and trusted product pricing. Cake enquiries attach the full design JSON, trusted catalogue photograph and supported reference images. Fixed recipient: `guguminnaar@gmail.com`; no sender was invented.
- Public build excludes unauthenticated admin components and browser-local customer repositories through build aliases. Internal mode preserves historical tools without migrating or deleting records. Customer form data is held only in memory; no IndexedDB databases were created in the public browser tests.
- Added route-specific titles/descriptions/Open Graph, Bakery structured data, official logo favicon, build-generated page heads, sitemap and robots rules. Preview stays noindex and has no canonical while domain ownership is unconfirmed.
- Preserved the white editorial theme, brand colours, motion/reduced-motion support, centred navigation, map/estate details and Bongani Nombamba footer credit.

## Principal files

`api/{status,contact,quotation,product}.ts`, `server/delivery.ts`, `.env.example`, `vercel.json`, `.vercelignore`, `vite.config.ts`, `package.json`, `tsconfig.json`, `src/app/App.tsx`, `src/main.tsx`, `src/data/publicCatalogue.ts`, `src/store/publicStore.ts`, `src/config/siteMode.ts`, `src/services/{onlineEnquiries,pageMetadata,unavailableLocalQuotation}.ts`, `src/hooks/{useDeliveryStatus,useQuotationPolicy}.ts`, `src/components/layout/PageMetadata.tsx`, `src/components/cakes/ProductCard.tsx`, `src/components/ui/ProductPhoto.tsx`, `src/pages/{Home,Cakes,Contact,Info}.tsx`, designer summary/controls/estimate components, quotation request/summary/reference uploader and new delivery receipt/product enquiry/unavailable screens, `src/styles/production.css`, `scripts/{seoPlugin.ts,test-delivery.mjs}`, `tests/delivery.test.ts`, `e2e/production.spec.mjs`, and deployment documentation.

During copy cleanup, a replacement script damaged seven components. They were recovered from preserved project source reads and edits, then validated through TypeScript, unit tests and desktop/mobile catalogue and 3D regressions. The recovery tooling is confined to ignored `.tools` and is excluded from Git and deployment.

## Validation

| Check | Result |
| --- | --- |
| TypeScript / ESLint | Passed |
| Existing unit regressions | 233 passed |
| New delivery/security tests | 13 passed; mocked providers, no real email |
| Public production build | Passed |
| Separate internal build | Passed |
| Production desktop/mobile browser checks | 12 passed |
| Existing advanced studio desktop/mobile regressions | 6 passed, including all 43 templates, raycast selection, finishes, undo/redo, saves and drawers |
| Contact accessibility audit | Passed WCAG 2 A/AA and 2.1 AA automated checks |
| Dependency audit | 0 known vulnerabilities across 328 audited dependencies |
| Public bundle scan | No IndexedDB/customer-repository or admin-shell code after aliases |
| Local unconfigured API | `/api/status` returned `enabled:false` |
| Live inbox delivery / live Preview APIs | Not tested: missing configuration and Vercel login |

The lazy-loaded Three.js studio still produces a build warning for its approximately 903 KB uncompressed graphics chunk; this is an existing graphics cost, loaded only for the studio. Browser tests use installed Chrome on desktop/mobile viewports; physical-device and live host tests remain outstanding.

## GitHub and deployment status

Confirmed repository: `https://github.com/JustHouse011/Floating-Bakery`, default branch `main`, public and initially empty. The workspace initially had no `.git`; initialized local `main` against that exact origin. Implementation commit: `029b125` (`feat: prepare Floating Bakery website for production`). A normal `git push --set-upstream origin main` failed because repository authentication is unavailable. The remote remains empty; no history was overwritten. This report is recorded in a follow-up documentation commit.

Vercel CLI 64.0.2 reported **No existing credentials found**. The authenticated Preview attempt did not create a deployment. An explicit temporary Preview attempt was rejected because anonymous deployments always target production; no production fallback was performed. **Preview URL: unavailable until Vercel is authenticated.**

Release blockers for production: approved verified Resend sender/domain/API credential, HMAC/Redis/origin configuration, successful real contact and quotation inbox tests, authenticated Vercel Preview and live route/API checks, and confirmed production-domain ownership. These do not block preparing a disabled-submission review preview once account access is available. Do not enter API keys into chat or commit `.env` files.
