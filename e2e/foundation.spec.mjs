import { test, expect } from "@playwright/test";
const token = "a".repeat(64);
const signedIn = {
  authenticated: true,
  user: { email: "owner@example.test", role: "Owner" },
  csrfToken: token,
};
test("unconfigured administration is closed and business screens are not exposed", async ({
  page,
}) => {
  await page.route("**/api/admin?**", (r) =>
    r.fulfill({ status: 503, json: { error: "admin_not_configured" } }),
  );
  await page.goto("/admin/products");
  await expect(page.getByRole("alert")).toContainText(
    "awaiting backend configuration",
  );
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add product" })).toHaveCount(
    0,
  );
});
test("sign-in and logout use the server session without browser-stored credentials", async ({
  page,
}) => {
  let logout = false;
  await page.route("**/api/admin?**", (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    if (action === "login") return r.fulfill({ json: signedIn });
    if (action === "logout") {
      logout = true;
      expect(r.request().headers()["x-csrf-token"]).toBe(token);
      return r.fulfill({ json: { authenticated: false } });
    }
    return r.fulfill({ status: 401, json: { error: "session_expired" } });
  });
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill("owner@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Signed in as owner@example.test · Owner"),
  ).toBeVisible();
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) =>
        /admin|supabase|auth-token/i.test(k),
      ),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(logout).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
});
test("non-admin sign-in is rejected and no registration UI exists", async ({
  page,
}) => {
  await page.route("**/api/admin?**", (r) =>
    r.fulfill({
      status:
        new URL(r.request().url()).searchParams.get("action") === "login"
          ? 403
          : 401,
      json: {
        error:
          new URL(r.request().url()).searchParams.get("action") === "login"
            ? "admin_required"
            : "session_expired",
      },
    }),
  );
  await page.goto("/admin");
  await page.getByLabel("Email address").fill("customer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("not authorised");
  await expect(page.getByRole("button", { name: "Sign up" })).toHaveCount(0);
  await expect(page.locator(".admin-shell")).toHaveCount(0);
});
test("expired access refreshes through a CSRF-protected server call", async ({
  page,
}) => {
  let refresh = false;
  await page.route("**/api/admin?**", (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    if (action === "refresh") {
      refresh = true;
      expect(r.request().headers()["x-csrf-token"]).toBe(token);
      return r.fulfill({ json: signedIn });
    }
    return r.fulfill({
      status: 401,
      json: {
        error: "session_expired",
        refreshAvailable: true,
        csrfToken: token,
      },
    });
  });
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  expect(refresh).toBe(true);
});
test("recovery token is removed from the URL and password update requires a valid session", async ({
  page,
}) => {
  let updated = false;
  await page.route("**/api/admin?**", (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    if (action === "recovery-session")
      return r.fulfill({ json: { ...signedIn, passwordRecovery: true } });
    if (action === "password") {
      updated = true;
      expect(r.request().headers()["x-csrf-token"]).toBe(token);
      return r.fulfill({ json: { updated: true } });
    }
    return r.fulfill({ json: signedIn });
  });
  await page.goto(
    "/admin/login?token_hash=" + "b".repeat(64) + "&type=recovery",
  );
  await expect(page.getByLabel("New password")).toBeVisible();
  expect(page.url()).not.toContain("token_hash");
  await page.getByLabel("New password").fill("test-only-new-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.getByText("Password updated.", { exact: true }),
  ).toBeVisible();
  expect(updated).toBe(true);
});
