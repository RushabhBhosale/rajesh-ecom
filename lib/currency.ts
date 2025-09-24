export function formatCurrency(value: number, options?: Intl.NumberFormatOptions) {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    ...options,
  });

  return formatter.format(Number.isFinite(value) ? value : 0);
}
