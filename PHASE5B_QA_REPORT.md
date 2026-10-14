# Floating Bakery & Caterers — Phase 5B QA report

13 October 2026. Local repairs and validation of Phases 1–5. Existing architecture, pricing engine, historical snapshots and user-owned data are preserved. No deployment, push, backend, authentication, email, payment integration or Phase 6 work.

## 1. Initial audit findings

All 158 original tests, TypeScript, lint and baseline build passed. Chrome inspected 16 routes at six sizes (96 combinations), finding no overflow or page exceptions. Verified problems included a failed hero/floral photo, incorrect seed photography, accessible-name/contrast failures, mobile toolbar overlap, incomplete drawer focus behaviour, reduced-motion reveals, refresh loss of current edits and excess GPU resource allocation.

The supplied Cake Shop inspiration website opened successfully in Chrome (HTTP 200, Home - Cake Shop). Lavender, typography and spacing informed restrained polish of the established design. No business claims or contact details were invented.

## 2. Issues identified

See [PHASE5B_ISSUE_REGISTER.md](PHASE5B_ISSUE_REGISTER.md) for reproduction, priority and disposition. Later GPU inspection found decoration/stand contact gaps and pale plaque text. The final console audit also exposed a missing favicon.

## 3. Severity classification

High: main image failure, accessibility failures and shadow texture growth. Medium: session continuity, mobile interaction, drawer focus, decoration contact/readability and large scene bundle. Low: small targets, technical customer wording and missing icon. No critical issue was found. Bundle weight remains documented; device testing remains pending.

## 4. Issues fixed

Added attributed local illustrative cake photographs, exact canonical seed URL aliases and reusable image-error fallback without rewriting catalogue records. Fixed brand accessible naming, admin contrast, reduced-motion visibility, drawer focus containment/Escape/restoration and breakpoint scroll-lock cleanup. Mobile estimate/request controls remain visible; secondary controls expand under More design actions. Camera fit follows actual decorations; mobile inputs and targets are larger.

Validated configuration-only session storage restores unsaved edits in the same tab. Origin metadata prevents a product URL from undoing Reset on refresh/focus while allowing another catalogue product to load its preset. No cached prices, contact information or image blobs enter session storage. Independent manual-save and enquiry keys remain untouched.

Repeated decorations use instanced geometry/materials. Contact shadows retain render targets and refresh only when their silhouette changes. Buttercream uses a shared generated bump texture. Flower/drip/pearl contact, stand supports and pale message lettering were corrected. Cake dimensions, rules and stored selected colours remain unchanged. Explicit favicon removes the observed console 404.

## 5. Files modified

Application changes span `src/pages/CakeDesigner/CakeDesigner.tsx`, `src/pages/Home.tsx`, `src/pages/Info.tsx`, `src/pages/Cakes.tsx`, ProductCard, public/admin layouts, Reveal, DesignerViewport/Summary, designer/admin/shared styles, admin workspace reset, upload-error wording and CakeScene/Model/Tier/decorations. Added `src/components/ui/BakeryImage.tsx`, `src/hooks/useDrawerFocus.ts`, `src/utils/productImages.ts`, `src/services/sessionDesign.ts`, `src/three/Decorations/InstancedDetail.tsx`, `src/three/Materials/frostingTexture.ts` and `src/three/Materials/textColour.ts`. Local photographs, SVG fallback and attribution are under `public/images/`; `index.html` references the icon.

QA additions: `playwright.config.mjs`, `e2e/`, `scripts/qa-*.mjs`, `tests/qa.test.tsx`, test-runner registration, package scripts/development dependencies/lockfile, ESLint QA globals and generated-report ignores. Added this report, issue register, manual-device list and README notes. No database migration or production testing imports.

## 6. Screenshots and browser evidence

Local, ignored evidence under `qa/evidence/` includes:

- `baseline/audit.json`, screenshots and GPU counters before repairs.
- `handover/audit.json`: final 96 route/viewport inspections.
- `final/`: responsive/workflow/GPU screenshots and matrices, `designer-mobile-viewport.png`, `gpu.json`, `performance.json` and clean `handover-console.json`. E2E captures scroll to load lazy images.
- `reference/cake-shop.png` / `result.json`: supplied inspiration website.
- `playwright-results-handover.json`, `playwright-results-review.json` and their HTML reports/traces; `playwright-results-edge-review.json`.
- `bundle-before.json` / `bundle-final.json`: module contribution inspection. `.tools/phase5b-*-final.log`: final validation commands.

Photographs are illustrative, not verified bakery portfolio images; attribution is documented separately.

## 7. Responsive testing results

| Size | Layout coverage | Accessibility |
| --- | --- | --- |
| 1920 × 1080 | 16 routes passed | Representative routes passed |
| 1440 × 900 | 16 routes plus desktop workflows passed | Representative routes passed |
| 1024 × 768 | 16 routes passed | Representative routes passed |
| 768 × 1024 | 16 routes; stable rerun passed | Representative routes passed |
| 390 × 844 | 16 routes plus touch-emulated workflows passed | Representative routes passed |
| 360 × 800 | 16 routes passed | Representative routes passed |

Final audit: zero overflow, page exceptions, broken loaded images or failed requests. Its sole console error was the favicon 404, subsequently fixed and rechecked clean on homepage/designer. Playwright runs Axe on nine representative routes at each size using WCAG 2 A/AA and 2.1 A/AA tags. Keyboard drawers, resizing and reduced motion also pass. This is not complete WCAG certification.

## 8. 3D rendering findings

Actual WebGL renderer: ANGLE Intel UHD Graphics (0x9B41), Direct3D11, vs_5_0/ps_5_0. Desktop and touch-emulated matrices each render 54 configurations: all supported shape/size/tier combinations, three finishes and all decorations/message. Checks verify rendered geometry, current price, bounded textures and flower surface contact. Mouse/synthetic touch orbit, wheel zoom, reset, forced context loss and unavailable WebGL are exercised; quotation controls remain available. Demand rendering/mobile DPR cap are retained.

| Same measured scene | Before | After |
| --- | ---: | ---: |
| Default draws | 14 | 7 |
| Default triangles | 9,890 | 8,610 |
| Decorated draws | 115 | 42 |
| Decorated triangles | 28,150 | 26,870 |
| Decorated geometry objects | 121 | 42 |
| Decorated textures after edits | 15 | 4 |

Decorated draws fell 63.5%; textures remained bounded at four through 108 render cases. These are renderer counters, not VRAM bytes or an FPS claim. Mobile emulation still uses the desktop Intel GPU.

## 9. Pricing verification

All original engine tests remain. Render matrices compare the displayed estimate with the live engine/store. The customer journey verifies vanilla R450 and square/pearls/message R580. Session regressions verify recalculation rather than cached estimates. Admin draft/publish changes new estimates while original historical snapshots remain unchanged. Existing tests retain invalid-rule, inclusion, manual-review and rounding coverage.

## 10. Quotation workflow verification

Desktop/mobile journeys cover catalogue/detail selection, design edits, refresh, form validation, phone/date/delivery, back navigation, review consent, local submission, IndexedDB inspection, confirmation refresh, real clipboard copy and print invocation. Real decodable PNG/JPEG/WebP fixtures exercise uploads, unsupported/oversized rejection, removal/re-add and the three-image limit. Stored R580 and three references are checked directly.

IndexedDB unavailable yields a recoverable error without false confirmation. Corrupt saved design and quota errors leave the current cake usable. No quotation is delivered to the bakery. Contact form drafts persist across SPA navigation in memory; full-refresh restoration is only promised for cake configuration.

## 11. Admin workflow verification

Verified product create/edit/archive/restore, public synchronisation, failed-image fallback, validated pricing preview/publication, status transitions, append-only notes and prepared revision/reason, unchanged original snapshot, calendar/status filters, reports and settings persistence. Print CSS excludes internal notes. Explicit reset was exercised only in disposable isolated browser contexts with test-created records. Owner data was neither opened nor reset. Admin remains openly accessible local demonstration software.

## 12. Performance findings

Direct Drei imports reduced transformed modules from 2,616 to 2,372, without reducing emitted 3D bytes. Lazy loading remains intact. Three/Fiber imports dominate the chunk; renderer replacement was outside scope.

| Chunk | Before minified / gzip | Final minified / gzip |
| --- | --- | --- |
| Main | 457.13 / 146.14 KB | 459.62 / 146.96 KB |
| Lazy 3D | 898.83 / 242.86 KB | 901.07 / 243.70 KB |
| Lazy admin | 48.53 / 13.17 KB | 48.77 / 13.25 KB |
| Designer page | 17.63 / 5.80 KB | 19.38 / 6.38 KB |

Scene bytes increased about 0.25% with the fixes; Vite's >500 KB warning remains visible and its threshold was not raised. Final build log records the final artifact sizes/hashes.

Production-preview single samples on the desktop GPU, unthrottled and under QA load: desktop/mobile home LCP 2,012/1,488 ms; designer 244/228 ms; admin 120/164 ms. Price updates: 11.9/13.1 ms. A 719 ms desktop scene long task remains a weaker-device concern. Designer/admin samples use warm cache after home. These are not Lighthouse scores, cold mobile measurements, SLAs or proof of load-time improvement. Raw navigation/resource/long-task measurements are in `final/performance.json`.

## 13. Automated test results

**168 unit/integration tests**: all 158 original cases plus ten regressions. Final TypeScript, lint, production build and nine-route/enquiry smoke checks pass; logs are under `.tools/`. The final production build is recorded in `phase5b-build-verified.log`; earlier build logs remain as audit evidence.

**30 unique Chrome cases pass across handover and targeted rerun**: 12 responsive/Axe and 18 desktop/mobile workflow/GPU cases. Handover had 28 passes and two failures; the stable 20-case rerun passes every tablet/journey case, including both failures. This is not represented as a single clean 30-case run. **Two final Edge desktop customer/admin journeys pass**; Edge is another Chromium browser, not another engine.

Investigated harness failures: incorrect accessible-name selectors; a signature-only PNG unit fixture rejected by browser decoding; bare Vite imports creating duplicate inspector stores; shared output directory races; navigation aborted during live source edits; premature desktop use of the hidden mobile action summary. Corrected selectors, canvas-generated real fixtures, exact loaded module URLs, distinct QA_RUN paths, stable reruns and a breakpoint-aware helper resolved these. Broader Axe found a real calendar contrast defect, fixed in CSS. An early missing mobile pricing notice did not reproduce in isolation/final stable journeys. Final lint initially included generated Playwright trace bundles; only generated directories were excluded, source checks retained. No original test was removed or weakened.

## 14. Remaining limitations

See [PHASE5B_MANUAL_DEVICE_CHECKS.md](PHASE5B_MANUAL_DEVICE_CHECKS.md): real phones, low-power GPUs, Safari/WebKit/Firefox, screen readers, trackpads/pinch, zoom/forced colours, native pickers, clipboard denial, physical printer and offline/slow-network checks. Firefox/WebKit binaries were not available. Google Fonts and remaining illustrative about/catering photos require network access; local sample photos have fallbacks. No owner historical browser records were used for QA. Session storage is tab-specific; persistent records are origin-specific. No remote backup, access control, booking or delivery is implied. Bundle weight and initial scene construction remain performance limitations. No unresolved critical/high defect is known in the tested scope.

## 15. Readiness assessment for Phase 6

Ready for local review and Phase 6 planning, subject to the listed manual/device/cross-engine checks before broader release claims. It remains a local demonstration. Phase 6 has not begun. Development server remains http://127.0.0.1:5173. No changes were pushed or deployed.
