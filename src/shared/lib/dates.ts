/** Format a YYYY-MM-DD date string for display */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns current ISO timestamp string */
export function nowIso(): string {
  return new Date().toISOString();
}
