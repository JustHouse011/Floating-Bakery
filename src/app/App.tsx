import { lazy, Suspense, useEffect } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import { Cakes, CakeDetail } from "../pages/Cakes";
import { Catering } from "../pages/Info";
import About from "../pages/About";
import Contact from "../pages/Contact";
import {IS_PUBLIC_SITE} from '../config/siteMode';
import DeliveryReceipt from '../pages/Quotation/DeliveryReceipt';
import Unavailable from '../pages/Unavailable';
import PageMetadata from '../components/layout/PageMetadata';
import ProductEnquiry, { ProductEnquiryConfirmation } from '../pages/Quotation/ProductEnquiry';
import { useStore } from "zustand";
import { adminStore, initializeWorkspace } from "../store/adminStore";
const Admin = lazy(() => import("../pages/Admin/Admin"));
const AdminFoundation = lazy(() => import('../pages/Admin/AdminFoundation'));
const CakeDesigner = lazy(() => import("../pages/CakeDesigner/CakeDesigner"));
const QuotationRequest = lazy(
  () => import("../pages/Quotation/QuotationRequest"),
);
const QuotationConfirmation = lazy(
  () => import("../pages/Quotation/QuotationConfirmation"),
);
export default function App() {
  const ready = useStore(adminStore, (s) => s.ready);
  const storageError = useStore(adminStore, (s) => s.error);
  useEffect(() => {
    void initializeWorkspace();
    const reload = () => void initializeWorkspace();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }),
      );
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  if (!ready && !storageError && typeof window !== "undefined")
    return (
      <main
        id="main"
        className="section page-heading"
        role={storageError ? "alert" : "status"}
      >
        <h1>Floating Bakery</h1>
        <p>{storageError || "Preparing your bakery collection…"}</p>
        {storageError && (
          <button className="button" onClick={() => void initializeWorkspace()}>
            Retry local storage
          </button>
        )}
      </main>
    );
  return (
    <>
      <PageMetadata/>
      {!IS_PUBLIC_SITE && storageError && (
        <div className="section" role="alert">
          <p>
            {storageError} Browsing uses the last loaded or seeded demonstration
            configuration. Local edits cannot be saved until storage loads.
          </p>
          <button className="button" onClick={() => void initializeWorkspace()}>
            Retry local storage
          </button>
        </div>
      )}
      <Routes>
        <Route
          path="admin/*"
          element={
            <Suspense
              fallback={
                <main className="section" role="status">
                  Loading administration…
                </main>
              }
            >
              {IS_PUBLIC_SITE ? <AdminFoundation /> : <Admin />}
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="request-received" element={<DeliveryReceipt/>}/>
          <Route path="cakes" element={<Cakes />} />
          <Route path="cakes/:id" element={<CakeDetail />} />
          <Route path="product-enquiry/:id" element={<ProductEnquiry key={pathname + search} />} />
          <Route path="product-enquiries/:id" element={<ProductEnquiryConfirmation />} />
          <Route path="about" element={<About />} />
          <Route path="catering" element={<Catering />} />
          <Route path="contact" element={<Contact key={search} />} />
          <Route
            path="cake-designer"
            element={
              <Suspense
                fallback={
                  <section
                    className="section studio-route-loading"
                    role="status"
                  >
                    <h1>
                      Your cake <em>studio.</em>
                    </h1>
                    <p>Loading your design tools…</p>
                  </section>
                }
              >
                <CakeDesigner />
              </Suspense>
            }
          />
          <Route
            path="quote-request"
            element={
              <Suspense
                fallback={
                  <section className="section page-heading" role="status">
                    <h1>
                      Your cake <em>request.</em>
                    </h1>
                    <p>Loading the request form…</p>
                  </section>
                }
              >
                <QuotationRequest />
              </Suspense>
            }
          />
          <Route
            path="quotations/:id"
            element={
              IS_PUBLIC_SITE ? <Unavailable/> : <Suspense
                fallback={
                  <section className="section page-heading" role="status">
                    <h1>
                      Your saved <em>request.</em>
                    </h1>
                    <p>Opening this browser’s quotation…</p>
                  </section>
                }
              >
                <QuotationConfirmation />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <section className="section page-heading">
                <h1>
                  A little <em>detour.</em>
                </h1>
                <p>We couldn’t find that page.</p>
                <Link className="button" to="/">
                  Return home
                </Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
