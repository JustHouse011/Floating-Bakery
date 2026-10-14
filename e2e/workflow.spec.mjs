import { designAction } from "./designAction.mjs";
import { test, expect } from "@playwright/test";
import { open, capture, dbQuotes } from "./helpers.mjs";
async function pngBytes(page, type = "image/png") {
  return Buffer.from(
    await page.evaluate((type) => {
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 90;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f5dde2";
      ctx.fillRect(0, 0, 120, 90);
      return canvas.toDataURL(type).split(",")[1];
    }, type),
    "base64",
  );
}
async function details(page) {
  await page.getByLabel("Full name", { exact: true }).fill("QA Demo Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel(/contact number/i).fill("0821234567");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Event date", { exact: true }).fill(
    await page.evaluate(() =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    ),
  );
  await page.getByLabel(/guests/i).fill("24");
}
async function finish(page, images = false) {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  if (images) {
    await page.locator("input[type=file]").setInputFiles({
      name: "qa-reference.png",
      mimeType: "image/png",
      buffer: await pngBytes(page),
    });
    await expect(page.locator(".reference-gallery img")).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Save Demo Request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/quotations\/[a-f\d-]+$/);
  await expect(page.getByText(/The bakery has not received/)).toBeVisible();
}
test("catalogue to designer to quotation, references, back navigation, copy and refresh", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "/cakes");
  await page
    .getByRole("link", { name: "Classic Vanilla Cake", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cakes\/vanilla$/);
  await expect(page.getByRole('heading', { name: 'Classic Vanilla Cake', exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Customise Cake", exact: false })
    .click();
  await expect(page.locator(".estimate-total strong")).toContainText("450");
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Decorative pearls", exact: true })
    .check();
  await page.getByLabel("Personalised message").fill("Happy Birthday");
  await expect(page.locator(".estimate-total strong")).toContainText("580");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Square", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Personalised message")).toHaveValue(
    "Happy Birthday",
  );
  await page
    .getByRole("button", { name: "Request This Cake", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await details(page);
  await page
    .getByLabel(/Collection or delivery|Fulfilment/i)
    .selectOption("Delivery");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByLabel("Delivery area", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Delivery area", { exact: true }).fill("QA Area");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "QA Demo Customer",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.locator("#reference-upload-error")).not.toHaveText("");
  await page.locator("input[type=file]").setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(page.locator("#reference-upload-error")).toContainText(
    /size|limit|large/i,
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "qa-reference.png",
    mimeType: "image/png",
    buffer: await pngBytes(page),
  });
  await expect(page.locator(".reference-gallery img")).toHaveCount(1);
  await page.getByRole("button", { name: /Remove.*qa-reference/ }).click();
  await expect(page.locator(".reference-gallery img")).toHaveCount(0);
  await page.locator("input[type=file]").setInputFiles({
    name: "qa-reference.png",
    mimeType: "image/png",
    buffer: await pngBytes(page),
  });
  await expect(page.locator(".reference-gallery img")).toHaveCount(1);
  await page.locator("input[type=file]").setInputFiles([
    {
      name: "qa-jpeg.jpg",
      mimeType: "image/jpeg",
      buffer: await pngBytes(page, "image/jpeg"),
    },
    {
      name: "qa-webp.webp",
      mimeType: "image/webp",
      buffer: await pngBytes(page, "image/webp"),
    },
  ]);
  await expect(page.locator(".reference-gallery img")).toHaveCount(3);
  await page.locator("input[type=file]").setInputFiles({
    name: "fourth.png",
    mimeType: "image/png",
    buffer: await pngBytes(page),
  });
  await expect(page.locator("#reference-upload-error")).toContainText("3");
  await expect(page.locator(".reference-gallery img")).toHaveCount(3);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Save Demo Request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/quotations\//);
  await expect(page.getByText(/The bakery has not received/)).toBeVisible();
  const [q] = await dbQuotes(page);
  expect(q.snapshot.configuration.shape).toBe("Square");
  expect(q.snapshot.estimate.indicativeTotalCents).toBe(58000);
  expect(q.snapshot.estimate.estimatedTotalCents).toBeNull();
  expect(q.references).toHaveLength(3);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy reference" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(q.reference);
  await page.evaluate(() => {
    window.print = () => {
      window.__qaPrinted = true;
    };
  });
  await page.getByRole("button", { name: "Print quotation" }).click();
  expect(await page.evaluate(() => window.__qaPrinted)).toBe(true);
  await page.reload();
  await expect(page.getByText(q.reference, { exact: true })).toBeVisible();
  await capture(page, `${info.project.name}-confirmation`);
  expect(errors).toEqual([]);
});
test("admin products, published pricing, quote audit, reports, settings and isolated reset", async ({
  page,
}, info) => {
  await open(page, "/cake-designer");
  await page
    .getByRole("button", { name: "Request This Cake", exact: true })
    .first()
    .click();
  await details(page);
  await finish(page, true);
  const [original] = await dbQuotes(page);
  await open(page, "/admin/products");
  await page.getByRole("button", { name: "Add product", exact: false }).click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("QA Lemon Celebration");
  await page.getByLabel("Starting price (ZAR)").fill("765.25");
  await page
    .getByLabel(/Illustrative image URL/)
    .fill("https://example.test/qa-cake.jpg");
  await page
    .getByLabel("Description", { exact: true })
    .fill("An illustrative QA cake.");
  await page.getByRole("button", { name: "Save product locally" }).click();
  await expect(page.getByText(/Product saved/)).toBeVisible();
  await open(page, "/cakes");
  await page
    .getByRole("link", { name: "QA Lemon Celebration", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "QA Lemon Celebration",
  );
  await expect(page.locator("main img")).toHaveAttribute(
    "src",
    "/images/cake-illustration.svg",
  );
  await open(page, "/admin/products");
  await page.getByLabel("Search products").fill("QA Lemon");
  const card = page
    .locator(".admin-product")
    .filter({ hasText: "QA Lemon Celebration" });
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Starting price (ZAR)").fill("800.25");
  await page.getByRole("button", { name: "Save product locally" }).click();
  await expect(card).toContainText("800");
  await card.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.getByLabel("Include archived products").check();
  await page
    .locator(".admin-product")
    .filter({ hasText: "QA Lemon Celebration" })
    .getByRole("button", { name: "Restore", exact: true })
    .click();
  await open(page, "/admin/pricing");
  await page.getByLabel("Preview inspiration").selectOption("");
  await page.getByLabel("8 inch tier", { exact: true }).fill("777.77");
  await expect(
    page.locator(".admin-pricing-preview .estimate-total"),
  ).toContainText("777");
  await page.getByRole("button", { name: "Publish pricing locally" }).click();
  await expect(page.getByText(/Pricing published locally/)).toBeVisible();
  expect((await dbQuotes(page))[0].snapshot).toEqual(original.snapshot);
  await open(page, "/cake-designer");
  await designAction(page, "Reset design");
  await expect(page.locator(".estimate-total")).toContainText("777");
  await designAction(page, "Save design");
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await designAction(page, "Restore saved");
  await expect(
    page.getByRole("button", { name: "Round", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".estimate-total")).toContainText("777");
  await open(page, "/admin/quotations");
  await page.getByLabel("Search requests").fill(original.reference);
  await page.getByRole("link", { name: /QA Demo Customer/ }).click();
  await page.getByLabel("New note").fill("QA internal note");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(
    page.getByText("QA internal note", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Next permitted status").selectOption("Under Review");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText(/Status updated locally/)).toBeVisible();
  await page.getByLabel("Revised amount (ZAR)").fill("999.50");
  await page.getByLabel("Adjustment reason").fill("QA flower adjustment");
  await page.getByRole("button", { name: "Prepare local revision" }).click();
  await expect(page.getByText(/Revision 1/)).toContainText("999");
  expect((await dbQuotes(page))[0].snapshot).toEqual(original.snapshot);
  await capture(page, `${info.project.name}-admin-quotation`);
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByText("QA internal note", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("QA flower adjustment", { exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await open(page, "/admin/calendar");
  await expect(
    page.getByText("QA Demo Customer", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Approved");
  await expect(page.getByText("QA Demo Customer", { exact: true })).toHaveCount(
    0,
  );
  await open(page, "/admin/reports");
  await expect(page.getByText("Vanilla", { exact: true })).toBeVisible();
  await open(page, "/admin/settings");
  await page.getByLabel("Business description").fill("QA local bakery");
  await page.getByLabel("Minimum lead time (days)").fill("3");
  await page.getByRole("button", { name: "Save settings locally" }).click();
  await page.reload();
  await expect(page.getByLabel("Business description")).toHaveValue(
    "QA local bakery",
  );
  const reset = page.getByRole("button", {
    name: "Delete IndexedDB demonstration data",
  });
  await expect(reset).toBeDisabled();
  await page.getByLabel("Type RESET LOCAL DEMO to confirm").fill("RESET");
  await expect(reset).toBeDisabled();
  expect(await dbQuotes(page)).toHaveLength(1);
  await page
    .getByLabel("Type RESET LOCAL DEMO to confirm")
    .fill("RESET LOCAL DEMO");
  await reset.click();
  await expect.poll(async () => (await dbQuotes(page)).length).toBe(0);
  await open(page, "/admin");
  await expect(
    page.getByText("No saved quotation requests yet.").first(),
  ).toBeVisible();
});
test("a reset design survives refresh on a product URL, and another catalogue choice loads its preset", async ({
  page,
}) => {
  await open(page, "/cake-designer?product=vanilla");
  await designAction(page, "Reset design");
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await page.getByLabel("Personalised message").fill("My fresh design");
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(200);
  await expect(page.getByRole('button',{name:'Square',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Square", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Personalised message")).toHaveValue(
    "My fresh design",
  );
  await open(page, "/cake-designer?product=chocolate");
  await expect(
    page.getByRole("button", { name: "Round", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Personalised message")).toHaveValue("");
});
test("drawers support keyboard focus, Escape and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/");
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await menu.click();
  await expect(
    page.getByRole("link", { name: "Home", exact: true }).first(),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole('navigation', {name: 'Main navigation'}).getByRole("link", { name: 'Contact', exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await open(page, "/admin");
  const adminMenu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await adminMenu.click();
  await page.keyboard.press("Escape");
  await expect(adminMenu).toBeFocused();
  await adminMenu.click();await page.setViewportSize({width:1024,height:768});await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
});
test("WebGL failures retain the quotation controls", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return original.call(this, kind, ...args);
    };
  });
  await open(page, "/cake-designer");
  await expect(page.getByText("The 3D preview is unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await page
    .getByRole("button", { name: "Request This Cake", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
});
test("storage failures and corrupt saved designs are recoverable without replacing the current cake", async ({
  page,
}) => {
  await open(page, "/cake-designer");
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await page.evaluate(() =>
    localStorage.setItem("floating:cake-design", "invalid"),
  );
  await designAction(page, "Restore saved");
  await expect(page.locator(".studio-notice")).toContainText(
    "could not be read",
  );
  await expect(
    page.getByRole("button", { name: "Square", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "floating:cake-design")
        throw new DOMException("Browser storage is full", "QuotaExceededError");
      return set.call(this, key, value);
    };
  });
  await designAction(page, "Save design");
  await expect(page.locator(".studio-notice")).toContainText(
    "Browser storage is full",
  );
});
test("IndexedDB unavailable keeps browsing and reports a recoverable submission failure", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", {
      value: undefined,
      configurable: true,
    }),
  );
  await open(page, "/cake-designer");
  await expect(
    page.getByRole("button", { name: "Retry local storage" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Request This Cake", exact: true })
    .first()
    .click();
  await details(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Save Demo Request", exact: true })
    .click();
  await expect(page.locator(".quote-error")).toContainText(
    "storage is unavailable",
  );
  await expect(page).toHaveURL(/quote-request/);
});
