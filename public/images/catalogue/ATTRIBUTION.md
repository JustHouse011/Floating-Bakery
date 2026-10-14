# Supplied bakery menu assets

All eleven product photographs and the FB&C logo are cropped directly from the owner-supplied menus in `public/catalogue-source/`. Originals, including the duplicate Sweet Treats file, remain unchanged. No stock substitute, generative fill, redrawing or food reconstruction was used.

`EXTRACTION.json` records source SHA-256 hashes, original dimensions, exact crop coordinates and resulting WebP byte sizes. `scripts/qa-extract-catalogue.mjs` reproduces crops at native resolution with WebP quality 0.88 and verifies unchanged original hashes.

Nine Sweet Treats photographs are distinct. Plain and chocolate-chip scones use their corresponding menu photographs. Raisin Scones transparently reuse the plain-scone photograph because a distinct raisin image was not supplied. Cards use a 4:3 frame with containment, preserving natural proportions and the complete extracted crop.

The owner selected the Sweet Treats FB&C logo in this session. Its crop is used without redrawing; both original logo treatments remain available in the source menus. The supplied logo is clipped at the top in the source artwork; the crop preserves that condition rather than inventing missing artwork. Higher-resolution standalone photography and an original logo export would improve large displays.
