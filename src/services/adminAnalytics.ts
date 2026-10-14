import type { QuotationRecord, QuotationStatus } from "../types/quotation";
import { QUOTATION_STATUSES } from "../types/quotation";
import { southAfricanDate } from "../utils/quotation";
export interface AdminQuotationFilter {
  search?: string;
  status?: QuotationStatus | "";
  from?: string;
  to?: string;
}
export function filterQuotations(
  records: QuotationRecord[],
  filter: AdminQuotationFilter,
) {
  const query = (filter.search ?? "").trim().toLowerCase();
  return records.filter(
    (q) =>
      (!filter.status || q.status === filter.status) &&
      (!filter.from || q.event.eventDate >= filter.from) &&
      (!filter.to || q.event.eventDate <= filter.to) &&
      (!query ||
        `${q.reference} ${q.customer.fullName} ${q.customer.email}`
          .toLowerCase()
          .includes(query)),
  );
}
export function groupCalendarEvents(
  records: QuotationRecord[],
  month: string,
  status: QuotationStatus | "" = "",
) {
  const groups: Record<string, QuotationRecord[]> = {};
  for (const q of records)
    if (
      q.event.eventDate.startsWith(`${month}-`) &&
      (!status || q.status === status)
    )
      (groups[q.event.eventDate] ??= []).push(q);
  return groups;
}
function counts(items: string[]) {
  return Object.entries(
    items.reduce<Record<string, number>>((out, key) => {
      out[key] = (out[key] ?? 0) + 1;
      return out;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
export function quotationAnalytics(
  records: QuotationRecord[],
  today = southAfricanDate(),
) {
  const status = Object.fromEntries(
    QUOTATION_STATUSES.map((s) => [
      s,
      records.filter((q) => q.status === s).length,
    ]),
  ) as Record<QuotationStatus, number>;
  const upcoming = records
    .filter((q) => q.event.eventDate >= today && q.status !== "Declined")
    .sort((a, b) => a.event.eventDate.localeCompare(b.event.eventDate));
  const values = records
    .map((q) => q.snapshot.estimate.estimatedTotalCents)
    .filter((n): n is number => n !== null);
  const sum = values.reduce((a, b) => a + b, 0);
  const estimatedValueCents = Number.isSafeInteger(sum) ? sum : null;
  return {
    total: records.length,
    status,
    estimatedValueCents,
    estimatedCount: values.length,
    manualCount: records.length - values.length,
    upcoming,
    activity: counts(
      records.map((q) => southAfricanDate(new Date(q.createdAt))),
    ),
    sizes: counts(
      records.map((q) => `${q.snapshot.configuration.size} inch base`),
    ),
    flavours: counts(records.map((q) => q.snapshot.configuration.flavour)),
    decorations: counts(
      records.flatMap((q) =>
        Object.entries(q.snapshot.configuration.decorations)
          .filter(([, on]) => on)
          .map(([key]) => key),
      ),
    ),
    demand: counts(upcoming.map((q) => q.event.eventDate.slice(0, 7))),
  };
}
