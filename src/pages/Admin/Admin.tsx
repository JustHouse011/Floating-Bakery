import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  CakeSlice,
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  ClipboardList,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import type { QuotationRecord } from "../../types/quotation";
import { quotationRepository } from "../../services/quotationRepository";
import { useBakerySettings } from "../../store/adminStore";
import { Overview, Calendar, Reports } from "./AnalyticsPages";
import { Products, Pricing, AdminSettings } from "./ConfigurationPages";
import { Quotations, QuotationDetail } from "./QuotationPages";
import "../../styles/quotation.css";
import "../../styles/admin.css";
import { useDrawerFocus } from "../../hooks/useDrawerFocus";
import { RecordsContext } from "./RecordsContext";
import {IS_ADMIN_PREVIEW} from '../../config/siteMode';
const links = [
  ["", "Overview", LayoutDashboard],
  ["products", "Products", Package],
  ["pricing", "Pricing", SlidersHorizontal],
  ["quotations", "Quotations", ClipboardList],
  ["calendar", "Calendar", CalendarDays],
  ["reports", "Reports", ChartNoAxesCombined],
  ["settings", "Settings", Settings],
] as const;
export default function Admin() {
  const [records, setRecords] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => setMobile(false), []);
  useDrawerFocus(mobile, drawer, menu, closeDrawer);
  const settings = useBakerySettings();
  const { pathname } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const key = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const rows = await quotationRepository.list();
      if (key === generation.current) setRecords(rows);
    } catch (e) {
      if (key === generation.current)
        setError(e instanceof Error ? e.message : "Quotation storage failed.");
    } finally {
      if (key === generation.current) setLoading(false);
    }
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    void refresh();
    const reload = () => void refresh();
    window.addEventListener("focus", reload);
    return () => {
      cancel();
      window.removeEventListener("focus", reload);
    };
  }, [refresh, cancel]);
  useEffect(() => {
    heading.current?.focus();
    document.title = `Administration | ${settings.businessName}`;
  }, [pathname, settings.businessName]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", escape);
    const resize=()=>{if(innerWidth>900)setMobile(false);};
    window.addEventListener('resize',resize);
    return () => {window.removeEventListener("keydown", escape);window.removeEventListener('resize',resize);};
  }, []);
  const title =
    links.find(
      ([path]) => path && pathname.startsWith(`/admin/${path}`),
    )?.[1] ?? "Overview";
  return (
    <RecordsContext.Provider value={{ records, loading, error, refresh }}>
      <div className="admin-shell">
        <aside
          ref={drawer}
          className={`admin-sidebar ${mobile ? "is-open" : ""}`}
          id="admin-navigation"
        >
          <Link
            className="admin-brand"
            to="/admin"
            onClick={() => setMobile(false)}
          >
            <span className="admin-brand-mark">
              <CakeSlice size={24} />
            </span>
            <span>
              Floating Bakery<small>ADMINISTRATION</small>
            </span>
          </Link>
          <button
            className="admin-close"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          <p className="admin-nav-label">WORKSPACE</p>
          <nav aria-label="Administration">
            {links.map(([path, label, Icon]) => (
              <NavLink
                key={label}
                end={!path}
                to={`/admin${path ? `/${path}` : ""}`}
                onClick={() => setMobile(false)}
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <span className="admin-demo-dot" /> Local demonstration
            <p>
              {IS_ADMIN_PREVIEW ? 'Preview access is protected by Vercel sign-in. Mock changes stay in this browser and do not update the live website. Intended admin: bnombamba@icloud.com.' : 'This workspace has no authentication. Anyone using this browser can access its records.'}
            </p>
            <Link to="/">
              View bakery website <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
        {mobile && (
          <button
            className="admin-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="admin-main">
          <header className="admin-topbar">
            <div>
              <button
                className="admin-menu"
                ref={menu}
                aria-label="Open navigation"
                aria-controls="admin-navigation"
                aria-expanded={mobile}
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={22} />
              </button>
              <span>
                Workspace <span className="admin-slash">/</span> {title}
              </span>
            </div>
            <div>
              <span className="admin-local-badge">LOCAL DEMO</span>
              <button
                className="admin-icon-button"
                title="Refresh local quotations"
                aria-label="Refresh local quotations"
                disabled={loading}
                onClick={() => void refresh()}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </header>
          <main className="admin-content" id="admin-main">
            <div className="admin-page-heading">
              <span className="admin-kicker">FLOATING BAKERY & CATERERS</span>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>Manage this browser’s demonstration workspace.</p>
            </div>
            {loading && (
              <p role="status" className="admin-notice">
                Reading local quotation records…
              </p>
            )}
            {error && (
              <div role="alert" className="admin-error">
                <p>
                  {error} Reports are unavailable until the records can be read.
                </p>
                <button onClick={() => void refresh()}>
                  Retry quotation storage
                </button>
              </div>
            )}
            <Routes>
              <Route index element={<Overview />} />
              <Route path="products" element={<Products />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="quotations/:id" element={<QuotationDetail />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route
                path="*"
                element={
                  <div className="admin-card">
                    <h2>Page not found</h2>
                    <Link to="/admin">Return to overview</Link>
                  </div>
                }
              />
            </Routes>
          </main>
          <footer className="admin-footer">
            Saved on this browser only · No bakery notification, customer
            acceptance or payment processing
          </footer>
        </div>
      </div>
    </RecordsContext.Provider>
  );
}
