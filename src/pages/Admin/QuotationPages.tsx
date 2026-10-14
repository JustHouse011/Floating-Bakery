import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, ArrowUpRight, ArrowLeft, Printer } from "lucide-react";
import {
  QUOTATION_STATUSES,
  type QuotationStatus,
} from "../../types/quotation";
import type { QuotationAudit } from "../../types/admin";
import { STATUS_TRANSITIONS } from "../../data/quotation";
import { filterQuotations } from "../../services/adminAnalytics";
import { adminRepository } from "../../services/adminRepository";
import { quotationRepository } from "../../services/quotationRepository";
import { formatZARCents } from "../../utils/currency";
import { formatEventDate } from "../../utils/quotation";
import QuotationSummary from "../../components/quotation/QuotationSummary";
import { useAdminRecords } from "./RecordsContext";
import { StatusBadge, Empty } from "./AnalyticsPages";
import { moneyToCents } from "../../services/adminMoney";
import ProductEnquiries from './ProductEnquiries';
import OfficialConfirmationPanel from './OfficialConfirmation';
export function Quotations() {
  const { records, loading, error } = useAdminRecords();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  if (error || loading) return null;
  const filtered = filterQuotations(records, { search, status, from, to });
  return (
    <>
      <ProductEnquiries />
      <div className="admin-toolbar admin-quote-filters">
        <label className="admin-field admin-search">
          <span>
            <Search size={16} /> Search requests
          </span>
          <input
            type="search"
            placeholder="Reference, customer or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="admin-field">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuotationStatus | "")}
          >
            <option value="">All statuses</option>
            {QUOTATION_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Event from
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="admin-field">
          Event to
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="admin-button secondary"
          onClick={() => {
            setSearch("");
            setStatus("");
            setFrom("");
            setTo("");
          }}
        >
          Clear
        </button>
      </div>
      {from && to && from > to && (
        <p role="alert" className="admin-error">
          The end date must follow the start date.
        </p>
      )}
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Customer requests</h2>
          <span>
            {filtered.length} of {records.length}
          </span>
        </div>
        {!records.length ? (
          <Empty />
        ) : filtered.length ? (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference / customer</th>
                  <th>Event date</th>
                  <th>Original estimate</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <Link to={`/admin/quotations/${q.id}`}>
                        <strong>{q.customer.fullName}</strong>
                        <small>{q.reference}</small>
                      </Link>
                    </td>
                    <td>
                      {formatEventDate(q.event.eventDate)}
                      <small>{q.event.eventType}</small>
                    </td>
                    <td>
                      {q.snapshot.official ? `${formatZARCents(q.snapshot.official.minimumEstimateCents)}–${formatZARCents(q.snapshot.official.maximumEstimateCents)}` : q.snapshot.estimate.estimatedTotalCents === null
                        ? "Manual quotation"
                        : formatZARCents(
                            q.snapshot.estimate.estimatedTotalCents,
                          )}
                      <small>
                        {q.snapshot.configuration.officialFlavour || q.snapshot.configuration.flavour} ·{" "}
                        {q.snapshot.configuration.size} inch
                      </small>
                    </td>
                    <td>
                      <StatusBadge status={q.status} />
                    </td>
                    <td>
                      <Link
                        to={`/admin/quotations/${q.id}`}
                        aria-label={`Open ${q.reference}`}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No requests match these filters.</p>
        )}
      </section>
      <p className="admin-notice">
        All amounts are demonstration estimates. Local status changes do not
        notify customers or create bookings.
      </p>
    </>
  );
}
export function QuotationDetail() {
  const { id } = useParams();
  const { records, loading, error, refresh } = useAdminRecords();
  const record = records.find((q) => q.id === id);
  const [audit, setAudit] = useState<QuotationAudit | null>(null);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [nextStatus, setNextStatus] = useState<QuotationStatus | "">("");
  useEffect(() => {
    let active = true;
    setAudit(null);
    setFailure("");
    if (record)
      void adminRepository
        .audit(record.id)
        .then((a) => {
          if (active) setAudit(a);
        })
        .catch((e) => {
          if (active)
            setFailure(
              e instanceof Error ? e.message : "Audit history failed to load.",
            );
        });
    return () => {
      active = false;
    };
  }, [record]);
  async function action(work: () => Promise<unknown>, message: string) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      await work();
      setNotice(message);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Change was not saved.");
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  function note(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!record) return;
    const form = e.currentTarget;
    const text = String(new FormData(form).get("note"));
    void action(async () => {
      setAudit(await adminRepository.appendAudit(record.id, { note: text }));
      form.reset();
    }, "Internal note saved locally.");
  }
  function revise(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!record) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    void action(async () => {
      setAudit(
        await adminRepository.appendAudit(record.id, {
          reason: String(data.get("reason")),
          amountCents: moneyToCents(String(data.get("amount"))),
        }),
      );
      form.reset();
    }, "Revision prepared locally. The customer has not accepted it.");
  }
  if (error || loading) return null;
  if (!record)
    return (
      <section className="admin-card">
        <h2>Quotation not found</h2>
        <p>This request is not stored on this browser.</p>
        <Link to="/admin/quotations">Back to quotations</Link>
      </section>
    );
  return (
    <>
      <div className="admin-toolbar admin-no-print">
        <Link className="admin-button secondary" to="/admin/quotations">
          <ArrowLeft size={16} />
          All quotations
        </Link>
        <button
          className="admin-button secondary"
          onClick={() => window.print()}
        >
          <Printer size={16} />
          Print quotation
        </button>
      </div>
      <section className="admin-card admin-quotation-heading">
        <div>
          <span className="admin-kicker">
            LOCAL REQUEST · ORIGINAL SNAPSHOT
          </span>
          <h2>{record.reference}</h2>
          <p>
            Saved{" "}
            {new Date(record.createdAt).toLocaleString("en-ZA", {
              timeZone: "Africa/Johannesburg",
            })}{" "}
            (South Africa)
          </p>
        </div>
        <StatusBadge status={record.status} />
      </section>
      <p className="admin-notice">
        This is a local demonstration request. Approval is not a verified
        booking. Revised amounts are prepared offers and are not customer
        acceptance.
      </p>
      {failure && (
        <p className="admin-error" role="alert">
          {failure}
        </p>
      )}
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
        {record.snapshot.official && <OfficialConfirmationPanel record={record} refreshed={refresh} />}
        <section className="admin-card">
          <QuotationSummary
          customer={record.customer}
          event={record.event}
          snapshot={record.snapshot}
          images={record.references}
        />
      </section>
      <div className="admin-grid-two admin-no-print">
        <section className="admin-card">
          <h2>Status management</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nextStatus)
                void action(async () => {
                  await quotationRepository.updateStatus(record.id, nextStatus);
                  setNextStatus("");
                  await refresh();
                }, "Status updated locally. No customer was notified.");
            }}
          >
            <fieldset disabled={busy}>
              <label className="admin-field">
                Next permitted status
                <select
                  value={nextStatus}
                  onChange={(e) =>
                    setNextStatus(e.target.value as QuotationStatus | "")
                  }
                  required
                >
                  <option value="">Choose a transition</option>
                  {STATUS_TRANSITIONS[record.status].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button className="admin-button" disabled={!nextStatus || busy}>
                Update status
              </button>
            </fieldset>
          </form>
          {!STATUS_TRANSITIONS[record.status].length && (
            <p>This status is terminal under the quotation lifecycle.</p>
          )}
          <h3 className="admin-subheading">Status history</h3>
          <ol className="admin-timeline">
            {record.statusHistory.map((entry, i) => (
              <li key={i}>
                <strong>{entry.to}</strong>
                <small>
                  {new Date(entry.at).toLocaleString("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                  })}{" "}
                  (South Africa)
                </small>
              </li>
            ))}
          </ol>
        </section>
        <section className="admin-card">
          <h2>Internal notes</h2>
          <p>
            Visible to anyone who can access this browser’s admin demo. Excluded
            from printing.
          </p>
          <form onSubmit={note}>
            <fieldset disabled={busy || !audit}>
              <label className="admin-field">
                New note
                <textarea
                  name="note"
                  required
                  maxLength={3000}
                  rows={3}
                  placeholder="Add details for the bakery team…"
                />
              </label>
              <button className="admin-button">Save note</button>
            </fieldset>
          </form>
          {audit?.notes.length ? (
            <ol className="admin-timeline">
              {audit.notes.map((n) => (
                <li key={n.id}>
                  <p className="admin-preserve-lines">{n.text}</p>
                  <small>
                    {new Date(n.at).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                    })}{" "}
                    (South Africa)
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <p>No internal notes.</p>
          )}
        </section>
      </div>
      <section className="admin-card">
        <h2>Revised quotation history</h2>
        <p>
          The original estimate, pricing version and cake configuration above
          remain unchanged.
        </p>
        <form className="admin-no-print" onSubmit={revise}>
          <fieldset disabled={busy || !audit || !!record.snapshot.official}>
            <div className="admin-form-grid">
              <label className="admin-field">
                Revised amount (ZAR)
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </label>
              <label className="admin-field">
                Adjustment reason
                <textarea name="reason" rows={2} required maxLength={2000} />
              </label>
            </div>
            <button className="admin-button">Prepare local revision</button>
          </fieldset>
        </form>
        {audit?.revisions.length ? (
          <ol className="admin-revisions">
            {audit.revisions.map((r, i) => (
              <li key={r.id}>
                <div className="admin-card-heading">
                  <h3>
                    Revision {i + 1} · {formatZARCents(r.revisedAmountCents)}
                  </h3>
                  <span className="admin-local-badge">
                    NOT ACCEPTED BY CUSTOMER
                  </span>
                </div>
                <p className="admin-preserve-lines">{r.reason}</p>
                <small>
                  Prepared{" "}
                  {new Date(r.at).toLocaleString("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                  })}{" "}
                  (South Africa) · Original pricing {r.originalPricingVersion}
                </small>
                <p>
                  Original customer estimate:{" "}
                  {r.originalEstimateCents === null
                    ? "Manual quotation required"
                    : formatZARCents(r.originalEstimateCents)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p>No revisions prepared.</p>
        )}
      </section>
    </>
  );
}
