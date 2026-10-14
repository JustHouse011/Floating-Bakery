# Phase 9A review report

Prepared 14 October 2026. Stage 9B has **not** started. No hosted database changes,
Production deployment, DNS changes, indexing changes, account invitations or real
email sends were performed. Public submissions remain disabled.

## 1. Architecture findings

See PHASE9A_ARCHITECTURE_AUDIT.md for the before-change audit. The customer site
uses a compiled official catalogue. Internal/mock admin uses browser IndexedDB;
contact demonstrations and saved designs use separate browser storage. Local
records, estimated values and local approvals must not be imported as real
customer requests, revenue or confirmed bookings. The protected mock admin
remains a separate branch/deployment with the existing UI intact.

## 2. Database schema

Two versioned SQL migrations provide catalogue/products/images/quantities,
versioned cake templates and pricing, business settings, customers, enquiries,
quotations/snapshots/references/notes/communications, explicit bookings,
notification outbox, roles, sessions, audit logs and private auth throttling.
No sample business records, passwords, new decoration charges, opening hours or
notification preferences are invented. Official base-range constraints remain
R1,480–R1,950. The schema and deployment instructions are in PHASE9A_SETUP.md.

## 3. Authentication implementation

Supabase password authentication, logout, refresh, recovery and password-update
handlers are prepared. Tokens are verified with Supabase; current active role
comes from the database, never self-asserted user metadata. Encrypted HttpOnly,
Secure, SameSite=Strict host-only cookies carry tokens; the browser receives only
identity/role and CSRF data. Sessions have an eight-hour absolute lifetime and
revocation records. POSTs require exact configured origins and CSRF for existing
sessions. Account recovery is restricted to existing invited administrators.
There is no public registration endpoint or hardcoded admin credential.
Initial Owner provisioning is explicit, confirmed-identity-only, atomic and
idempotent. Subsequent role changes require an Owner and preserve the last Owner.

## 4. Admin integration status

Stage 9A introduces only the protected sign-in/recovery and session foundation.
The authenticated screen clearly states that the connected dashboard is pending
Stage 9A review. Original products, pricing, quotation, calendar, reporting and
settings screens/repositories are preserved; their database integration is 9B.
Role capabilities are server-derived and protected helpers support independent
role checks for future endpoints. No browser-local records are claimed as live.

## 5. Catalogue migration results

Repeatable dry export verified 55 stable product IDs: 43 official cakes and
12 treats/scones, 44 original cake photographs, all product image files, and
all 43 existing design-template mappings. Prices and flavour rules remain
unchanged. No products were imported; reviewed idempotent database upserts and
feature-flagged catalogue cutover belong to Stage 9C.

## 6. Submission pipeline status

ENQUIRY_ENABLED remains false. Existing validation/rate-limit/idempotency and
Resend code is retained. Durable request storage and email separation are not
activated yet. The schema includes transactional identifiers, private image
metadata, audit data and a notification outbox for 9D. Resend acceptance cannot
stand in for durable persistence; stored requests must survive notification
failure. No public submission path is newly enabled by this stage.

## 7. API runtime health

Fresh probes of Production dpl_EaqhEw7Pv6N2y3XCM5mXbeFrg2KF returned 500.
Fresh logs confirmed ERR_MODULE_NOT_FOUND for extensionless server/delivery.
The fix builds standalone shared ESM JavaScript and uses explicit .js imports
from API wrappers. This was verified **before adding new endpoints** in
protected Preview dpl_EbEsKLSoDTuM5gziqS8K5mraN9uA:
status returns 200/ enabled:false; contact, product and quotation POSTs return
503/unavailable. Native Node ESM tests also construct the bundled Supabase client
and run a mocked RPC. Production still needs the reviewed runtime-fix release.

## 8. Security validation

Local PostgreSQL tests exercise actual grants, RLS, Owner/Admin/Staff/customer
boundaries, private storage metadata, immutable audit permissions, role
revocation, session revocation, optimistic quotation changes and rate limiting.
Customers and anonymous users cannot read private customer/enquiry/quotation
records. Staff cannot approve prices or escalate roles. Anonymous users cannot
read drafts. Quotation acceptance does not invent a booking.
Private buckets restrict MIME types and bytes; there are no anonymous reference
uploads or unrestricted customer-image URLs. Hosted signed URLs await 9D checks.
The frontend build was scanned for service-key/session-secret markers: none found.

## 9. Automated tests

- TypeScript, ESLint and production build passed.
- 233 existing unit/integration tests passed.
- 13 delivery tests passed (no real email).
- 21 authentication/API authorization tests passed with injected providers.
- 59 local PostgreSQL migration/RLS/role/session/storage/lifecycle assertions passed.
- 10 desktop/mobile foundation browser cases passed.
- 12 existing desktop/mobile production cases passed across initial and targeted
  reruns. An obsolete disabled-admin assertion was updated to require sign-in
  with no exposed records. A GPU helper now waits for its dependency resource
  instead of attempting import(undefined). The affected four cases passed.
- Native ESM import/handler and bundled-Supabase-client smoke checks passed.
- Catalogue dry-export verification passed; no database import occurred.

Tests use local PostgreSQL with Supabase auth/storage stand-ins and mocked Auth
responses. Hosted Auth/Storage, real recovery delivery, multi-connection races
and cross-device live business persistence remain unverified, not assumed passed.

## 10. Deployment readiness

Review branch: phase-9a-foundation. Protected review Preview stays within the
floating-bakery Vercel project. ADMIN_ENABLED and CATALOGUE_DATABASE_ENABLED are
off; the sign-in route reports missing configuration honestly. Existing public
storefront, mock-admin Preview, gugu, domain/DNS and noindex state are preserved.
No SQL is executed as part of npm build or Vercel deployment.

## 11. Outstanding configuration and review

Review the schema and authentication code, then connect/choose a dedicated
Supabase development project and separate Production project. Apply reviewed
migrations, confirm hosted grants/RLS and disable hosted public signup. Set
server-only credentials, session key, exact origins and recovery callback.
Invite/confirm the approved Owner identity and run explicit reviewed bootstrap;
bnombamba@icloud.com remains the intended email, not a provisioned account.
Configure and verify Supabase Auth email delivery/recovery separately from bakery
Resend, which awaits final-domain verification. Test hosted sign-in, revocation,
storage and complete workflows before enabling any live feature.

Stop here for Stage 9A review before Stage 9B integration.
