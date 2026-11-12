export function formatInr(value: number | null | undefined, showSymbol = true): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return showSymbol ? `₹${formatted}` : formatted;
}

export function formatSignedChange(change: number, changePct: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
}

export function formatIndianVolume(volume: number | null | undefined): string {
  if (!volume || volume <= 0) return "—";
  if (volume >= 10_000_000) {
    return `${(volume / 10_000_000).toFixed(2)} Cr`;
  }
  if (volume >= 100_000) {
    return `${(volume / 100_000).toFixed(2)} L`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)} K`;
  }
  return volume.toLocaleString("en-IN");
}

export function formatIstTime(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return isoTimestamp;
  }
}
