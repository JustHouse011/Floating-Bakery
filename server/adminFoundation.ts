import {
  createClient,
  type SupabaseClient,
  type Session as SupabaseSession,
} from "@supabase/supabase-js";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export type AdminRole = "Owner" | "Administrator" | "Staff";
export interface AdminRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}
interface CookieSession {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  sessionExpiry: number;
  csrf: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
const roles: AdminRole[] = ["Owner", "Administrator", "Staff"];
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const cookieName = () =>
  process.env.NODE_ENV === "production" ? "__Host-fb-admin" : "fb-admin";
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || "";
  if (!/^[a-f0-9]{64}$/i.test(value))
    throw new ApiError(503, "admin_not_configured");
  return Buffer.from(value, "hex");
}
function configured() {
  return (
    process.env.ADMIN_ENABLED === "true" &&
    /^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(
      process.env.SUPABASE_URL || "",
    ) &&
    !!process.env.SUPABASE_PUBLISHABLE_KEY &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    /^[a-f0-9]{64}$/i.test(process.env.ADMIN_SESSION_SECRET || "")
  );
}
export function sealSession(value: CookieSession) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  const result = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
  if (result.length > 3800) throw new ApiError(503, "session_too_large");
  return result;
}
export function openSession(value: string): CookieSession | undefined {
  try {
    if (value.length > 3800 || !/^[A-Za-z0-9_-]+$/.test(value)) return;
    const bytes = Buffer.from(value, "base64url");
    if (bytes.length < 29) return;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secret(),
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    const s: unknown = JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString(),
    );
    if (
      !record(s) ||
      typeof s.id !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(s.id) ||
      typeof s.accessToken !== "string" ||
      typeof s.refreshToken !== "string" ||
      typeof s.csrf !== "string" ||
      !/^[a-f0-9]{64}$/.test(s.csrf) ||
      typeof s.expiresAt !== "number" ||
      typeof s.sessionExpiry !== "number" ||
      s.sessionExpiry <= Date.now() ||
      s.sessionExpiry > Date.now() + 8 * 3600000 + 1000
    )
      return;
    return s as unknown as CookieSession;
  } catch {
    return;
  }
}
function readSession(req: AdminRequest) {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim());
  const matches = cookies.filter((s) => s.startsWith(cookieName() + "="));
  return matches.length === 1
    ? openSession(matches[0].slice(cookieName().length + 1))
    : undefined;
}
function writeSession(res: ServerResponse, s?: CookieSession) {
  res.setHeader(
    "Set-Cookie",
    `${cookieName()}=${s ? sealSession(s) : ""}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${s ? Math.max(0, Math.floor((s.sessionExpiry - Date.now()) / 1000)) : 0}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
function response(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie, Origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}
function originAllowed(req: AdminRequest) {
  const origin =
    typeof req.headers.origin === "string" ? req.headers.origin : "";
  const trusted = (process.env.APP_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (process.env.VERCEL_URL) trusted.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== "production")
    trusted.push("http://127.0.0.1:5173");
  return (
    !!origin &&
    trusted.includes(origin) &&
    req.headers["sec-fetch-site"] !== "cross-site"
  );
}
function csrfValid(req: AdminRequest, s: CookieSession) {
  const candidate = req.headers["x-csrf-token"];
  return (
    typeof candidate === "string" &&
    /^[a-f0-9]{64}$/.test(candidate) &&
    timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(s.csrf, "hex"))
  );
}
async function body(req: AdminRequest) {
  if (
    !String(req.headers["content-type"])
      .toLowerCase()
      .startsWith("application/json")
  )
    throw new ApiError(415, "json_required");
  let raw: string;
  if (req.body !== undefined)
    raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  else {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const part of req) {
      const b = Buffer.from(part);
      length += b.length;
      if (length > 8192) throw new ApiError(413, "body_too_large");
      chunks.push(b);
    }
    raw = Buffer.concat(chunks).toString();
  }
  if (Buffer.byteLength(raw) > 8192) throw new ApiError(413, "body_too_large");
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value)) throw Error();
    return value;
  } catch {
    throw new ApiError(400, "invalid_request");
  }
}
function credentials(value: Record<string, unknown>, passwordRequired = true) {
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email))
    throw new ApiError(400, "invalid_email");
  const password = value.password;
  if (
    passwordRequired &&
    (typeof password !== "string" ||
      password.length < 1 ||
      password.length > 128)
  )
    throw new ApiError(400, "invalid_password");
  return { email, password: typeof password === "string" ? password : "" };
}
export function clientFor(
  token?: string,
  service = false,
  fetcher: typeof fetch = fetch,
): SupabaseClient {
  const key = service
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!process.env.SUPABASE_URL || !key)
    throw new ApiError(503, "admin_not_configured");
  return createClient(process.env.SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      fetch: (input, init) =>
        fetcher(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  });
}
async function identity(client: SupabaseClient, token: string) {
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "session_expired");
  const { data: role, error: roleError } =
    await client.rpc("current_admin_role");
  if (roleError) throw new ApiError(503, "role_verification_unavailable");
  if (!roles.includes(role)) throw new ApiError(403, "admin_required");
  return { user: data.user, role: role as AdminRole };
}
async function storedSession(
  client: SupabaseClient,
  s: CookieSession,
  userId: string,
) {
  const { data, error } = await client
    .from("admin_sessions")
    .select("expires_at,revoked_at")
    .eq("id", s.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError(503, "session_verification_unavailable");
  if (!data || data.revoked_at || Date.parse(data.expires_at) <= Date.now())
    throw new ApiError(401, "session_expired");
}
export async function requireAdmin(
  req: AdminRequest,
  allowed: AdminRole[] = roles,
  fetcher: typeof fetch = fetch,
) {
  if (!configured()) throw new ApiError(503, "admin_not_configured");
  const s = readSession(req);
  if (!s || s.expiresAt <= Date.now())
    throw new ApiError(401, "session_expired");
  const client = clientFor(s.accessToken, false, fetcher);
  const who = await identity(client, s.accessToken);
  await storedSession(client, s, who.user.id);
  if (!allowed.includes(who.role)) throw new ApiError(403, "role_forbidden");
  return { ...who, client, session: s };
}
async function rateLimit(
  req: AdminRequest,
  email: string,
  fetcher: typeof fetch,
) {
  const ip = String(
    req.headers["x-vercel-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown",
  )
    .split(",")[0]
    .trim();
  const service = clientFor(undefined, true, fetcher);
  for (const value of ["ip:" + ip, "email:" + email]) {
    const key = createHmac("sha256", secret()).update(value).digest("hex");
    const { data, error } = await service.rpc("consume_auth_attempt", {
      key_hash: key,
    });
    if (error) throw new ApiError(503, "authentication_unavailable");
    if (data !== true) throw new ApiError(429, "try_again_later");
  }
}
async function createSession(provider: SupabaseSession, fetcher: typeof fetch) {
  const client = clientFor(provider.access_token, false, fetcher);
  const who = await identity(client, provider.access_token);
  const s: CookieSession = {
    id: randomUUID(),
    accessToken: provider.access_token,
    refreshToken: provider.refresh_token,
    expiresAt: (provider.expires_at || 0) * 1000,
    sessionExpiry: Date.now() + 8 * 3600000 - 1000,
    csrf: randomBytes(32).toString("hex"),
  };
  sealSession(s);
  const { error } = await client.rpc("register_admin_session", {
    session_id: s.id,
    session_expiry: new Date(s.sessionExpiry).toISOString(),
  });
  if (error) throw new ApiError(503, "session_registration_failed");
  return { s, who };
}
export function createAdminHandler(fetcher: typeof fetch = fetch) {
  return async (req: AdminRequest, res: ServerResponse) => {
    try {
      const url = new URL(req.url || "/api/admin", "https://unused.test");
      const queryAction = req.query?.action;
      const action =
        typeof queryAction === "string"
          ? queryAction
          : url.searchParams.get("action") || "session";
      const methods: Record<string, string> = {
        session: "GET",
        authorize: "GET",
        login: "POST",
        logout: "POST",
        refresh: "POST",
        recover: "POST",
        "recovery-session": "POST",
        password: "POST",
      };
      if (!methods[action]) throw new ApiError(404, "not_found");
      if (req.method !== methods[action]) {
        res.setHeader("Allow", methods[action]);
        throw new ApiError(405, "method_not_allowed");
      }
      if (req.method === "POST" && !originAllowed(req))
        throw new ApiError(403, "origin_forbidden");
      if (!configured()) throw new ApiError(503, "admin_not_configured");
      if (action === "login") {
        const c = credentials(await body(req));
        await rateLimit(req, c.email, fetcher);
        const { data, error } = await clientFor(
          undefined,
          false,
          fetcher,
        ).auth.signInWithPassword(c);
        if (error || !data.session) throw new ApiError(401, "sign_in_failed");
        const { s, who } = await createSession(data.session, fetcher);
        writeSession(res, s);
        return response(res, 200, {
          authenticated: true,
          user: { email: who.user.email, role: who.role },
          csrfToken: s.csrf,
        });
      }
      if (action === "recover") {
        const c = credentials(await body(req), false);
        await rateLimit(req, c.email, fetcher);
        const { data: invited, error } = await clientFor(
          undefined,
          true,
          fetcher,
        ).rpc("is_invited_admin_email", { candidate: c.email });
        if (error) throw new ApiError(503, "authentication_unavailable");
        if (invited) {
          const redirect = process.env.ADMIN_RECOVERY_URL || "";
          let target: URL;
          try {
            target = new URL(redirect);
          } catch {
            throw new ApiError(503, "recovery_not_configured");
          }
          if (
            !originAllowed({
              ...req,
              headers: { ...req.headers, origin: target.origin },
            } as AdminRequest) ||
            target.pathname !== "/admin/login" ||
            target.search !== "" ||
            target.hash !== ""
          )
            throw new ApiError(503, "recovery_not_configured");
          const { error: recoveryError } = await clientFor(
            undefined,
            false,
            fetcher,
          ).auth.resetPasswordForEmail(c.email, { redirectTo: redirect });
          if (recoveryError) throw new ApiError(503, "recovery_unavailable");
        }
        return response(res, 200, {
          message:
            "If this is an authorised admin account, recovery instructions have been requested.",
        });
      }
      if (action === "recovery-session") {
        const value = await body(req);
        if (
          typeof value.tokenHash !== "string" ||
          !/^[a-f0-9]{32,128}$/i.test(value.tokenHash)
        )
          throw new ApiError(400, "invalid_recovery_link");
        await rateLimit(req, "recovery:" + value.tokenHash, fetcher);
        const { data, error } = await clientFor(
          undefined,
          false,
          fetcher,
        ).auth.verifyOtp({ token_hash: value.tokenHash, type: "recovery" });
        if (error || !data.session)
          throw new ApiError(401, "recovery_link_expired");
        const { s, who } = await createSession(data.session, fetcher);
        writeSession(res, s);
        return response(res, 200, {
          authenticated: true,
          user: { email: who.user.email, role: who.role },
          csrfToken: s.csrf,
          passwordRecovery: true,
        });
      }
      const s = readSession(req);
      if (!s) throw new ApiError(401, "session_expired");
      if (req.method === "POST" && !csrfValid(req, s))
        throw new ApiError(403, "csrf_failed");
      if (action === "logout") {
        const service = clientFor(undefined, true, fetcher);
        const { error } = await service
          .from("admin_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", s.id);
        if (error) throw new ApiError(503, "logout_unavailable");
        await service.auth.admin.signOut(s.accessToken, "local");
        writeSession(res);
        return response(res, 200, { authenticated: false });
      }
      if (action === "refresh") {
        const { data, error } = await clientFor(
          undefined,
          false,
          fetcher,
        ).auth.refreshSession({ refresh_token: s.refreshToken });
        if (error || !data.session) {
          writeSession(res);
          throw new ApiError(401, "session_expired");
        }
        const next = {
          ...s,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: (data.session.expires_at || 0) * 1000,
        };
        const client = clientFor(next.accessToken, false, fetcher);
        const who = await identity(client, next.accessToken);
        await storedSession(client, next, who.user.id);
        writeSession(res, next);
        return response(res, 200, {
          authenticated: true,
          user: { email: who.user.email, role: who.role },
          csrfToken: next.csrf,
        });
      }
      if (action === "session" && s.expiresAt <= Date.now())
        return response(res, 401, {
          error: "session_expired",
          refreshAvailable: true,
          csrfToken: s.csrf,
        });
      const who = await requireAdmin(req, roles, fetcher);
      if (action === "password") {
        const value = await body(req);
        if (
          typeof value.password !== "string" ||
          value.password.length < 12 ||
          value.password.length > 128
        )
          throw new ApiError(400, "password_too_short");
        const provider = clientFor(undefined, false, fetcher);
        await provider.auth.setSession({
          access_token: s.accessToken,
          refresh_token: s.refreshToken,
        });
        const { error } = await provider.auth.updateUser({
          password: value.password,
        });
        if (error) throw new ApiError(400, "password_update_failed");
        return response(res, 200, { updated: true });
      }
      return response(res, 200, {
        authenticated: true,
        user: { email: who.user.email, role: who.role },
        csrfToken: s.csrf,
        capabilities:
          who.role === "Staff"
            ? ["requests:read", "requests:status", "requests:notes"]
            : who.role === "Owner"
              ? [
                  "requests:manage",
                  "catalogue:manage",
                  "settings:manage",
                  "roles:manage",
                ]
              : ["requests:manage", "catalogue:manage", "settings:manage"],
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) writeSession(res);
        return response(res, e.status, { error: e.code });
      }
      return response(res, 503, { error: "administration_unavailable" });
    }
  };
}
