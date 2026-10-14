# Phase 4 review — Customer quotation requests

Implemented locally on 13 October 2026. Start at `/cake-designer`, review the design / demonstration estimate and select **Request This Cake**. This feature saves requests in the current browser only.

## Features implemented

- Prominent studio request buttons on desktop and in the mobile action bar.
- A four-step form at `/quote-request`: customer details, occasion, references, review / save, with progress indicators, inline errors, accessible labels, error focus and step-heading focus.
- Full name, email, South African contact number and Email / Phone / WhatsApp preference. Domestic and international formats are normalised; this does not verify ownership, assignment or reachability.
- Event type, date, collection / delivery, conditional delivery area, guest count and special instructions. Supported types are Birthday, Wedding, Baby shower, Corporate event, Anniversary and Other.
- Johannesburg calendar-date validation, including a final date check immediately before snapshot creation. Demonstration lead time is configurable and defaults to zero; no real bakery lead time, delivery fee or availability policy is invented.
- Optional JPEG, PNG and WebP references, with type / extension / size / content-signature checks, browser decoding, object-URL previews and removal. Limits are three files, two MB each and four MB total. URLs are cleaned up; references are not stored as base64.
- Automatic manual review for references, without changing the studio's visual state. Bespoke / wedding review flags continue to use the existing pricing engine.
- Final review includes customer and event details, complete cake configuration, itemisation, manual notices, reference previews, pricing version and bakery-confirmation disclaimer. Back / edit actions retain the design and form values.
- Active-price recalculation at submission. If the reviewed estimate changed, the form requests another review instead of silently accepting a new amount.
- Collision-resistant references in `FB-YYYY-XXXXXXXXXXXXXXXX` format: 16 cryptographically random hexadecimal characters, a separate UUID record ID, unique reference index and bounded collision retries. Duplicate submits for the same draft return the same saved request.
- Confirmation at `/quotations/:id` with reference, name, event date, snapshot and estimate / manual state. It explicitly says “Quotation request saved in this demonstration” and that the bakery has not received an email or confirmed a booking.
- Copy-reference action with manual fallback, print summary, homepage return and new-design action. The confirmation can be reopened by its URL in the same browser / origin.

## Architecture and persistence

The quotation draft has a separate Zustand store with a captured copy of the current cake configuration. Form navigation does not mutate the designer. Draft fields / files remain in memory while navigating this app; a reload intentionally does not retain an unfinished customer form. Submitted records persist independently.

Validation, attachment checking, snapshot creation, submission and repository operations are separate services. The submission service validates every field and reads active rules after asynchronous validation. It reuses `calculateCakeEstimate` and `tierDimensions`. The existing estimate panel was refactored into a reusable receipt plus its original live-designer wrapper; the review and confirmation render their explicit snapshots without recalculating against today's prices.

`IndexedDbQuotationRepository` stores version 1 records in the separate `floating-bakery-quotations` database / `quotations` object store. A record contains metadata, customer / event details, image Blobs, status history and a deeply frozen snapshot: configuration, actual tier sizes, selected product, complete pricing rules, itemised estimate, review flags, disclaimer and intake-policy snapshot. Metadata and Blobs are committed together in one transaction; success is reported only after transaction completion. Existing localStorage keys are not altered.

Read operations validate record versions, identity, fields, status history, attachment metadata / contents, tier dimensions and the estimate against the captured pricing rules. Bad records are rejected, not silently repaired or deleted. Returned records are cloned and frozen. Later design edits, active-price changes and status updates cannot change the original snapshot. Unavailable, full, blocked and corrupt storage produce recoverable messages rather than a false save confirmation.

The repository supports `create`, `getById`, `list({ search, status })` and `updateStatus`. Search matches reference, customer name or email. Status updates are validated in a read/write transaction and retain the original snapshot. Demonstration transitions are:

| From                | Allowed next statuses                 |
| ------------------- | ------------------------------------- |
| New                 | Under Review, Declined                |
| Under Review        | Awaiting Customer, Quoted, Declined   |
| Awaiting Customer   | Under Review, Declined                |
| Quoted              | Awaiting Customer, Approved, Declined |
| Approved / Declined | Terminal                              |

Updating to the same status is a no-op. These are editable demonstration workflow rules, not confirmed business policy or production authentication. There was no existing admin foundation, so no `/admin` pages or Phase 5 features were added.

The transaction-completion approach follows the [IndexedDB usage documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB). Persistence tests use [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) in Node; it is a development-only dependency and does not ship in the app.

## Files created

- `src/types/quotation.ts`, `src/data/quotation.ts`, `src/utils/quotation.ts`
- `src/services/quotationValidation.ts`, `referenceImages.ts`, `quotationSnapshot.ts`, `quotationRecord.ts`, `quotationRepository.ts`, `quotationService.ts`
- `src/store/quotationDraftStore.ts`
- `src/components/quotation/ReferenceGallery.tsx`, `ReferenceUploader.tsx`, `QuotationSummary.tsx`
- `src/pages/Quotation/QuotationRequest.tsx`, `QuotationConfirmation.tsx`
- `src/styles/quotation.css`
- `tests/quotation.test.tsx`
- `PHASE4_REVIEW.md`

## Files modified

- `src/app/App.tsx`: lazy request / confirmation routes and titles.
- `src/pages/CakeDesigner/CakeDesigner.tsx`: captured-draft request actions.
- `src/components/designer/EstimatePanel.tsx`: reusable snapshot receipt; live pricing preserved.
- `src/components/designer/DesignerControls.tsx`: availability note now points to the reference-upload flow.
- `src/styles/designer.css`: request-button styling and five-button mobile action layout.
- `src/pages/Home.tsx`: one availability note updated to mention local quotation requests; homepage design preserved.
- `scripts/test.mjs`: adds the quotation suite.
- `package.json`, `package-lock.json`: development-only IndexedDB test emulator.
- `README.md`: workflow, limits, local storage and scope documentation.

Catalogue data / prices, 3D geometry, active pricing logic, saved-design migration and existing contact behaviour were preserved.

## Validation results

- Dependency installation succeeded.
- TypeScript passed for application and test sources.
- ESLint passed without warnings.
- All **104 automated tests** passed: the existing 72 plus 32 quotation tests covering form / phone / date / delivery validation, file restrictions, manual-review triggers, recalculation, immutable snapshots, references, IndexedDB create / retrieve / list, search / filtering, transitions, duplicates, collision retries, storage errors, corrupt-record rejection and saved-design migration compatibility.
- Production build passed.
- The original Phase 1 route / enquiry smoke script was rerun separately and passed.
- Local request / confirmation routes and their transformed modules returned HTTP 200. These confirm server readiness, not browser interaction.
- Browser automation and GPU testing were unavailable. The full customer click journey, actual image decoding / previews, real browser storage / clipboard permissions, print output, desktop / mobile overflow, live GPU-rendered cake / price agreement and console errors remain unverified. Node tests use a simulated IndexedDB implementation and server rendering; they do not substitute for real browser checks. No actual browser customer records were created during testing.
- Quotation pages are lazy-loaded. The request page is about 5.57 KB compressed, confirmation page 1.74 KB, shared quotation services / components 5.79 KB. The initial storefront is about 133.91 KB compressed. The renderer remains separately lazy-loaded at about 242.86 KB compressed and still triggers Vite's 500 KB uncompressed chunk warning. It is not needed by the quotation form or confirmation. No warning threshold was suppressed and no 3D feature was removed. Actual device loading impact cannot be determined without browser / GPU profiling.

## Browser review checklist

1. On desktop and a narrow phone viewport, customise a cake, inspect its estimate and select Request This Cake.
2. Submit empty / invalid customer fields; verify inline errors and focus. Try local and `+27` contact formats.
3. Try a past date, delivery without an area, invalid guest counts and back / edit actions. Check that the captured design stays unchanged.
4. Attach each supported image type, reject an oversized / wrong-type file, remove a preview and verify manual-review pricing. Confirm small photographs decode correctly on the actual device.
5. Review customer details, event, colours, tiers, selected extras, message, receipt and references. Save the demo request and verify its local reference / disclaimer.
6. Reopen the confirmation URL, copy the reference with and without clipboard permission, and inspect print preview.
7. Start another design, change pricing and reopen the previous confirmation; its snapshot should stay unchanged.
8. Revisit the outstanding Phase 2–3 checks: mouse / touch rotation, zoom, colour / tier / decoration updates, WebGL fallback, mobile overflow and console errors. Profile the first renderer load on a representative phone if performance evidence is required.

## Known limitations and Phase 5 readiness

Data belongs to the current browser and origin. Unfinished drafts are memory-only; completed requests can be lost if site data is cleared or browser storage is unavailable. Reference previews / decoding depend on browser support. Phone checks validate format only. Lead time, intake limits, delivery coverage, availability and every price remain demonstrations awaiting bakery confirmation.

Phase 5 can consume the repository's listing / search / filtering, validated record retrieval, image Blobs and transaction-safe status updates. No admin dashboard, production access controls or authentication are implemented. Future real submission must add appropriate server-side validation and persistence, actual bakery communication and approved booking / delivery rules.

No Supabase, email, payment gateway, production customer data, deployment or GitHub push was introduced. Work stops here for Phase 4 review.
