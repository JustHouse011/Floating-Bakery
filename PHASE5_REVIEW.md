# Phase 5 — local administration review

Implemented locally for review. Open **http://127.0.0.1:5173/admin** on the same origin used to submit customer requests. The existing Vite development server remains available. Phase 6 has not begun.

## Implemented features

- Standalone administration layout with sidebar navigation, tablet/mobile drawer, keyboard Escape dismissal, page focus, storage feedback and local-demo access disclosure. Cream and lavender surfaces use the existing identity; operational typography distinguishes admin from the storefront.
- Overview metrics: actual request count, New, Under Review, Approved, Declined, upcoming non-declined requests and original estimated quotation value. Status distribution and submission activity charts expose their counts as accessible text. No requests or sales are fabricated.
- Products: creation/editing, archive/restore, the three existing categories, descriptions, starting prices with cents, external image URLs, homepage featured flags and designer eligibility. Public catalogue, detail, selected-product contact form and designer summary use the same reactive catalogue. Archived products disappear from public lists and detail pages; their pricing packages remain for saved designs and historical snapshots.
- Pricing: editable base sizes, flavour/frosting/decoration surcharges and charge scopes, personalised messages, tier construction charges/limits, package starting prices and included shape/size/tiers/flavour/frosting/decorations/message, plus per-package manual-review rules. Unsaved changes are previewed by the existing engine. Mandatory complex/reference-design review remains intact. Publishing validates rules and assigns a new version and South African effective date.
- Quotations: actual Phase 4 records, reference/customer/email search, status filters, inclusive event-date filters, original customer/event/design/reference/image/itemisation detail, lifecycle transitions, timestamped internal notes, immutable prepared revision history and printing. Internal notes and status-management forms are excluded from prints; the original snapshot and prepared revisions are included.
- Calendar: Monday-first month grid, previous/next/today navigation, request indicators, status filters, detail links and a readable mobile agenda. Local approval is explicitly distinguished from verified bookings. No submission or revision becomes an accepted order automatically.
- Reports: actual requests by status, base cake sizes, flavours, decoration selections, original estimated totals and upcoming event demand grouped by month. Empty states replace invented data. Extremely large aggregate amounts display a reporting-range message rather than rounded unsafe money.
- Settings: business information, initially blank contacts/address, collection instructions, an additional quotation disclaimer, lead days, supported delivery areas and ZAR formatting locale. Contact details can appear on the public contact page with a local-data label. New requests capture configured policies; original policies remain on old requests. A typed confirmation protects the demonstration reset.

## Architecture and files

Admin is lazy-loaded at `/admin/*` outside the customer `Layout`. The routes are `/admin`, `/admin/products`, `/admin/pricing`, `/admin/quotations`, `/admin/quotations/:id`, `/admin/calendar`, `/admin/reports` and `/admin/settings`.

New files:

- `src/pages/Admin/Admin.tsx`: shell, route layout, quotation loading/refresh and mobile navigation.
- `src/pages/Admin/RecordsContext.ts`: shared record/loading/error/refresh contract.
- `src/pages/Admin/AnalyticsPages.tsx`: overview, reports, charts, calendar and reusable statuses/empty states.
- `src/pages/Admin/ConfigurationPages.tsx`: product, pricing and settings forms.
- `src/pages/Admin/QuotationPages.tsx`: quotation filters, original detail, transitions, notes and revisions.
- `src/styles/admin.css`: scoped dashboard styling, responsive grids/drawer/tables, mobile calendar and quotation print rules.
- `src/types/admin.ts`: typed workspace, settings, notes, revisions, audit and administration repository interface.
- `src/services/localDatabase.ts`: shared database upgrade and transaction completion/abort handling.
- `src/services/adminRepository.ts`: validated persisted workspace, optimistic revision checks, audit append/read and confirmed atomic reset.
- `src/services/adminAnalytics.ts`: pure quotation filtering, calendar grouping and aggregate reports.
- `src/services/adminMoney.ts`: strict decimal-to-integer-cent form parsing.
- `src/store/adminStore.ts`: bootstrap, reactive products/settings and atomic catalogue/pricing publication actions.
- `src/hooks/useQuotationPolicy.ts`: configured policy for the customer request flow.
- `tests/admin.test.tsx`: administration, integration, persistence and migration tests.
- `PHASE5_REVIEW.md`: this report.

Modified files:

- `src/app/App.tsx`: local configuration bootstrap/retry, focus refresh and separate lazy admin route. If storage cannot load, public browsing remains available with the last loaded or seed configuration and an explicit warning; configuration saves stay blocked.
- `src/types/index.ts`: backward-compatible product archive/featured/designer flags.
- `src/types/quotation.ts`: optional captured delivery-area/disclaimer/collection policy fields, compatible with Phase 4 records.
- `src/pages/Home.tsx`, `src/pages/Cakes.tsx`, `src/pages/Contact.tsx`, `src/components/cakes/ProductCard.tsx`: live catalogue, archive/featured/eligibility behaviour and configured contact display.
- `src/pages/CakeDesigner/CakeDesigner.tsx`, `src/components/designer/DesignerSummary.tsx`, `src/store/cakeDesignerStore.ts`: active catalogue selection, labels and published inclusion presets.
- `src/services/cakeConfiguration.ts`: validated custom product identifiers and injectable preset rules; historical identifiers do not depend on a mutable catalogue.
- `src/services/estimateSummary.ts`: copied estimates use the active product name.
- `src/services/quotationSnapshot.ts`: product names from captured pricing packages; missing current packages cannot create an invalid request.
- `src/services/quotationValidation.ts`, `src/pages/Quotation/QuotationRequest.tsx`, `src/components/quotation/QuotationSummary.tsx`: configured lead time/delivery-area validation and immutable additional policy information.
- `src/services/quotationRepository.ts`: shared version-2 database opening while preserving its existing storage-error contract and lifecycle.
- `src/utils/currency.ts`: configurable English ZAR display locale; catalogue prices retain cents. Money remains ZAR.
- `scripts/test.mjs`: includes the administration suite.
- `tests/quotation.test.tsx`: direct corruption-test database access now opens schema version 2; all original regression cases remain.
- `README.md`: current routes, persisted configuration, reset semantics and local admin operation.

No production dependencies, backend configuration, lockfile updates or deployment setup were needed.

## Persistence and migration

The database remains **`floating-bakery-quotations`**, upgraded from version **1 to 2**. Upgrade creates `workspace` and `quotationAudit` alongside the original `quotations` store and unique `reference` index. Existing quotation rows and image Blobs are never rewritten by migration. Phase 4 quotation record version remains **1**; new request-policy fields are optional and validated when present.

`workspace` contains one schema-version-1 record with the catalogue, active rules, settings and revision counter. A missing workspace is seeded from the established six products and pricing rules. An invalid existing workspace is reported and never silently replaced. Submitted configuration is validated before writing and persisted state is validated before applying. Competing tab edits are rejected when their expected revision is stale. Foreground/focus refresh reloads local configuration and quotations.

Product publication commits catalogue names/prices and matching package names/prices together. Pricing publication synchronises package starting prices back to public products in the same transaction. Zustand and the existing pricing store update only after the transaction completes; an aborted write does not become active. All amounts supplied to the engine are safe integer cents.

`quotationAudit` is keyed by quotation ID. Notes and revised offers append inside a read/write transaction that validates the original quotation. Each revision captures the original estimate and indicative amount, original pricing version, full original configuration, reason, revised integer-cent amount and timestamp. Audit reads compare revisions against the original snapshot and reject tampered snapshots. Revisions do not mutate estimates or automatically change status. Status updates remain the Phase 4 repository's validated lifecycle:

`New → Under Review → Quoted → Approved` with the existing Awaiting Customer and Declined branches; Approved and Declined are terminal. Unsupported transitions fail at the repository boundary.

**Reset scope:** typing `RESET LOCAL DEMO` clears quotations (including their reference Blobs), admin audits and workspace, then restores seed workspace, in one transaction. It also clears the in-memory draft/design. Independent `floating:cake-design` and `floating:enquiries` localStorage data are retained, as disclosed in the UI. A retained custom-product design whose package was removed by reset receives a clear request-validation message until the customer chooses another inspiration or starts a standard design. No actual user data reset was performed during development; reset tests use isolated fake IndexedDB instances.

## Pricing and reporting conventions

`calculateCakeEstimate(configuration, rules)` remains the single pricing engine. Default assumptions and all existing Phase 3 cases remain covered. New products begin with a standard 8 inch vanilla buttercream baseline, explicitly disclosed before saving; edit their inclusions in Pricing. Archived packages remain in active rules for compatibility. Published versions have the form `local-<UTC timestamp>-r<workspace revision>`; effective dates use South Africa's calendar. Both copied estimates and designer product presets use the published rules.

Customer quotations capture complete rules and recompute only against that captured copy when validating storage. Admin configuration edits never recompute historical customer estimates. Configured disclaimers supplement the mandatory bakery-confirmation disclaimer. Collection instructions, supported delivery areas and lead time are captured in request policy. Blank supported areas mean area requests still need confirmation, not a promise of delivery.

Overview/report values sum **original numeric estimated totals**, including requests later declined; manual requests with only indicative amounts are excluded. Revised offers are shown separately in quotation detail. Values are not revenue. Cake-size reports count base sizes once per request; quotation detail retains the full tier-size list. Decoration reports count selected decoration flags. Upcoming demand excludes declined and past events but includes unconfirmed requests. Approval is local workflow approval; no confirmed-booking record exists in this phase.

## Verification

Final validation passed:

| Check                           | Result                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                      | Passed through production `tsc -b`; standalone typecheck also passed during implementation                                                                        |
| ESLint                          | Passed with no warnings or errors                                                                                                                                 |
| Automated tests                 | **158 passed**: all 104 Phase 1–4 regression cases plus 54 administration cases; no skipped tests                                                                 |
| Production build                | Passed; artifacts in `dist/`; existing large 3D chunk warning remains                                                                                             |
| Existing smoke checks           | Nine customer route variants server-rendered; enquiry persistence passed with simulated localStorage                                                              |
| Admin server rendering          | All seven admin navigation destinations, local access labels and main landmark covered in tests; catalogue/detail/home and data-driven report markup also covered |
| Development HTTP routes         | Seven admin destinations plus `/cakes`, `/cake-designer` and `/quote-request` returned HTTP 200                                                                   |
| Vite module transforms          | Admin pages, repository/store, admin CSS, customer request page and designer page returned HTTP 200                                                               |
| Production dependency isolation | No `fake-indexeddb`, `FDBFactory` or `fakeIndexedDB` signatures found in `dist/`                                                                                  |
| Browser interaction / GPU       | Not verified: no browser automation capability available                                                                                                          |

The administration suite covers creation/edit/archive/restore, live catalogue/detail/home eligibility, published presets, pricing versions/preview/rejection, search/status/date filters, revisions and concurrent notes, historical immutability, analytics/calendar grouping, old-database migration with a real image Blob, corrupt stored workspace/audit handling, aborted transactions, confirmed reset, captured policies, copied custom-product summaries and money formatting. Test logs are in ignored `.tools/phase5-tests.log`; build output is in `.tools/phase5-build.log`. PowerShell wraps Vite's stderr bundle warning as a `NativeCommandError` record in the redirected log; Vite completes successfully and emits its artifacts.

Final JavaScript sizes (Vite decimal KB):

| Chunk                       |  Minified |      Gzip |
| --------------------------- | --------: | --------: |
| Main application            | 457.13 KB | 146.14 KB |
| Administration, lazy        |  48.53 KB |  13.17 KB |
| Cake Designer page, lazy    |  17.63 KB |   5.80 KB |
| Customer request page, lazy |  15.71 KB |   5.87 KB |
| 3D scene, lazy              | 898.83 KB | 242.86 KB |

Admin CSS is 15.24 KB / 3.85 KB gzip. The main application grows from the Phase 4 build's 419.65 KB / 133.91 KB gzip because the local configuration bootstrap now brings catalogue/pricing validation and persistence into the public entry path. Admin screens and the 3D renderer remain deferred. Real browser load and frame times remain unmeasured.

Browser automation tools were inspected and none were available for this local app. HTTP route/module checks and React server rendering do not verify browser event handling, CSS layout, actual browser persistence, image loading, printing, clipboard or GPU behaviour. Outstanding customer browser/GPU checks were considered but could not be executed through this environment. The build warning is retained and documented; it has not been suppressed.

Manual review checklist:

1. Open `/admin` at the same origin as the storefront; inspect empty dashboard and all seven navigation destinations.
2. Add/edit a product, select category/featured/designer eligibility and inspect catalogue, detail, home and designer links. Archive and restore it. Reload to verify browser persistence.
3. Preview base, scope, decoration, tier and inclusion changes; try invalid prices and incompatible baselines. Publish valid rules, then verify the customer designer's estimate and preset. Keep an existing quotation open to confirm its original estimate/version remain unchanged.
4. Submit a customer request with an image. Return to admin; check search/date/status filters, full snapshot, image previews, notes and valid/invalid lifecycle transitions. Prepare two revisions and verify their original snapshot references and unaccepted labels.
5. Check calendar month boundaries, filtered indicators and detail links. Compare reports against saved requests and local status history.
6. Configure lead time, delivery areas, collection instructions and an additional disclaimer. Verify new requests enforce/capture them while older requests remain readable.
7. At desktop, tablet and narrow mobile widths, check drawer Escape/backdrop, fields, table scroll within its container, calendar agenda, focus and page overflow. Inspect printing, including exclusion of internal notes.
8. Exercise the customer 3D round/square sizes and tiers, orbit/pinch/reset, decoration placement and message plaque, colour/frosting changes, reduced motion, WebGL fallback/context loss and mobile frame rates. Check browser console errors.
9. In a browser profile containing only disposable demo records, try rejected reset confirmation, then the exact confirmation; verify quotes/images/audits are cleared, seeds restored and disclosed localStorage keys retained.

## Limitations and Phase 6 readiness

- This is a local demo with **no authentication or role enforcement**. The admin route is not secure. Anyone using the same browser profile and origin can inspect records. No access is implied by hiding navigation. Future Supabase authentication, row-level security and role checks must be implemented server-side.
- No Supabase backend, email, payment, GitHub push, Vercel deployment or Phase 6 work was performed.
- Browser storage is scoped by profile and origin, subject to quota and user clearing. Records are not shared across devices or `localhost` versus `127.0.0.1`. Configuration conflict checks prevent stale writes; this is not real-time multiuser synchronisation.
- Lists/reports load and validate local requests, including reference headers, in memory. Backend pagination, scalable aggregates, durable backups and production audit/authentication identities remain future work.
- Images are illustrative external URLs and fonts still require network access. Product categories remain the established three; arbitrary category taxonomy is not introduced.
- Local approval and prepared offers do not establish customer acceptance, actual revenue, delivery availability or verified bookings. ZAR is the only monetary currency; locale settings change its presentation.
- The 3D chunk is still about 899 KB minified / 243 KB gzip and exceeds Vite's 500 KB warning threshold. Loading it needs network transfer, JavaScript parse/compile and GPU work, which may delay first studio use on slower phones. It is separately lazy-loaded; public pages and admin do not eagerly load that scene. Demand rendering and DPR capped at 1.5 remain. The admin bundle is also lazy-loaded. No device timing or frame-rate claims can be made without browser/GPU measurements.
- Typed administration and quotation repositories, immutable customer snapshots, versioned configuration and separate audit metadata provide boundaries for future backend adapters. Production authentication, authorisation, migrations, notifications, acceptance/payment workflow and scalability require a separately approved Phase 6 brief.

Stop point: Phase 5 local review. No external publication was attempted.
