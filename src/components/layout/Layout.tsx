import { useCallback, useEffect, useRef, useState } from "react";
import { useDrawerFocus } from "../../hooks/useDrawerFocus";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import PublicInteractions from './PublicInteractions';
import { Menu, X } from "lucide-react";
import SiteFooter from './SiteFooter';
import '../../styles/navigation-footer.css';
const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Catalogue", "/cakes"],
  ["Catering", "/catering"],
  ["Cake Designer", "/cake-designer"],
  ["Contact", "/contact"],
];
export default function Layout() {
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDrawerFocus(open, nav, menu, close);
  useEffect(() => {
    const resize = () => {
      if (innerWidth > 950) setOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <div className="public-site">
      <PublicInteractions />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        Freshness in Every Bite.{" "}
        <span>Made for your special moments.</span>
      </div>
      <header className="site-header">
        <Link to="/" className="brand site-logo" onClick={close}>
          <img className="official-brand-logo" src="/images/catalogue/official-logo.webp" width={287} height={266} alt="Floating Bakery & Caterers" />
        </Link>
        <button
          className="menu-toggle"
          ref={menu}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          ref={nav}
          className={open ? "site-navigation open" : "site-navigation"}
          aria-label="Main navigation"
        >
          <div className="site-nav-group site-nav-left">{links.slice(0, 3).map(([name, path]) => <NavLink key={name} to={path} end onClick={close}>{name}</NavLink>)}</div>
          <div className="site-nav-group site-nav-right">{links.slice(3).map(([name, path]) => <NavLink key={name} to={path} end onClick={close}>{name}</NavLink>)}
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="route-content" key={pathname}><Outlet /></div>
      </main>
      <SiteFooter />
    </div>
  );
}
