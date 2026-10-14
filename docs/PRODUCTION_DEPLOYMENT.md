# Preview deployment and email configuration

The default `npm run dev` and `npm run build` produce the customer site. The public bundle uses the supplied official catalogue, not browser-local administration settings or quotation records. Historical internal tools remain available through `npm run dev:internal` and `npm run build:internal`. Never deploy the internal output.

## Deploy for review

Use the existing repository `JustHouse011/Floating-Bakery`, branch `main`. Framework: Vite; build: `npm run build`; output: `dist`; Node: 22. API functions are in `api/`; `vercel.json` defines route rewrites, included cake reference images and response security headers.

Authenticate Vercel through the connected plugin or `vercel login`, link the intended project, then deploy with `vercel deploy --target preview`. Check that Vercel reports the Preview environment before publishing. Do not use anonymous `--temporary`: the tested CLI only supports production for anonymous deployments. Do not use `--prod` or change DNS for this review.

Vercel documents that a new project's first deployment is classified as Production. Do not assume an explicit Preview flag overrides this. The owner has expressly prohibited an empty Production placeholder, so the new `floating-bakery` project must stay undeployed until a supported Preview-only initialization path is available. A proposed Production-blocking API policy was rejected as unavailable on this Hobby account. Deploying a Preview under an already-initialized project requires the owner's explicit choice; no existing project's Production or Git connection may be changed as part of that workaround.

Automatic Git deployments are disabled by `git.deploymentEnabled:false` during review. Approved commits can still be pushed to GitHub, and manual Preview deployment remains the intended workflow.

No email credentials are required for a review-only preview. Leave `ENQUIRY_ENABLED=false` and the sender empty. `/api/status` returns `enabled:false`; contact, product enquiry and quotation submissions are visibly unavailable with direct email/phone alternatives. The site never silently saves a customer submission locally. Preparing a design or filling in a form is not delivery.

Preview pages are noindex and omit canonical URLs. `PUBLIC_SITE_URL` is intentionally empty until the bakery confirms its production domain. Preview builds explicitly ignore that variable even if inherited. A confirmed HTTPS production URL enables canonical metadata, crawlable sitemap URLs and robots rules. Product pages have build-generated metadata in addition to client navigation updates.

## Server-only environment variables

Copy names from `.env.example` into Vercel's environment settings; configure secrets there, never in source or chat and never with a `VITE_` prefix.

| Variable | Purpose |
| --- | --- |
| `ENQUIRY_ENABLED` | Explicit service switch; default false. Enable only for controlled verification, then after successful delivery checks. |
| `RESEND_API_KEY` | Resend credential permitted to send and read the configured domain verification status. |
| `RESEND_FROM` | Approved plain email address on the verified sending domain; no fallback address. |
| `RESEND_DOMAIN_ID` | Resend domain ID; the API checks verified status and matches its name to the sender domain. |
| `ENQUIRY_SECURITY_SECRET` | Random server-only HMAC secret, at least 32 characters. |
| `UPSTASH_REDIS_REST_URL` | HTTPS Redis REST endpoint for shared rate limits and receipt idempotency. |
| `UPSTASH_REDIS_REST_TOKEN` | Redis credential. |
| `APP_ORIGIN` | Exact additional allowed origins, comma separated. The current `VERCEL_URL` is also permitted. |
| `PUBLIC_SITE_URL` | Confirmed HTTPS production origin; intentionally empty for this review. |

The recipient is fixed server-side to `guguminnaar@gmail.com`. Customer email is validated and used as Reply-To. Prices and product references are recomputed from trusted official data. Resend acceptance is required before the success message appears; this is provider acceptance, not proof of inbox placement.

Reference uploads support JPEG, PNG and WebP, up to three images, 512 KiB each and 1.5 MiB total. The server restricts encoding, size and file signatures and generates attachment names. Official cake enquiries also attach the trusted original product photograph and the full validated design JSON. SVG, remote image URLs and customer-selected recipient addresses are unsupported. The original 44 cake photographs and their associations remain intact.

Rate protection uses signed two-hour form challenges with a two-second minimum age, a contact honeypot and five new attempts per IP hash per 15 minutes. Redis stores only receipt reference/body hash and HMAC IP rate counters, not customer details or image contents. Duplicate accepted submissions reuse the receipt; Resend also receives an idempotency key. Failed submissions retain form details in memory. Reference images and customer fields are not written to browser customer databases by the public application. Saved cake designs remain a browser feature and do not submit an enquiry.

## Verify before enabling customers

1. Verify sender/domain in Resend and provision the Redis configuration. Set the exact preview origin if using an alias beyond `VERCEL_URL`.
2. Enable the service for controlled tests. Verify `/api/status` returns enabled and a challenge.
3. Send contact, cake quotation with a supported reference photograph, and non-cake product enquiries using test customer details. Confirm arrival at the bakery inbox, working Reply-To, readable design summary, original cake photograph and full design attachment.
4. Repeat the same request ID to verify one message, simulate provider/Redis failure and confirm no success is displayed. Check edited retry details use a new submission ID.
5. Confirm every nested page can be refreshed; catalogue/detail/designer integration, mobile navigation and disabled admin routes work on the actual Preview URL.
6. Keep submissions disabled if any live test fails. Only promote after all release blockers are resolved and the production domain is confirmed.

Local checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:delivery`, `npm run build`, `npm run test:production-browser`. Delivery tests use injected mocks and send no real email. See [Phase 8 readiness report](PHASE8_PRODUCTION_READINESS_REPORT.md) for completed checks and outstanding external access.

Implementation references: [Vercel Vite integration](https://vercel.com/docs/frameworks/frontend/vite), [Vercel CLI deployment](https://vercel.com/docs/cli/deploy), [Resend send email API](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Upstash Redis REST](https://upstash.com/docs/redis/features/restapi).
