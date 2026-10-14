# Stage 9A setup and review

Stop after this stage. Do not apply migrations, enable production administration,
switch catalogue reads, or enable public submissions until the owner reviews it.
The current storefront and protected mock-admin Preview are unchanged.

## Database model

Two versioned migrations define products, product_images, product_quantities,
versioned design_templates and pricing_versions, business_settings, customers,
enquiries, quotations, reference_files, quotation_notes, customer_communications,
bookings, notification_outbox, admin_accounts, admin_sessions and audit_logs.
Private auth_rate_limits stores HMAC hashes for bounded authentication throttling.
Money is integer ZAR cents. Official cake range constraints remain 148000–195000.
Opening hours and notification preferences are nullable; no approved values are
invented. No business records or user credentials are seeded by the migrations.

Public roles can read only active, approved products and their public catalogue
metadata. Customers/anonymous users have no private-record grants. Authenticated
non-admin users see no customer data. Staff can read operational records and add
their own notes; only Owner/Administrator can manage catalogue/settings or approve
prices. Only Owner can assign roles; the last active Owner cannot be removed.
Price versions, quotation snapshots and audit history are retained. Quotation
transitions use optimistic revisions and do not automatically create bookings.

## Apply only after review

1. Connect Supabase and choose/create a dedicated **development** project.
   Check that no existing unrelated schema is being targeted. Production must
   use a separate project and separate Vercel environment values.
2. Review both files in supabase/migrations. Use Supabase's versioned migration
   workflow; do not paste/re-run raw schema files against an existing database.
   Apply once through the migration ledger, inspect grants and RLS, then run
   the same denial tests against hosted Supabase before approval for Production.
3. Disable public signup in the hosted Auth dashboard. Local config.toml already
   disables it; committing this file does not change hosted Auth settings.
4. Invite the owner-approved identity using the Supabase dashboard. The intended
   future owner email is bnombamba@icloud.com, subject to owner confirmation.
   No account/password is created by this implementation. After the invite is
   accepted, the reviewed development bootstrap script requires exact project
   ref, confirmed user UUID and approved email as arguments. It refuses to
   provision when any other membership exists and is idempotent for that Owner.
5. Configure server-only SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
   SUPABASE_SERVICE_ROLE_KEY, and random ADMIN_SESSION_SECRET (32 bytes, hex).
   Set exact APP_ORIGIN, ADMIN_RECOVERY_URL (origin/admin/login), and only then
   ADMIN_ENABLED=true on the approved development Preview. Keep Production false.
6. Configure Auth site/redirect URLs and recovery email template. Recovery links
   must target the exact approved /admin/login path with token_hash and
   type=recovery, for example the Supabase template variables:
   `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`.
   The BFF verifies recovery hashes with Supabase and admin membership before
   issuing a session. Supabase Auth email/SMTP setup is separate from bakery
   Resend notification configuration. Verify actual invitation and recovery
   delivery; the local tests send no email.
7. Confirm password sign-in, recovery, password update, refresh and logout with
   real Owner/Administrator/Staff test identities before Stage 9B cutover.

## Authentication and protected APIs

`/api/admin?action=` supports login, session, authorize, refresh, logout,
recover, recovery-session and password. There is no signup/invite endpoint.
POST requests require a configured exact Origin and JSON; session mutations
also require a CSRF token. Provider access/refresh tokens are encrypted in a
Secure, HttpOnly, SameSite=Strict host-only cookie and never returned to the
browser or stored in localStorage. Sessions have an absolute eight-hour limit
and a database revocation record. Supabase verifies tokens on protected requests;
roles are fetched from admin_accounts each time, never from user_metadata.
Business operations use the user's token/RLS. The service key is server-only
and limited in code to auth throttling, controlled recovery, session revocation
and explicit reviewed bootstrap. No private response may be cached.

The Stage 9A frontend shows sign-in/recovery and authenticated identity/role.
It deliberately does not connect the existing business dashboard until Stage 9B.
The existing internal/demo screens and their browser data remain preserved.

## Storage, catalogue and submission boundary

customer-references and product-drafts are private buckets with JPEG/PNG/WebP
limits. Customer objects have no browser upload/delete policies; future server
uploads validate signatures, counts, aggregate bytes and safe random paths.
Only authorised staff can read recorded references and create short-lived signed
URLs. No customer image is made public. Hosted signed-URL tests remain pending.

The catalogue exporter is a dry run only: 55 products, 43 cake templates,
44 original cake photographs and 12 treats/scones; stable IDs and existing
asset associations are preserved. Stage 9C must implement reviewed, idempotent
upserts and feature-flagged public DTO/caching. No product is imported now.

The existing public delivery switch stays false. Stage 9D must atomically store
customer/enquiry/quotation/reference metadata and outbox events, keep persistence
independent from Resend, and accurately distinguish stored from email-accepted
status. No new public submission endpoint is enabled in Stage 9A.

## Validation commands and limitations

`npm run typecheck`, `npm run lint`, `npm test`, `npm run test:delivery`,
`npm run test:foundation`, `npm run test:database`, `npm run build`, and
`node scripts/export-approved-catalogue.mjs`.

Database tests use real local PostgreSQL through PGlite with stand-in auth/users
and storage schemas. They verify migrations, grants, RLS and transactions, but
do not substitute for hosted Supabase Auth/Storage or multi-connection race tests.
Authentication tests inject provider responses, verify authorization boundaries,
CSRF, encrypted cookies, revocation, refresh and fail-closed behaviour. No email
delivery, hosted sign-in or cross-device live business persistence is claimed.
