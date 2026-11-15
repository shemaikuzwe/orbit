import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Synced timestamps use Postgres text format ("2026-11-15 21:33:00+00"),
// local writes use ISO. Normalize both before parsing.
export function parseTimestamp(value: string) {
  return new Date(
    value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
  ).getTime();
}

export function timeAgo(value: string) {
  const minutes = Math.round((Date.now() - parseTimestamp(value)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 60 / 24)}d ago`;
}

/** "2026-11-18" -> "Nov 18"; non-ISO legacy values pass through. */
export function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value < new Date().toISOString().slice(0, 10)
  );
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
