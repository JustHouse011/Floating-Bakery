import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "../../styles/admin-auth.css";
interface Identity {
  email: string;
  role: "Owner" | "Administrator" | "Staff";
}
const messages: Record<string, string> = {
  admin_not_configured: "Administration is awaiting backend configuration.",
  sign_in_failed: "Sign-in failed. Check your email and password.",
  admin_required: "This account is not authorised to administer the bakery.",
  session_expired: "Your session has expired. Please sign in again.",
  try_again_later: "Too many attempts. Please try again later.",
  password_too_short: "Use a password with at least 12 characters.",
  recovery_link_expired: "This recovery link has expired. Request a new one.",
};
export default function AdminFoundation() {
  const started = useRef(false);
  const [user, setUser] = useState<Identity>(),
    [csrf, setCsrf] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [recovery, setRecovery] = useState(false),
    [configured, setConfigured] = useState(true);
  async function request(
    action: string,
    data?: unknown,
    token = csrf,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`/api/admin?action=${action}`, {
      method: data === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers:
        data === undefined
          ? {}
          : {
              "Content-Type": "application/json",
              ...(token ? { "X-CSRF-Token": token } : {}),
            },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const result = await response.json();
    if (
      response.status === 401 &&
      action === "session" &&
      result.refreshAvailable &&
      result.csrfToken
    )
      return request("refresh", {}, result.csrfToken);
    if (!response.ok) {
      if (
        response.status === 401 ||
        result.error === "admin_required" ||
        result.error === "role_forbidden"
      ) {
        setUser(undefined);
        setCsrf("");
      }
      if (result.error === "admin_not_configured") setConfigured(false);
      throw Error(
        messages[result.error] ||
          "Administration is unavailable. Please try again.",
      );
    }
    if (result.csrfToken) setCsrf(result.csrfToken);
    if (result.authenticated && result.user) {
      setUser(result.user);
      setEmail(result.user.email);
    }
    return result;
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    document.title = "Administration | Floating Bakery & Caterers";
    const params = new URLSearchParams(location.search),
      hash = params.get("token_hash");
    if (hash) {
      history.replaceState(null, "", location.pathname);
      setRecovery(true);
      void request("recovery-session", { tokenHash: hash })
        .catch((e) => {
          setRecovery(false);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    } else
      void request("session")
        .catch((e) => {
          if (!e.message.includes("expired")) setError(e.message);
        })
        .finally(() => setLoading(false));
    // Authentication is verified by the server; tokens never enter browser storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(
      () => void request("session").catch((e) => setError(e.message)),
      60000,
    );
    const focus = () =>
      void request("session").catch((e) => setError(e.message));
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (recovery && user) {
        await request("password", { password });
        setRecovery(false);
        setNotice("Password updated.");
      } else await request("login", { email, password });
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  async function recover() {
    setBusy(true);
    setError("");
    try {
      const result = await request("recover", { email });
      setNotice(String(result.message));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recovery is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="section page-heading admin-auth">
      <img
        src="/Logo.svg"
        width={90}
        height={90}
        alt="Floating Bakery & Caterers"
      />
      <h1>Bakery administration</h1>
      {loading ? (
        <p role="status">Checking your session…</p>
      ) : user && !recovery ? (
        <>
          <p>
            Signed in as {user.email} · {user.role}
          </p>
          <p>
            The authentication foundation is ready. The connected dashboard will
            be introduced after Stage 9A review.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await request("logout", {});
                setUser(undefined);
                setCsrf("");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign-out failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Sign out
          </button>
        </>
      ) : configured ? (
        <form onSubmit={(e) => void submit(e)}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy || (recovery && !!user)}
            />
          </label>
          <label>
            {recovery && user ? "New password" : "Password"}
            <input
              type="password"
              autoComplete={recovery ? "new-password" : "current-password"}
              required
              minLength={recovery ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy
              ? "Please wait…"
              : recovery && user
                ? "Update password"
                : "Sign in"}
          </button>
          {!recovery && (
            <button
              type="button"
              className="text-link"
              disabled={busy || !email}
              onClick={() => void recover()}
            >
              Forgot your password?
            </button>
          )}
          <p>Access is by invitation. Public registration is unavailable.</p>
        </form>
      ) : null}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <Link className="text-link" to="/">
        Return to bakery website
      </Link>
    </main>
  );
}
