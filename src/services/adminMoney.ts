export function moneyToCents(input: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.trim()))
    throw new Error("Enter a non-negative amount with at most two decimals.");
  const [whole, decimals = ""] = input.trim().split(".");
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents))
    throw new Error("Amount exceeds the supported range.");
  return cents;
}
