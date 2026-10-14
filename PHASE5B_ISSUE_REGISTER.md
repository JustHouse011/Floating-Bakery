# Phase 5B prioritised issue register

Baseline: 158 unit/integration tests, TypeScript and ESLint passed. Chrome responsive audit covered 96 route/viewport combinations without page overflow or JavaScript exceptions. Accessibility checks on six representative routes at desktop and mobile found the issues below. Evidence: `qa/evidence/baseline/audit.json` and PNGs.

| ID | Severity | Reproduction / evidence | Affected components | Status |
| --- | --- | --- | --- | --- |
| QA-01 | High | Open homepage or Floral Birthday product. The Unsplash photo `photo-1535254973040-607b92a401c8` fails (`ERR_BLOCKED_BY_ORB`); hero is empty. | Home, seeded floral imagery, product image handling | Fixed; see QA report |
| QA-02 | High | Axe WCAG 2.1 audit: header brand's accessible name omits visible “BAKERY & CATERERS” wording as rendered. | Public Layout brand | Fixed; see QA report |
| QA-03 | High | Axe reports admin kicker and empty-chart text contrast 3.91–4.21 instead of required 4.5. | admin.css | Fixed; see QA report |
| QA-04 | Medium | Mobile designer screenshot: sticky toolbar obscures the lower cake; camera reserves topper space even without a topper. | CakeScene camera, mobile designer CSS | Fixed; see QA report |
| QA-05 | Medium | Choose Square and change colours, then refresh without manual Save: current design returns to defaults. Manual saved design remains intact. | designer session state | Fixed; validated tab session and product-URL reset |
| QA-06 | Medium | Static audit: Reveal starts transparent even under reduced motion, leaving lower sections blank in initial full-page capture; animated transforms are governed globally but reveal fade still waits for intersection. | Reveal | Fixed; see QA report |
| QA-07 | High | Contact shadows are recreated for flavour, price-only review flags and every message character; pearl and frosting rings create many independent draws. | CakeScene, Decorations | Fixed: 115 to 42 decorated draws, textures bounded at four |
| QA-08 | Medium | Large lazy Three scene exceeds 500 KB warning. | Vite, Three/Drei imports | Retained: 901.07 KB / 243.70 KB gzip; architecture preserved, warning documented |
| QA-09 | Medium | Mobile navigation opens a drawer without focus containment or focus restoration; Escape closes admin only. | Layout / Admin navigation | Fixed; focus, Escape and resize regression passed |
| QA-10 | Low | Public viewport hint says “procedural”; individual palette targets are 32px and inputs 13px on mobile. | DesignerViewport, designer.css | Fixed; see QA report |
| QA-11 | Medium | GPU inspection shows flower/drip/pearl and stand support gaps. | CakeModel, decorations | Fixed positions/capsule scaling; contact matrix and visual review passed |
| QA-12 | Medium | Pale message lettering blends into cream plaque. | MessageTopper | Fixed with contrast-aware fallback; stored colour and price preserved |
| QA-13 | Low | Default favicon request produces one console 404. | index.html | Fixed local SVG icon; targeted console recheck clean |

Additional verified defects fixed: shadow render-target growth, calendar weekday contrast, pale plaque lettering, flower/drip/pearl and stand contact gaps, reset-on-product-URL continuity, admin resize scroll-lock cleanup, and missing favicon. No unresolved critical/high issue is known in the tested scope. Physical-device and Firefox/WebKit checks remain pending; see PHASE5B_MANUAL_DEVICE_CHECKS.md. No original user records are used or reset; all browser runs use fresh isolated contexts.
