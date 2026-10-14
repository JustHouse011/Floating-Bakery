import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  CircleDollarSign,
  Clock3,
} from "lucide-react";
import {
  quotationAnalytics,
  groupCalendarEvents,
} from "../../services/adminAnalytics";
import { formatZARCents } from "../../utils/currency";
import { southAfricanDate, formatEventDate } from "../../utils/quotation";
import {
  QUOTATION_STATUSES,
  type QuotationStatus,
} from "../../types/quotation";
import { useAdminRecords } from "./RecordsContext";
export function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span
      className={`admin-status status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}
export function Empty({
  text = "No saved quotation requests yet.",
}: {
  text?: string;
}) {
  return (
    <div className="admin-empty">
      <ClipboardList size={28} />
      <h3>{text}</h3>
      <p>
        Submit a local request from the Cake Designer to populate this
        workspace.
      </p>
      <Link to="/cake-designer" className="admin-button secondary">
        Open Cake Designer <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
export function Bars({
  title,
  items,
  empty = "No data to report.",
}: {
  title: string;
  items: [string, number][];
  empty?: string;
}) {
  const max = Math.max(1, ...items.map(([, n]) => n));
  return (
    <section className="admin-card">
      <h2>{title}</h2>
      {items.length && items.some(([, n]) => n) ? (
        <ul className="admin-bars" aria-label={title}>
          {items.map(([label, count]) => (
            <li key={label}>
              <div>
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
              <div className="admin-bar-track" aria-hidden="true">
                <span style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted">{empty}</p>
      )}
    </section>
  );
}
export function Overview() {
  const { records, error, loading } = useAdminRecords();
  if (error || loading) return null;
  const a = quotationAnalytics(records);
  const cards = [
    ["Total requests", a.total, ClipboardList],
    ["New requests", a.status.New, Clock3],
    ["Under review", a.status["Under Review"], Clock3],
    ["Approved", a.status.Approved, ClipboardList],
    ["Declined", a.status.Declined, ClipboardList],
    ["Upcoming events", a.upcoming.length, CalendarDays],
  ] as const;
  return (
    <>
      <div className="admin-overview-intro">
        <div>
          <h2>A clear view of your requests.</h2>
          <p>Local estimates and event demand, ready for bakery review.</p>
        </div>
        <Link to="/admin/quotations" className="admin-button">
          Review quotations <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="admin-metrics">
        {cards.map(([label, value, Icon]) => (
          <article className="admin-card admin-metric" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <small>Stored demonstration requests</small>
          </article>
        ))}
      </div>
      <article className="admin-card admin-value-card">
        <CircleDollarSign size={24} />
        <div>
          <span>Total original estimated quotation value</span>
          <strong>
            {a.estimatedValueCents === null
              ? "Total exceeds reporting range"
              : formatZARCents(a.estimatedValueCents)}
          </strong>
          <p>
            {a.estimatedCount} priced requests · {a.manualCount} manual requests
            excluded. This is not confirmed revenue; revisions are reported
            separately.
          </p>
        </div>
      </article>
      <div className="admin-grid-two">
        <Bars
          title="Quotation activity by submission date"
          items={[...a.activity]
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-14)}
        />
        <Bars
          title="Request status distribution"
          items={Object.entries(a.status)}
        />
      </div>
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Upcoming occasions</h2>
          <Link to="/admin/calendar">
            View calendar <ArrowUpRight size={15} />
          </Link>
        </div>
        {a.upcoming.length ? (
          <div className="admin-request-list">
            {a.upcoming.slice(0, 5).map((q) => (
              <Link key={q.id} to={`/admin/quotations/${q.id}`}>
                <span className="admin-date-tile">
                  {q.event.eventDate.slice(8)}
                  <small>
                    {new Date(`${q.event.eventDate}T12:00Z`).toLocaleDateString(
                      "en-ZA",
                      { month: "short", timeZone: "Africa/Johannesburg" },
                    )}
                  </small>
                </span>
                <div>
                  <strong>{q.customer.fullName}</strong>
                  <small>
                    {q.event.eventType} · {q.reference}
                  </small>
                </div>
                <StatusBadge status={q.status} />
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty text={records.length ? "No upcoming requests." : undefined} />
        )}
      </section>
      <p className="admin-notice">
        Approved means approved in this local demonstration. No event is
        verified as a confirmed booking.
      </p>
    </>
  );
}
export function Reports() {
  const { records, error, loading } = useAdminRecords();
  if (error || loading) return null;
  if (!records.length) return <Empty />;
  const a = quotationAnalytics(records);
  return (
    <>
      <div className="admin-notice">
        Reports use original customer snapshots. Estimated amounts include
        declined requests and exclude manual-only requests. They are not sales
        or revenue.
      </div>
      <div className="admin-grid-two">
        <Bars title="Requests by status" items={Object.entries(a.status)} />
        <Bars title="Most requested base sizes" items={a.sizes} />
        <Bars title="Popular flavours" items={a.flavours} />
        <Bars
          title="Popular decorations"
          items={a.decorations}
          empty="No decorations selected."
        />
        <Bars title="Upcoming event demand by month" items={a.demand} />
        <section className="admin-card">
          <h2>Original quotation values</h2>
          <strong className="admin-report-total">
            {a.estimatedValueCents === null
              ? "Total exceeds reporting range"
              : formatZARCents(a.estimatedValueCents)}
          </strong>
          <p>
            {a.estimatedCount} priced requests. {a.manualCount} require manual
            quotation.
          </p>
          <p>
            Each request counts once. Size reports count the base size; tier
            sizes remain visible in quotation detail. Internal revisions do not
            replace these customer estimates.
          </p>
        </section>
      </div>
    </>
  );
}
export function Calendar() {
  const { records, error, loading } = useAdminRecords();
  const [month, setMonth] = useState(southAfricanDate().slice(0, 7));
  const [status, setStatus] = useState<QuotationStatus | "">("");
  if (error || loading) return null;
  const [year, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, m - 1, 1, 12));
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = (start.getUTCDay() + 6) % 7;
  const groups = groupCalendarEvents(records, month, status);
  function move(delta: number) {
    setMonth(
      new Date(Date.UTC(year, m - 1 + delta, 1, 12)).toISOString().slice(0, 7),
    );
  }
  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-calendar-controls">
          <button
            className="admin-icon-button"
            onClick={() => move(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <h2>
            {start.toLocaleDateString("en-ZA", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </h2>
          <button
            className="admin-icon-button"
            onClick={() => move(1)}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
          <button
            className="admin-button secondary"
            onClick={() => setMonth(southAfricanDate().slice(0, 7))}
          >
            Today
          </button>
        </div>
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
      </div>
      <div className="admin-notice">
        All entries are quotation requests. Green indicates local approval, not
        a verified booking. Declined requests remain visible when selected.
      </div>
      <section className="admin-card admin-calendar">
        <div className="admin-calendar-week">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="admin-calendar-grid">
          {Array.from({ length: offset }, (_, i) => (
            <div className="admin-calendar-blank" key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <div
                className={`admin-calendar-day ${date === southAfricanDate() ? "today" : ""}`}
                key={date}
              >
                <time dateTime={date}>{i + 1}</time>
                {groups[date]?.map((q) => (
                  <Link
                    key={q.id}
                    className={
                      q.status === "Approved" ? "locally-approved" : ""
                    }
                    to={`/admin/quotations/${q.id}`}
                    title={`${q.customer.fullName} · ${q.status} · ${formatEventDate(date)}`}
                  >
                    <span>{q.customer.fullName}</span>
                    <small>{q.status}</small>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </section>
      <section className="admin-card admin-calendar-agenda">
        <h2>This month’s requests</h2>
        {Object.keys(groups).length ? (
          <div className="admin-request-list">
            {Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .flatMap(([date, quotes]) =>
                quotes.map((q) => (
                  <Link to={`/admin/quotations/${q.id}`} key={q.id}>
                    <div>
                      <strong>{q.customer.fullName}</strong>
                      <small>
                        {formatEventDate(date)} · {q.event.eventType}
                      </small>
                    </div>
                    <StatusBadge status={q.status} />
                  </Link>
                )),
              )}
          </div>
        ) : (
          <p>No requests match this month and status.</p>
        )}
      </section>
    </>
  );
}
