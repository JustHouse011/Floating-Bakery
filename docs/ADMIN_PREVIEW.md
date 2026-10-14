# Administration preview

The owner requested a hosted mock admin while the shared backend is pending.
Intended future administrator: bnombamba@icloud.com. This is informational;
access currently uses the Floating Bakery Vercel project's sign-in protection,
not an email field in the app.

Run `npm run build:admin-preview`, then deploy the generated Build Output with
`vercel deploy --prebuilt --target preview`. Confirm Preview environment and
Vercel authentication protection before sharing the URL. Never promote this
mock deployment to Production. The script rejects a Production build environment.

The `/admin` screens use isolated browser storage on the unique Preview origin.
Changes survive refresh in that browser but do not affect other users or the
Production catalogue. Customer submission APIs are absent and return unavailable.
The normal public build keeps `/admin` disabled. Supabase, application sign-in,
shared persistence and real quotation management remain future work.
