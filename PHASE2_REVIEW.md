# Phase 2 review — Floating Bakery & Caterers

Implemented locally on 13 October 2026. Run `./start-local.ps1` and open `/cake-designer`.

## Implemented behaviour

- Desktop controls / viewport / summary layout, with a preview-first mobile layout, native collapsible control panels and a sticky action bar.
- Procedural round and square cakes with rounded edges, one to three tiers and compatible 6, 8, 10 and 12 inch bases. Tiers share a realistic three-inch visual height and decrease in diameter by two inches. Three tiers require at least a 10-inch base; two tiers require at least eight inches.
- A presentation stand, correctly sized board, studio lights and soft contact shadows. Orbit rotation, mouse-wheel / touch zoom, bounded camera movement and Reset view. Framing recalculates for shape, size, tiers and viewport aspect ratio.
- White, pink, lavender, blue, sage and peach swatches, custom colour inputs and independent tier colours. Flavour selection is stored but explicitly described as non-visual.
- Distinct buttercream, fondant and chocolate ganache materials. Buttercream adds piping geometry; ganache uses a fixed chocolate colour with preserved palette selections.
- Ivory pearls, coloured ribbon, coloured drip geometry, simple flowers and a coloured star topper. Personalised messages use a two-sided cake-top plaque with a locally generated texture, up to 32 characters.
- Versioned local save / validated restore, full design reset, independent camera reset and summary copy with a manual-copy fallback.
- Catalogue inspiration presets retained through the existing query parameter. The same product does not overwrite edits on returning to the studio.
- Explicit Phase 3 price placeholder; no pricing engine or backend.

## Architecture and state

`CakeDesigner` composes separate controls, viewport, summary and actions. Both the route and `CakeScene` load lazily. `CakeScene` owns lighting, contact shadows and OrbitControls; `CakeModel` assembles the board, stand, tier meshes and decorations. Round tiers use memoised lathe profiles; square tiers use rounded boxes. Geometry and frosting helpers are independent of UI controls.

The vanilla Zustand store in `src/store/cakeDesignerStore.ts` exposes a React hook and an imperative API. It contains typed configuration, validated mutation actions and a camera reset revision. Configurations stay in memory across navigation. Storage is explicit, with version 1 envelopes under `floating:cake-design`; malformed data, unsupported versions and incompatible tier combinations cannot replace the current design. Save failures appear as notices. There is one saved design per browser.

Rendering uses a demand frame loop, a maximum device pixel ratio of 1.5, static contact shadows refreshed when the configuration changes, and memoised geometry / model components. Orbit damping follows the reduced-motion preference. R3F owns declarative geometry and material disposal; message textures have explicit cleanup. No auto-rotation runs. WebGL 2 is checked before loading the scene, with error and context-loss fallbacks that retain controls and persistence.

## Files created

- `src/types/cakeDesigner.ts`, `src/data/designer.ts`
- `src/services/cakeConfiguration.ts`, `src/services/designerStorage.ts`
- `src/store/cakeDesignerStore.ts`
- `src/pages/CakeDesigner/CakeDesigner.tsx`
- `src/components/designer/DesignerControls.tsx`, `DesignerSummary.tsx`, `DesignerViewport.tsx`, `SceneBoundary.tsx`
- `src/three/cakeGeometry.ts`, `CakeModel/CakeModel.tsx`, `CakeScene/CakeScene.tsx`, `Decorations/Decorations.tsx`, `Decorations/MessageTopper.tsx`, `Materials/frosting.ts`
- `src/styles/designer.css`, `scripts/test.mjs`, `tests/designer.test.tsx`
- `PHASE2_REVIEW.md`

## Files modified

- `src/app/App.tsx`: lazy studio route and updated page title.
- `src/pages/Info.tsx`: removed the superseded studio placeholder.
- `src/pages/Home.tsx`: updated one availability note; homepage composition and design preserved.
- `package.json`, `package-lock.json`: reproducible test command and an explicit esbuild development dependency for the test runner.
- `tsconfig.json`: includes test source in TypeScript checks.
- `eslint.config.js`: Node globals for the test runner.
- `README.md`: current scope, usage, save behaviour and validation instructions.

Existing product data, prices, contact behaviour, navigation and other page designs were preserved.

## Validation

- Dependency update succeeded.
- TypeScript checks passed for application and test source.
- ESLint passed with no warnings.
- All 22 automated tests passed: state actions, supported shape/size/tier combinations, invalid combinations, per-tier colour retention, decoration toggles, camera/design reset, product presets, validated storage round trips and errors, copied summaries, actual round geometry bounds, decoration perimeter placement, material differences, responsive camera calculations and server-rendered controls.
- Phase 1 regression checks are included in the test command: nine route variants and enquiry-service persistence using simulated localStorage. The original ignored `.tools/check-routes.mjs` was also rerun and passed.
- Production build passed. The designer page is a separate 7.11 KB gzip JavaScript chunk, and the 3D scene is a separate 242.91 KB gzip JavaScript chunk. Vite warns that the 3D scene exceeds its 500 KB uncompressed chunk threshold; the chunk is loaded only when the supported 3D preview mounts. No warning threshold was suppressed.
- Browser automation was not available. GPU-rendered appearance, mouse/touch rotation and zoom, live decoration visibility, mobile overflow, clipboard permissions, real browser storage and browser console errors have not been verified in a browser. Server-rendering and memory-storage tests do not substitute for those checks.

## Browser review checklist

1. At desktop and narrow mobile widths, change shape, size and tier count. Confirm all cake tiers remain visible after Reset view and no horizontal overflow occurs.
2. Drag / swipe, zoom / pinch and Reset view. Confirm zoom and polar limits keep the camera above the stand.
3. Change each tier colour, then compare buttercream, fondant and ganache. Confirm the stored palette returns after switching out of ganache.
4. Toggle each decoration individually, then together; change the decoration colour and enter / remove a message. Confirm visible changes in the preview.
5. Save, reset, restore and reload before restoring. Copy the summary and check the manual fallback when clipboard access is blocked.
6. Navigate to the collection and back. Try a different catalogue inspiration. Inspect the console for errors.
7. Disable WebGL or hardware acceleration. Confirm the fallback appears and the controls / summary / save actions remain usable.

## Limitations and Phase 3 readiness

This is a procedural approximation rather than a photorealistic representation or a bakery-approved construction plan. Flowers and the topper use simple geometry; message glyphs depend on the device's local font support. Multi-tier sizing uses a fixed two-inch step; arbitrary individual tier sizes are outside this phase. A first studio visit downloads the lazy 3D renderer. Storage belongs to the current browser and origin; nothing is transmitted to the bakery.

Phase 3 can consume the strongly typed, validated configuration and catalogue inspiration ID through the store or service layer. Pricing is deliberately separate from rendering, with an existing summary panel for itemised estimates. Any product-inclusive price rules and manual-quotation requirements remain Phase 3 work.

No pricing calculations, payments, Supabase connection, deployment or GitHub push were added. Work stops after Phase 2 for review.
