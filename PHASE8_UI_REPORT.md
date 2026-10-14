# Phase 8 — Global UI, motion & interactive experience

## Summary

The existing application now has a pure-white public design system with burgundy text/actions, rose details and small gold accents. The redesign retains the established editorial typography, official photographs, Chef Gugu story, navigation destinations and local customer/admin workflows. Product browsing and forms remain usable without decorative motion or WebGL.

The attachment contained the implementation prompt but no palette or underline reference image; no matching reference was found in `public`. The supplied approximate colour tokens therefore guided this implementation.

## Files

Created:

- `src/styles/public-theme.css`: scoped public surfaces, tokens, minimal controls, photography, navigation, cursor and motion styles.
- `src/components/layout/PublicInteractions.tsx`: scroll progress/header state, section/card observer, back-to-top and adaptive pointer accent, with cleanup.
- `src/components/ui/ProductPhoto.tsx`: shared reserved 4:5 photograph presentation using `BakeryImage`.
- `e2e/publicTheme.spec.mjs`: six-viewport visual/interaction regression coverage.
- `PHASE8_UI_REPORT.md`: this report.

Modified:

- `src/main.tsx`: loads the public theme after the baseline stylesheet.
- `src/styles/index.css`: changes the root background to white; existing admin surface variables remain intact.
- `src/components/layout/Layout.tsx`: public scope, shared interactions, focusable main landmark and lightweight route entrance wrapper.
- `src/components/ui/Reveal.tsx`: visible initial state and smaller, refined entrance motion.
- `src/components/cakes/ProductCard.tsx`: uses the shared photograph component.
- `src/pages/Home.tsx`: uses the same photo component for birthday/luxury previews.
- `src/pages/Contact.tsx`: clickable existing contact details, supplied website, general-area map and a synchronous duplicate-save guard; existing local submission service retained.
- `src/app/App.tsx`: makes hash navigation smooth only when reduced motion is not requested.
- `playwright.config.mjs`: includes the new responsive checks and enables touch emulation for phone-sized responsive projects.
- `e2e/responsive.spec.mjs`: verifies white public route backgrounds alongside retained route/accessibility tests.
- `README.md`: Phase 8 review information.

Local diagnostic scripts/logs under `.tools/` and browser evidence under `qa/evidence/` are QA artifacts rather than application dependencies.

## Colour tokens and surfaces

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-background`, `--color-surface` | `#FFFFFF` | Public pages, header, footer, forms and panels |
| `--color-rose` | `#CDA3A3` | Small decorative details |
| `--color-burgundy` | `#63323D` | Actions, active states and focus |
| `--color-gold` | `#C4A45D` | Decorative lines, underline sweep and cursor hover |
| `--color-text` | `#191919` | Primary text |
| `--color-text-muted` | `#666666` | Secondary copy |
| `--color-border` | `#E6E6E6` | Subtle panel separation |
| `--color-control-border` | `#A57B83` | Stronger rose-family control underline |

The public `.public-site` scope maps the existing cream/lavender/blush surface variables to white. Accents are confined to text, control states, lines and small details. Admin retains its previous surface hierarchy, with only the surrounding root changing to white. Warm tones contained in the original photographs/logos remain part of those supplied images.

The Designer's Three.js canvas retains its existing contrasting `#F0EDF5` scene background. Surrounding controls and summaries are white.

## Buttons and forms

Existing `.button`/`.text-link` classes and functional form controls are reused rather than replacing submission/navigation components. Public actions are transparent, square, underline-based controls with no boxed outline. Primary actions have a two-pixel burgundy underline; hover introduces a 280ms gold sweep and slight arrow movement. Click/pressed states give immediate colour/underline feedback. Controls retain at least 44-pixel click targets where applicable, existing disabled/loading logic and keyboard focus outlines.

Inputs, textareas, searches, dates and selects use white surfaces and one bottom border. Native date, select and file operations remain available. Checkboxes/radios/ranges and colour pickers retain their meaningful native or swatch presentation. Image gallery selection borders remain visible so the selected reference can be identified. Error text and validation logic remain intact; invalid fields gain a stronger bottom border.

Contact saves through the existing local service. A ref guards two synchronous submit events from saving duplicates and is reset by “Write another enquiry”. No email service or backend was added. Existing owner-configured contact values remain respected, with official values as defaults.

## Product photographs

`ProductPhoto` provides a reusable 4:5 image frame for cake, Sweet Treats, scone, featured/search-result cards and homepage birthday/luxury previews. The frame reserves space before loading, shares widths/heights within a grid and uses the existing responsive sources, lazy loading, async decoding and image fallback.

Client/menu photographs use `object-fit: contain` within that equal frame to preserve complete cakes, embedded branding and menu composition. Visible blank space can differ with the original aspect ratio; photographs are neither stretched nor destructively cropped to fill the frame. Detail galleries, the founder portrait and historical reference images retain their full composition. No source image, derivative, product ID or catalogue data was renamed/deleted/rewritten. All 44 original cake hashes still match the Phase 6 inventory.

Card hover scales the image by 1.025 on fine-pointer devices, accents the title and animates an underline. Important actions remain visible without hover. Reduced motion removes the scale transition.

## Contact map

Contact now ends with a “Find Us” section, a responsive lazy iframe titled “Google Maps: Thatchfield area, Centurion, South Africa”, and an external “Open in Google Maps” link.

The embed queries **Thatchfield, Centurion, South Africa** by area name at area zoom; it supplies no invented coordinates, storefront pin or street address. The caption asks visitors to contact the bakery to arrange collection. A static area description and external link remain available if the embed cannot load. No API key or additional map library was introduced.

The map was observed rendering Google’s Thatchfield area polygon and controls in Chrome. Evidence: `qa/evidence/final/phase8-map.png` and `.tools/phase8-map.log`. Google redirects the query embed to its own embed URL. Embedding/link conventions were checked against [Google Maps sharing help](https://support.google.com/maps/answer/7101463) and [Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started). The map requires internet and remains an external service.

## Motion, scrolling and navigation

The existing Framer Motion dependency remains the only animation library. Shared `Reveal` starts at visible opacity 0.92 with ten pixels of movement, and honours reduced motion. No dependency was installed.

Public section/card observers add 550ms fade-up entrances with eight pixels of movement and small card staggers. Content remains visible before observation and if animation fails. A mutation observer covers newly filtered cards and mounted quotation sections. A restrained 280ms route entrance does not delay React Router navigation. About's approved story and original `gugu.jpeg` portrait remain intact, with the existing gentle portrait entrance and animated divider.

The white header stays sticky, gains a light separation shadow after scrolling, and retains active links and drawer focus/Escape handling. Mobile opening and closing use short opacity/transform transitions without changing menu behaviour. A two-pixel scroll-progress line and keyboard-friendly back-to-top action support long pages. Back-to-top is suppressed in the Designer to avoid its mobile action bar. Hash navigation uses explicit smooth behaviour; native wheel/touch scrolling and ordinary route scrolling are not hijacked.

Scroll state is written to CSS once per scheduled animation frame rather than triggering React renders. Scroll/resize/pointer listeners, observers and pending frames are cleaned up on route changes/unmount. Reduced motion disables decorative animation and uses immediate back-to-top/anchor movement.

## Cursor

A small offset burgundy ring supplements the native cursor on fine-pointer, hover-capable devices. Interactive elements enlarge its ring slightly and change the ring to gold. It has `pointer-events: none`, does not replace the native cursor and stays away from the text-selection hotspot.

Touch and reduced-motion devices disable the accent. Blur/pointer exit hides it. Updates use one pending animation frame per pointer event sequence, with no permanent animation loop. No contextual labels or oversized cursor overlays were added.

## WebGL and performance

The existing lazy Cake Designer remains the sole WebGL renderer. Its pipeline was not modified: demand-driven frames, compact DPR 1 / desktop maximum DPR 1.5, low-power preference, existing static/error/context-loss fallback and conceptual-reference distinction are preserved. Catalogue, Contact and quotation submission do not depend on WebGL.

The optional homepage WebGL exploration was resolved with a small CSS perspective hover on the existing photograph. Homepage creates no canvas and does not request the CakeScene module. This provides subtle depth while avoiding an additional renderer, Three download, draw calls or competing animation loop. Touch/reduced-motion users keep a static photo.

The final production build passes with these measured bundles:

| Bundle | Minified | Gzip |
| --- | ---: | ---: |
| Main application | 500.64 KB | 158.37 KB |
| Client catalogue data | 58.68 KB | 4.55 KB |
| Lazy CakeScene | 901.08 KB | 243.71 KB |
| Application CSS | 49.09 KB | 11.02 KB |

Compared with Phase 7, the main grows by 4.51 KB minified / 1.41 KB gzip; CSS grows by 9.99 KB / 1.97 KB gzip. The main now slightly exceeds Vite's 500 KB advisory threshold, and the existing lazy Three chunk remains above it. Both warnings are documented, with no threshold increase. Catalogue and Three sizes remain unchanged. No physical-phone FPS, battery/heat or cold-network improvement is claimed.

## Validation and resolved defects

Strict TypeScript, ESLint, the production build and **222 existing unit/integration tests** pass on the final source.

**All 52 Chrome browser cases pass in one complete stable-source run** (14.4 minutes): 24 responsive cases across 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 and 360×800, plus 28 desktop/mobile customer, catalogue, GPU, quotation, admin and recovery journeys. All 46 earlier browser cases remain, with six new public-theme cases. Relevant existing checks cover native form validation, copy/refresh/back navigation, saved references and immutable pricing metadata, preview/publication persistence, keyboard/Escape/reduced motion, WebGL failure and corrupt/unavailable storage. The existing About layout-shift assertion below 0.1 passes at all six sizes.

The real Intel UHD / ANGLE Direct3D11 renderer passed **108 decorated configurations** (54 desktop and 54 mobile emulation), with textures bounded at four, plus orbit/zoom/reset and context-loss recovery. These are actual desktop GPU checks; mobile emulation does not establish physical-phone performance. Matrix evidence remains at `qa/evidence/final/journey-{desktop,mobile}-gpu-matrix.json`.

Focused desktop and touch-phone visual journeys pass on the completed source. They check white surfaces, minimal controls, equal 4:5 frames, actual form saving with duplicate prevention, map configuration, back-to-top/focus, native-cursor enhancement, reduced motion and absence of homepage WebGL loading. All 44 original photograph hashes were verified against the inventory.

Representative homepage, About, catalogue, Contact, official cake detail and actual Designer screenshots were captured; homepage/catalogue/Designer and map evidence were visually inspected. Computed-style checks confirm white surfaces and transparent, top-border-free actions on these pages. The dedicated audit recorded **zero console errors or page exceptions** across these six screens (`.tools/phase8-review.log`). This does not claim that intentionally simulated WebGL/storage failures never produce diagnostic messages.

Preliminary browser checks found inherited CSS overriding primary underline thickness, back-to-top positioning and official card aspect ratios; these were corrected. The public theme now loads explicitly after the baseline stylesheet. The cursor wrapper initially had zero area, making the browser visibility assertion unable to recognise its visible child; its one-pixel anchor now supports that check without blocking interaction. One preliminary test was interrupted by a development reload during source changes; final verification uses stable source. Original assertions and regression cases remain.

Evidence/logs: `.tools/phase8-{typecheck,lint,tests,build}.log`, `.tools/phase8-visual-final.log`, `.tools/phase8-browser-regression.log`, `.tools/phase8-review.log`, `qa/evidence/playwright-results-phase8-regression.json`, and screenshots under `qa/evidence/final/`.

## Remaining review limits

Physical iPhone/Android, Firefox/Safari/WebKit and a full screen-reader review remain unverified. Phone browser checks are touch emulation on desktop Chrome. Automated WCAG checks do not certify complete accessibility. External Google Fonts, the map and existing unrelated catering imagery require network access.

No business data was reset; all browser tests use disposable contexts. The R1,480–R1,950 vanilla base range and once-only R180 standard / R220 premium flavour additions remain unchanged. No pricing engine, historical snapshot schema, catalogue records or migration was changed. No push, deployment, backend, payment or live email was introduced. Local review: http://127.0.0.1:5173. Stop after implementation and validation for review.
