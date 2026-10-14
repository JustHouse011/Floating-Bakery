import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { ServerResponse } from "node:http";
import {
  createAdminHandler,
  sealSession,
  openSession,
  requireAdmin,
  type AdminRequest,
  ApiError,
} from "../server/adminFoundation";
const id = "11111111-1111-4111-8111-111111111111",
  origin = "https://bakery.test",
  csrf = "a".repeat(64);
const jwt = () =>
  `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-signature`;
const session = () => ({
  id,
  accessToken: jwt(),
  refreshToken: "test-only-refresh",
  expiresAt: Date.now() + 3600000,
  sessionExpiry: Date.now() + 7200000,
  csrf,
});
beforeEach(() =>
  Object.assign(process.env, {
    NODE_ENV: "production",
    ADMIN_ENABLED: "true",
    SUPABASE_URL: "https://project.supabase.test",
    SUPABASE_PUBLISHABLE_KEY: "publishable-test",
    SUPABASE_SERVICE_ROLE_KEY: "service-test",
    ADMIN_SESSION_SECRET: "11".repeat(32),
    APP_ORIGIN: origin,
    ADMIN_RECOVERY_URL: origin + "/admin/login",
  }),
);
function service(
  options: {
    role?: string | null;
    invalidUser?: boolean;
    blocked?: boolean;
    revoked?: boolean;
    roleOutage?: boolean;
    invited?: boolean;
  } = {},
) {
  const calls: {
    url: string;
    headers: Record<string, string>;
    body: unknown;
  }[] = [];
  let revoked = options.revoked || false;
  const token = jwt();
  const user = {
    id,
    email: "admin@example.test",
    aud: "authenticated",
    role: "authenticated",
    user_metadata: { role: "Owner" },
    app_metadata: {},
    created_at: new Date().toISOString(),
  };
  const fetcher = (async (input: unknown, init?: RequestInit) => {
    const url = String(input),
      headers = Object.fromEntries(new Headers(init?.headers).entries());
    calls.push({
      url,
      headers,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    if (url.includes("/auth/v1/token"))
      return Response.json({
        access_token: token,
        refresh_token: "test-only-refresh",
        token_type: "bearer",
        expires_in: 3600,
        user,
      });
    if (url.includes("/auth/v1/user"))
      return options.invalidUser
        ? Response.json({ message: "Invalid token" }, { status: 401 })
        : Response.json(user);
    if (url.includes("/rpc/current_admin_role"))
      return options.roleOutage
        ? Response.json({ message: "Unavailable" }, { status: 503 })
        : Response.json(options.role === undefined ? "Owner" : options.role);
    if (url.includes("/rpc/consume_auth_attempt"))
      return Response.json(!options.blocked);
    if (url.includes("/rpc/is_invited_admin_email"))
      return Response.json(options.invited || false);
    if (url.includes("/rpc/register_admin_session")) return Response.json(null);
    if (url.includes("/rest/v1/admin_sessions")) {
      if (init?.method === "PATCH") {
        revoked = true;
        return new Response(null, { status: 204 });
      }
      return Response.json([
        {
          expires_at: new Date(Date.now() + 7200000).toISOString(),
          revoked_at: revoked ? new Date().toISOString() : null,
        },
      ]);
    }
    if (url.includes("/auth/v1/logout"))
      return new Response(null, { status: 204 });
    if (url.includes("/auth/v1/recover")) return Response.json({});
    if (url.includes("/auth/v1/verify"))
      return Response.json({
        access_token: token,
        refresh_token: "test-only-refresh",
        token_type: "bearer",
        expires_in: 3600,
        user,
      });
    throw Error("Unexpected mock request: " + url);
  }) as typeof fetch;
  return { fetcher, calls };
}
async function invoke(
  action: string,
  fetcher: typeof fetch,
  options: {
    body?: unknown;
    cookie?: string;
    csrf?: string;
    origin?: string;
    method?: string;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: options.origin ?? origin,
  };
  if (options.cookie) headers.cookie = "__Host-fb-admin=" + options.cookie;
  if (options.csrf) headers["x-csrf-token"] = options.csrf;
  const req = {
    url: "/api/admin?action=" + action,
    method:
      options.method ??
      (action === "session" || action === "authorize" ? "GET" : "POST"),
    headers,
    body: options.body,
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as AdminRequest;
  const responseHeaders: Record<string, string> = {};
  let body: Record<string, unknown> = {};
  const res = {
    statusCode: 0,
    setHeader(k: string, v: string) {
      responseHeaders[k] = v;
    },
    end(text: string) {
      body = JSON.parse(text);
    },
  } as unknown as ServerResponse;
  await createAdminHandler(fetcher)(req, res);
  return { status: res.statusCode, body, headers: responseHeaders };
}
test("unconfigured administration fails closed without provider requests", async () => {
  process.env.ADMIN_ENABLED = "false";
  const mock = service();
  assert.equal((await invoke("session", mock.fetcher)).status, 503);
  assert.equal(mock.calls.length, 0);
});
test("cookie tokens are encrypted and tampering/absolute expiry is rejected", () => {
  const s = session(),
    encrypted = sealSession(s);
  assert.ok(!encrypted.includes(s.refreshToken));
  assert.equal(openSession(encrypted)?.id, id);
  const n = 40;
  assert.equal(
    openSession(
      encrypted.slice(0, n) +
        (encrypted[n] === "a" ? "b" : "a") +
        encrypted.slice(n + 1),
    ),
    undefined,
  );
  assert.equal(
    openSession(sealSession({ ...s, sessionExpiry: Date.now() - 1 })),
    undefined,
  );
});
test("anonymous and malformed cookies cannot authenticate", async () => {
  const mock = service();
  assert.equal((await invoke("authorize", mock.fetcher)).status, 401);
  assert.equal(
    (await invoke("authorize", mock.fetcher, { cookie: "forged" })).status,
    401,
  );
  assert.equal(mock.calls.length, 0);
});
test("cross-origin and missing-origin login requests are rejected", async () => {
  const mock = service();
  for (const other of ["https://foreign.test", ""])
    assert.equal(
      (
        await invoke("login", mock.fetcher, {
          origin: other,
          body: { email: "admin@example.test", password: "test-password" },
        })
      ).status,
      403,
    );
  assert.equal(mock.calls.length, 0);
});
test("login verifies current membership and creates HttpOnly Secure SameSite cookies without returning tokens", async () => {
  const mock = service();
  const r = await invoke("login", mock.fetcher, {
    body: { email: "admin@example.test", password: "test-password" },
  });
  assert.equal(r.status, 200);
  assert.match(r.headers["Set-Cookie"], /HttpOnly; SameSite=Strict/);
  assert.match(r.headers["Set-Cookie"], /; Secure/);
  assert.match(r.headers["Cache-Control"], /no-store/);
  assert.ok(!JSON.stringify(r.body).includes("test-only-refresh"));
  assert.ok(!JSON.stringify(r.body).includes("access_token"));
  assert.ok(mock.calls.some((c) => c.url.includes("register_admin_session")));
  assert.ok(
    mock.calls
      .filter((c) => c.url.includes("current_admin_role"))
      .every((c) => c.headers.apikey === "publishable-test"),
  );
});
test("provider-verified non-admin cannot use self-asserted metadata roles", async () => {
  const mock = service({ role: null });
  const r = await invoke("login", mock.fetcher, {
    body: { email: "admin@example.test", password: "test-password" },
  });
  assert.equal(r.status, 403);
  assert.equal(r.headers["Set-Cookie"], undefined);
});
test("invalid access token is rejected independently of valid-looking session cookie", async () => {
  const r = await invoke("authorize", service({ invalidUser: true }).fetcher, {
    cookie: sealSession(session()),
  });
  assert.equal(r.status, 401);
});
test("role verification outage cannot grant access", async () => {
  assert.equal(
    (
      await invoke("authorize", service({ roleOutage: true }).fetcher, {
        cookie: sealSession(session()),
      })
    ).status,
    503,
  );
});
test("current role is read on each request and role removal takes effect immediately", async () => {
  const cookie = sealSession(session());
  assert.equal(
    (await invoke("authorize", service({ role: "Staff" }).fetcher, { cookie }))
      .status,
    200,
  );
  assert.equal(
    (await invoke("authorize", service({ role: null }).fetcher, { cookie }))
      .status,
    403,
  );
});
test("role-specific server guard rejects staff from owner-only endpoints", async () => {
  const req = {
    headers: { cookie: "__Host-fb-admin=" + sealSession(session()) },
  } as unknown as AdminRequest;
  await assert.rejects(
    () => requireAdmin(req, ["Owner"], service({ role: "Staff" }).fetcher),
    (e: unknown) => e instanceof ApiError && e.status === 403,
  );
});
test("revoked database sessions are rejected even with a valid provider token", async () => {
  assert.equal(
    (
      await invoke("session", service({ revoked: true }).fetcher, {
        cookie: sealSession(session()),
      })
    ).status,
    401,
  );
});
test("mutation CSRF is independently checked", async () => {
  const mock = service();
  assert.equal(
    (
      await invoke("logout", mock.fetcher, {
        body: {},
        cookie: sealSession(session()),
      })
    ).status,
    403,
  );
  assert.equal(mock.calls.length, 0);
});
test("logout revokes the registered session and replayed cookies fail", async () => {
  const mock = service(),
    cookie = sealSession(session());
  const r = await invoke("logout", mock.fetcher, { body: {}, cookie, csrf });
  assert.equal(r.status, 200);
  assert.match(r.headers["Set-Cookie"], /Max-Age=0/);
  assert.equal(
    (await invoke("authorize", mock.fetcher, { cookie })).status,
    401,
  );
});
test("expired access token offers same-origin refresh but does not authenticate", async () => {
  const mock = service();
  const r = await invoke("session", mock.fetcher, {
    cookie: sealSession({ ...session(), expiresAt: Date.now() - 1 }),
  });
  assert.equal(r.status, 401);
  assert.equal(r.body.refreshAvailable, true);
  assert.equal(r.headers["Set-Cookie"], undefined);
  assert.equal(mock.calls.length, 0);
});
test("refresh preserves absolute session deadline and checks role/session again", async () => {
  const mock = service(),
    s = { ...session(), expiresAt: Date.now() - 1 };
  const r = await invoke("refresh", mock.fetcher, {
    body: {},
    cookie: sealSession(s),
    csrf,
  });
  assert.equal(r.status, 200);
  const encrypted = r.headers["Set-Cookie"].split(";")[0].split("=")[1];
  assert.equal(openSession(encrypted)?.sessionExpiry, s.sessionExpiry);
  assert.ok(mock.calls.some((c) => c.url.includes("current_admin_role")));
});
test("rate limiting happens before password authentication", async () => {
  const mock = service({ blocked: true });
  assert.equal(
    (
      await invoke("login", mock.fetcher, {
        body: { email: "admin@example.test", password: "test-password" },
      })
    ).status,
    429,
  );
  assert.ok(!mock.calls.some((c) => c.url.includes("/auth/v1/token")));
});
test("uninvited recovery gets a generic response and sends no email", async () => {
  const mock = service();
  const r = await invoke("recover", mock.fetcher, {
    body: { email: "someone@example.test" },
  });
  assert.equal(r.status, 200);
  assert.ok(!mock.calls.some((c) => c.url.includes("/auth/v1/recover")));
});
test("registered recovery requests use the fixed approved callback", async () => {
  const mock = service({ invited: true });
  const r = await invoke("recover", mock.fetcher, {
    body: { email: "admin@example.test", redirectTo: "https://foreign.test" },
  });
  assert.equal(r.status, 200);
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/v1/recover")));
});
test("registration, unknown actions, wrong methods and oversized inputs are rejected", async () => {
  const mock = service();
  assert.equal(
    (await invoke("signup", mock.fetcher, { body: {} })).status,
    404,
  );
  assert.equal(
    (await invoke("login", mock.fetcher, { method: "GET" })).status,
    405,
  );
  assert.equal(
    (
      await invoke("login", mock.fetcher, {
        body: { email: "admin@example.test", password: "x".repeat(9000) },
      })
    ).status,
    413,
  );
});
test('recovery hashes are verified as recovery tokens and non-admins cannot obtain a session', async()=>{
  const mock=service({role:null});
  const result=await invoke('recovery-session',mock.fetcher,{body:{tokenHash:'b'.repeat(64),type:'signup'}});
  assert.equal(result.status,403);
  assert.equal(result.headers['Set-Cookie'],undefined);
  const call=mock.calls.find(c=>c.url.includes('/auth/v1/verify'));
  assert.equal((call?.body as Record<string,unknown>).type,'recovery');
});
test('password update requires the verified session, CSRF and a strong password',async()=>{
  const mock=service(),cookie=sealSession(session());
  assert.equal((await invoke('password',mock.fetcher,{cookie,csrf,body:{password:'short'}})).status,400);
  const result=await invoke('password',mock.fetcher,{cookie,csrf,body:{password:'new-test-only-password'}});
  assert.equal(result.status,200);assert.equal(result.body.updated,true);
  assert.ok(mock.calls.some(c=>c.url.includes('/auth/v1/user')&&(c.body as Record<string,unknown>)?.password==='new-test-only-password'));
});
