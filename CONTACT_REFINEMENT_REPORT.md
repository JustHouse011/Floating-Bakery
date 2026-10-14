# Contact Us refinement

The existing `/contact` page keeps its two-column introduction/form composition. The entire left-column “A note about this preview” notice and old contact block have been removed. A lazy interactive map occupies that space. Immediately below the main area, “We'd Love to Hear From You” presents Visit Us, Call Us and Email Us with matching Lucide icons and the approved supporting text.

## Changed files

- `src/pages/Contact.tsx`: moved/replaced map, relocated official contact details, directions links and preserved enquiry form.
- `src/styles/contact.css`: scoped white layout, responsive map heights, three-column contact section and restrained link/icon effects.
- `src/components/ui/Reveal.tsx`: optional delay with unchanged zero default, enabling a 70ms/140ms contact-item stagger. Reduced motion disables the delay and animation.
- `e2e/contactRefinement.spec.mjs`: new layout, contact, validation, accessibility, console and saved-record checks.
- `e2e/publicTheme.spec.mjs`: updates the existing map/heading/link assertions for this intentionally revised layout.
- `playwright.config.mjs`: includes contact checks and a dedicated 320-pixel project.
- `README.md` and this report: review information.

Diagnostic scripts/logs under `.tools/` and screenshots/results under `qa/evidence/` are local QA artifacts.

## Map and directions

The map uses Google's keyless query embed with the exact supplied name/address:

**Thatchfield Crescent Estate, Thatchfield, The Reeds, Centurion, 0158, South Africa**.

No coordinates, place IDs or street address were invented. Both external Get Directions links use the same named destination through `https://www.google.com/maps/dir/?api=1&destination=…`.

Chrome visibly rendered **“Thatchfield Crescent estate – Centurion.”**, with its estate marker, map controls and Centurion address. Opening the directions link produced Google's page titled **“Your location to Thatchfield Crescent estate - Centurion. - Google Maps”**. Provider-generated coordinates in Google's resolved URL are not hardcoded in the application. Evidence: `qa/evidence/final/contact-refinement-map.png` and `.tools/contact-refinement-map.log`.

The supplied knowledge-graph search reference could not be inspected independently: the web tool could not access it, and Google Search presented a traffic challenge in Chrome. The actual named map and directions destination were verified directly instead. The external map requires internet.

## Contact details and responsive layout

Visit Us shows the estate, Thatchfield/The Reeds and Centurion/0158/South Africa. Call Us uses **073 126 8382** with `tel:+27731268382`. Email Us uses **guguminnaar@gmail.com** with `mailto:guguminnaar@gmail.com`. The website remains in the existing footer. These are the explicitly supplied contact values; no stored admin contact settings were rewritten.

Desktop/tablet widths above 800 pixels keep two main columns, a 380-pixel map and three horizontal contact items. At 800 pixels and below, introduction → map → form → contact items stack in that order. Map height is 320 pixels, reduced to 290 pixels below 381 pixels. At 320 pixels, the heading and name/email rows also adapt. Thin neutral map/panel dividers, white surfaces, underline-only inputs and existing focus indicators remain.

Existing `Reveal` handles the map entrance and contact stagger; icons have a small hover movement and rose colour change, and links reuse the global animated underline. No animation dependency was added. Reduced-motion preferences remain respected.

## Submission and validation

The same local enquiry service, required fields, consent, telephone character/length policy, save guard and saved confirmation remain. Existing enquiries are appended to, not reset. Consent, “Save Demo Enquiry” and the confirmation still make the actual local-only behaviour clear, without retaining the removed left-column notice.

The new console audit found an inherited invalid HTML telephone pattern: literal parentheses/hyphen were rejected by current Chrome's pattern parser. They are now escaped correctly. This restores the existing intended allowance of digits, plus, spaces, parentheses and hyphen for 7–20 characters; it does not introduce a new telephone policy. Browser tests verify invalid letters are rejected and normal South African digits are accepted. The service and saved record format were not changed.

**The form does not send email or notify the bakery. A live server/email integration is required before production if form delivery is expected.** None was added during this task. The direct mailto link opens the user's mail client separately.

## Validation

- TypeScript, ESLint, all **222 existing unit/integration tests**, and the production build pass.
- **13 targeted Chrome browser cases pass**: seven Contact refinement cases at 1920, 1440, 1024, 768, 390, 360 and 320 pixels, plus six retained public-theme journeys.
- Checks include removed notice/block, inline map placement and dimensions, estate query/directions destination, new section order and column counts, exact telephone/email links, native validation, preserved existing enquiry, duplicate prevention, no horizontal overflow, automated WCAG checks and zero console errors/page exceptions in the contact journeys.
- The actual estate map and external directions were checked separately in Chrome. Desktop and 320-pixel layout screenshots were visually inspected.
- Separate lazy-load checks confirmed Google's interactive map region renders at both 390 and 320 pixels, with no page overflow. Actual mobile map evidence: `qa/evidence/final/contact-refinement-map-{390,320}.png` and `.tools/contact-refinement-mobile-map.log`. These checks waited for the external frame to render; full-page layout screenshots can otherwise capture it before the lazy load completes.

Logs: `.tools/contact-refinement-{typecheck,lint,tests,build}.log`, `.tools/contact-refinement-browser-final.log`. Structured browser results: `qa/evidence/playwright-results-contact-refinement-final.json`. Screenshots: `qa/evidence/final/*contact-refinement*.png`.

The production build retains the documented bundle-size advisory; no threshold was raised. Physical phones, Firefox/Safari and complete assistive-technology testing remain unverified. Browser phone tests are Chrome touch emulation. No pricing, cake assets, Designer pipeline, quotation schema, admin workflow, backend or stored owner data was changed. No push or deployment.

Local review: http://127.0.0.1:5173/contact.
