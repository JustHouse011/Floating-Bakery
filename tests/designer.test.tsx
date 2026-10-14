import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { LatheGeometry } from "three";
import { defaultConfiguration } from "../src/data/designer";
import { products } from "../src/data/products";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  DECORATIONS,
  type TierCount,
} from "../src/types/cakeDesigner";
import {
  compatibleSize,
  configurationForProduct,
  configurationSummary,
  tierDimensions,
  validateConfiguration,
} from "../src/services/cakeConfiguration";
import {
  DESIGN_STORAGE_KEY,
  restoreDesign,
  saveDesign,
  type StorageAdapter,
} from "../src/services/designerStorage";
import {
  useCakeDesignerStore,
  cakeDesignerStore,
} from "../src/store/cakeDesignerStore";
import {
  perimeterPoint,
  roundedCakeProfile,
  studioCameraFrame,
} from "../src/three/cakeGeometry";
import { frostingMaterial } from "../src/three/Materials/frosting";
import DesignerControls from "../src/components/designer/DesignerControls";
import DesignerSummary from "../src/components/designer/DesignerSummary";
import CakeDesigner from "../src/pages/CakeDesigner/CakeDesigner";
import App from "../src/app/App";
import { saveDemoEnquiry } from "../src/services/enquiryService";
const store = () => useCakeDesignerStore.getState();
beforeEach(() => store().resetDesign());
function memoryStorage(): StorageAdapter {
  const records = new Map<string, string>();
  return {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => {
      records.set(key, value);
    },
  };
}
test("default configuration is valid and has no calculated price", () => {
  assert.deepEqual(
    validateConfiguration(defaultConfiguration()),
    defaultConfiguration(),
  );
  assert.equal("price" in store().configuration, false);
  assert.equal(tierDimensions(store().configuration).length, 1);
});
test("all supported shape, size and tier combinations follow dimensional rules", () => {
  for (const shape of CAKE_SHAPES)
    for (const size of CAKE_SIZES)
      for (const tiers of [1, 2, 3] as TierCount[]) {
        const config = { ...defaultConfiguration(), shape, size, tiers };
        if (!compatibleSize(size, tiers)) {
          assert.throws(() => validateConfiguration(config));
          assert.throws(() => tierDimensions(config));
          continue;
        }
        assert.equal(validateConfiguration(config).shape, shape);
        const dimensions = tierDimensions(config);
        assert.equal(dimensions.length, tiers);
        dimensions.forEach((tier, index) => {
          assert.equal(tier.inches, size - index * 2);
          assert.ok(tier.inches >= 6);
          if (index)
            assert.ok(
              Math.abs(
                tier.bottom -
                  (dimensions[index - 1].bottom + dimensions[index - 1].height),
              ) < 0.00001,
            );
        });
      }
});
test("tier changes raise the base to a compatible size", () => {
  store().setSize(6);
  store().setTiers(2);
  assert.equal(store().configuration.size, 8);
  store().setTiers(3);
  assert.equal(store().configuration.size, 10);
  assert.throws(() => store().setSize(8));
  assert.equal(store().configuration.size, 10);
  store().setSize(12);
  store().setTiers(1);
  assert.equal(store().configuration.size, 12);
});
test("tier colours remain independent and survive hiding a tier", () => {
  store().setTiers(3);
  store().setTierColour(0, "#123456");
  store().setTierColour(1, "#abcdef");
  store().setTiers(1);
  store().setTiers(3);
  assert.deepEqual(store().configuration.tierColours, [
    "#123456",
    "#abcdef",
    "#c8b9e6",
  ]);
  assert.throws(() => store().setTierColour(3, "#ffffff"));
  assert.throws(() => store().setTierColour(0, "red"));
});
test("all decoration toggles update and toggle back", () => {
  for (const key of DECORATIONS) {
    store().toggleDecoration(key);
    assert.equal(store().configuration.decorations[key], true);
    store().toggleDecoration(key);
    assert.equal(store().configuration.decorations[key], false);
  }
});
test("shape, flavour, frosting, accent and message update through the store", () => {
  store().setShape("Square");
  store().setFlavour("Lemon");
  store().setFrosting("Fondant");
  store().setDecorationColour("#112233");
  store().setMessage("Happy\nBirthday");
  assert.equal(store().configuration.shape, "Square");
  assert.equal(store().configuration.flavour, "Lemon");
  assert.equal(store().configuration.frosting, "Fondant");
  assert.equal(store().configuration.decorationColour, "#112233");
  assert.equal(store().configuration.message, "HappyBirthday");
  store().setMessage("a".repeat(40));
  assert.equal(store().configuration.message.length, 32);
});
test("reset view leaves the design intact; reset design restores defaults", () => {
  store().setTiers(3);
  store().toggleDecoration("flowers");
  const before = structuredClone(store().configuration);
  const cameraKey = store().cameraResetKey;
  store().resetCamera();
  assert.deepEqual(store().configuration, before);
  assert.equal(store().cameraResetKey, cameraKey + 1);
  store().resetDesign();
  assert.deepEqual(store().configuration, defaultConfiguration());
});
test("invalid restores cannot replace the current configuration", () => {
  store().setShape("Square");
  const before = store().configuration;
  assert.throws(() =>
    store().restoreConfiguration({
      ...defaultConfiguration(),
      tiers: 3,
      size: 6,
    }),
  );
  assert.strictEqual(store().configuration, before);
});
test("product presets use compatible sizes and do not overwrite edits for the same selection", () => {
  for (const product of products)
    assert.equal(
      validateConfiguration(configurationForProduct(product.id))
        .selectedProductId,
      product.id,
    );
  store().selectProduct("wedding");
  assert.equal(store().configuration.tiers, 3);
  store().setTierColour(0, "#aabbcc");
  store().selectProduct("wedding");
  assert.equal(store().configuration.tierColours[0], "#aabbcc");
  assert.throws(() => configurationForProduct("unknown"));
});
test("versioned storage round-trips a complete configuration and copies records", () => {
  const storage = memoryStorage();
  store().setTiers(3);
  store().setShape("Square");
  store().setMessage("For you");
  store().toggleDecoration("pearls");
  const config = structuredClone(store().configuration);
  saveDesign(config, storage);
  const envelope = JSON.parse(storage.getItem(DESIGN_STORAGE_KEY)!);
  assert.equal(envelope.version, 3);
  assert.ok(envelope.savedAt);
  assert.deepEqual(restoreDesign(storage), config);
  store().resetDesign();
  store().restoreConfiguration(restoreDesign(storage));
  assert.deepEqual(store().configuration, config);
  const restored = restoreDesign(storage);
  restored.tierColours[0] = "#000000";
  assert.notEqual(restoreDesign(storage).tierColours[0], "#000000");
});
test("missing, corrupt and incompatible storage is rejected", () => {
  const storage = memoryStorage();
  assert.throws(() => restoreDesign(storage), /No saved design/);
  storage.setItem(DESIGN_STORAGE_KEY, "{oops");
  assert.throws(() => restoreDesign(storage), /could not be read/);
  storage.setItem(
    DESIGN_STORAGE_KEY,
    JSON.stringify({ version: 99, configuration: defaultConfiguration() }),
  );
  assert.throws(() => restoreDesign(storage), /not supported/);
  storage.setItem(
    DESIGN_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      configuration: { ...defaultConfiguration(), size: 6, tiers: 3 },
    }),
  );
  assert.throws(() => restoreDesign(storage), /invalid options/);
});
test("storage failure is propagated without changing the design", () => {
  const storage: StorageAdapter = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota exceeded");
    },
  };
  assert.throws(
    () => saveDesign(defaultConfiguration(), storage),
    /quota exceeded/,
  );
  assert.throws(() => restoreDesign(storage), /blocked/);
  assert.deepEqual(store().configuration, defaultConfiguration());
});
test("validation rejects malformed persisted options", () => {
  for (const value of [
    null,
    [],
    { ...defaultConfiguration(), size: 7 },
    { ...defaultConfiguration(), shape: "Heart" },
    { ...defaultConfiguration(), flavour: "unknown" },
    { ...defaultConfiguration(), frosting: "unknown" },
    { ...defaultConfiguration(), tierColours: ["#ffffff"] },
    { ...defaultConfiguration(), decorations: {} },
    { ...defaultConfiguration(), decorationColour: "bad" },
    { ...defaultConfiguration(), message: "a".repeat(33) },
    { ...defaultConfiguration(), message: "\u0000" },
    { ...defaultConfiguration(), selectedProductId: "unknown" },
  ])
    assert.throws(() => validateConfiguration(value));
});
test("copied summary describes the design and phase boundary", () => {
  store().setTiers(2);
  store().toggleDecoration("flowers");
  store().setMessage("Happy day");
  const text = configurationSummary(store().configuration);
  assert.match(text, /8 inch \/ 6 inch/);
  assert.match(text, /Simple flowers/);
  assert.match(text, /Happy day/);
  assert.match(text, /Floating Bakery & Caterers/);
  assert.match(text, /Nothing has been sent/);
});
test("round profile creates finite, correctly sized three.js geometry", () => {
  const geometry = new LatheGeometry(roundedCakeProfile(1.5, 0.72), 80);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  assert.ok(Math.abs(bounds.max.y - 0.72) < 0.0001);
  assert.ok(Math.abs(bounds.max.x - 1.5) < 0.001);
  assert.ok(
    Array.from(geometry.attributes.position.array).every(Number.isFinite),
  );
  geometry.dispose();
});
test("decorations follow round and square perimeters", () => {
  for (let i = 0; i < 48; i++) {
    const [x, z] = perimeterPoint("Round", 1, i / 48);
    assert.ok(Math.abs(Math.hypot(x, z) - 1) < 0.00001);
    const [sx, sz] = perimeterPoint("Square", 1, i / 48);
    assert.ok(Math.abs(Math.max(Math.abs(sx), Math.abs(sz)) - 1) < 0.00001);
  }
});
test("frosting styles have different materials and ganache preserves stored colours", () => {
  const matte = frostingMaterial("Buttercream", "#eeb4c5"),
    smooth = frostingMaterial("Fondant", "#eeb4c5"),
    glossy = frostingMaterial("Chocolate Ganache", "#eeb4c5");
  assert.ok(
    matte.roughness > smooth.roughness && smooth.roughness > glossy.roughness,
  );
  assert.equal(glossy.color, "#48251b");
  store().setFrosting("Chocolate Ganache");
  store().setFrosting("Buttercream");
  assert.equal(store().configuration.tierColours[0], "#eeb4c5");
});
test("camera framing adjusts for square cakes and narrow viewports", () => {
  const config = {
    ...defaultConfiguration(),
    size: 12 as const,
    tiers: 3 as const,
  };
  const round = studioCameraFrame(config, 1),
    square = studioCameraFrame({ ...config, shape: "Square" }, 1),
    narrow = studioCameraFrame({ ...config, shape: "Square" }, 0.8);
  assert.ok(square.distance > round.distance);
  assert.ok(narrow.distance > square.distance);
  assert.ok(Number.isFinite(narrow.distance));
});
test("controls and summary render the current configuration and disabled incompatible sizes", () => {
  store().setTiers(3);
  store().setShape("Square");
  store().setMessage("A special day");
  // Zustand deliberately uses its initial snapshot for SSR; seed that snapshot
  // for this rendering check without changing production store behaviour.
  const originalSnapshot = cakeDesignerStore.getInitialState;
  cakeDesignerStore.getInitialState = cakeDesignerStore.getState;
  let html: string;
  try {
    html = renderToString(
      <MemoryRouter>
        <DesignerControls />
        <DesignerSummary />
      </MemoryRouter>,
    );
  } finally {
    cakeDesignerStore.getInitialState = originalSnapshot;
  }
  assert.match(html, /A special day/);
  assert.match(html, /10″ \/ 8″ \/ 6″/);
  assert.match(html, /disabled=""/);
  assert.match(html, /Tier 3/);
  assert.match(html, /Estimated Price — Subject to Bakery Confirmation/);
});
test("designer page renders usable controls before WebGL loads", () => {
  const html = renderToString(
    <MemoryRouter initialEntries={["/cake-designer"]}>
      <CakeDesigner />
    </MemoryRouter>,
  );
  assert.match(html, /Make it/);
  assert.match(html, /Checking your 3D studio/);
  assert.match(html, /Save design/);
  assert.match(html, /Back to the collection/);
});
test("Phase 1 route variants still render a heading and main landmark", () => {
  for (const path of [
    "/",
    "/cakes",
    "/cakes/vanilla",
    "/about",
    "/catering",
    "/contact",
    "/contact?type=Cake%20quotation&cake=vanilla",
    "/cake-designer?product=vanilla",
    "/missing",
  ]) {
    const html = renderToString(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    assert.ok(html.includes("<h1"), path);
    assert.ok(html.includes('id="main"'), path);
  }
});
test("Phase 1 enquiry persistence still generates local demo records", () => {
  const storage = memoryStorage();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  try {
    const saved = saveDemoEnquiry({
      name: "Demo",
      email: "demo@example.com",
      telephone: "0123456789",
      type: "General enquiry",
      message: "Test only",
    });
    const records = JSON.parse(storage.getItem("floating:enquiries")!);
    assert.equal(records[0].id, saved.id);
    assert.equal(records[0].demo, true);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
