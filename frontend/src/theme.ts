import type { Status } from "./types";

// Lifted verbatim from the Claude Design source (Job Tracker Dashboard.dc.html)
// so the rendered look matches the design exactly.

export const STATUS_ORDER: Status[] = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted",
];

export const STATUS_META: Record<Status, { bg: string; fg: string }> = {
  Applied: { bg: "rgba(124,154,224,.14)", fg: "#93aee8" },
  Interviewing: { bg: "rgba(201,168,118,.16)", fg: "#d4b783" },
  Offer: { bg: "rgba(127,185,154,.16)", fg: "#8fc7a6" },
  Rejected: { bg: "rgba(196,142,148,.14)", fg: "#cf9aa0" },
  Ghosted: { bg: "rgba(168,140,196,.14)", fg: "#b79bd1" },
};

export const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: "#7c9ae0",
  Indeed: "#7fb99a",
  "Company Site": "#c9a876",
  Wellfound: "#a888c9",
  Greenhouse: "#7fb99a",
  Lever: "#8b93a3",
};

export function sourceColor(source: string | null): string {
  return (source && SOURCE_COLORS[source]) || "#8b93a3";
}

export function nextStatus(current: Status): Status {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
