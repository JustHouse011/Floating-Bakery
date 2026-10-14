let currencyLocale: "en-ZA" | "en-GB" = "en-ZA";
export function setCurrencyLocale(locale: "en-ZA" | "en-GB") {
  currencyLocale = locale;
}
export const formatRand = (value: number) =>
  new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);
export function formatZARCents(cents: number): string {
  if (!Number.isSafeInteger(cents))
    throw new Error("Money must be expressed as safe integer cents");
  return new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
