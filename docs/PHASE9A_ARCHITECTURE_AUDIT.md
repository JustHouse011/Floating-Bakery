# Stage 9A architecture audit

Audited 14 October 2026 before backend changes. Baseline: main commit 5e3e314;
Production deployment dpl_EaqhEw7Pv6N2y3XCM5mXbeFrg2KF, project floating-bakery.

## Current application

- React 19, TypeScript, Vite 6, React Router and Zustand. Public builds alias
  adminStore to publicStore and exclude the existing Admin component.
- The separate admin-mock-preview branch has a protected static Vercel Preview.
  Vercel sign-in protects access; it is not application authentication.
- There is no Supabase application authentication, server-verified admin role,
  shared business database or controlled invitation process.
- IndexedDB database floating-bakery-quotations, version 4, has workspace,
  quotations, quotationAudit, productEnquiries and officialConfirmations stores.
  Workspace contains catalogue, settings, pricing, revision and pricing history.
  Quotations contain customer/event details, design/pricing snapshots, Blob
  reference images and local status histories. Audits contain notes and price
  revisions. Product enquiries and official confirmations are local-only.
- Historical contact demonstrations use localStorage floating:enquiries.
  Saved designs use floating:cake-design (version 3); session designs use
  floating:session-cake-design. Public customer drafts are held in memory.
  Do not bulk-import browser customer/demo records as real business requests.
- Public catalogue: publicCatalogue.ts combines supplied client cake products
  with official sweet treats and scones. Compiled data is independent of admin
  browser edits. Images are existing public assets, with responsive WebP variants.
- Internal defaultWorkspace additionally contains illustrative cake packages
  from products.ts and demonstration pricing. These are not approved migration
  sources. The migration source must be the official public catalogue only.
- Official base cake range is 148000–195000 ZAR cents; approved flavour
  surcharges apply once per cake. No new decoration charges are authorised.
- Admin products/settings/pricing use IndexedDbAdminRepository. Quotation
  management uses IndexedDbQuotationRepository. Calendar and reports derive
  from browser records; local approval is not a confirmed business booking and
  estimated values are not revenue. These modules require Stage 9B integration.

## Current APIs and delivery

- api/status.ts, contact.ts, product.ts and quotation.ts all import delivery
  without an extension. Fresh Production probes returned 500 on status/contact.
  Fresh logs report ERR_MODULE_NOT_FOUND for /var/task/server/delivery imported
  from api/status.js and api/contact.js. This is ESM module resolution, before
  any request handling or provider configuration checks.
- delivery.ts validates fields and attachment signatures, enforces consent,
  origin checks, signed challenges, rate limits and idempotency through Redis.
  Its current success condition is Resend acceptance. It has no durable
  enquiry/quotation database and no notification outbox. Stage 9D must separate
  persistence from email, retain stored requests after notification failures,
  and introduce transactional idempotency.
- ENQUIRY_ENABLED is explicitly false. Missing verified sender, secrets or
  Redis also disables delivery. No credentials are needed for disabled previews.

## Deployment and test baseline

- Vercel: Vite, npm run build, dist, Node 22. SPA rewrites exclude API/assets;
  image inclusion supports official cake attachments; security headers exist.
  Automatic Git deployments are disabled. Generated Vercel domains are protected
  except the public Production alias; indexing is disabled pending final domain.
- Existing unit/integration suites cover designs, pricing, quotations, local
  administration, catalogue, official cakes, navigation, studio and delivery.
  Playwright covers desktop/mobile storefront/admin journeys, responsive views,
  accessibility and GPU rendering. There are no existing PostgreSQL RLS,
  application-authentication or production-admin API authorization tests.
- The Supabase plugin search confirms no connected Supabase integration.
  Stage 9A migrations must remain unapplied until reviewed and a dedicated
  development project is configured. Never modify gugu, DNS or final-domain
  configuration; never enable submissions during this stage.

## Staging boundary

Stage 9A supplies schema/RLS, auth and protected foundation APIs plus tests.
Existing admin business screens are preserved. Database-backed repositories,
catalogue import/cutover, customer submission persistence, and full business
workflows remain Stages 9B–9E and require separate review.
