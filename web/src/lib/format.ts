import type { BookingStatus, RoomStatus, RoomType } from "./types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function money(value: number): string {
  return currency.format(value);
}

export function formatDate(value: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(value));
}

export function formatShortDate(value: string): string {
  return formatDate(value, { year: undefined });
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const startLabel = formatDate(checkIn, { year: undefined });
  const endLabel = sameMonth
    ? formatDate(checkOut, { month: undefined, year: undefined })
    : formatDate(checkOut, { year: undefined });
  return `${startLabel} – ${endLabel}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function titleCase(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export const roomStatusStyles: Record<RoomStatus, string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Occupied: "bg-blue-50 text-blue-700 ring-blue-200",
  Cleaning: "bg-amber-50 text-amber-700 ring-amber-200",
  Maintenance: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const bookingStatusStyles: Record<BookingStatus, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CheckedIn: "bg-blue-50 text-blue-700 ring-blue-200",
  CheckedOut: "bg-slate-100 text-slate-600 ring-slate-200",
  Cancelled: "bg-rose-50 text-rose-600 ring-rose-200",
};

export const bookingStatusLabel: Record<BookingStatus, string> = {
  Confirmed: "Confirmed",
  CheckedIn: "Checked in",
  CheckedOut: "Checked out",
  Cancelled: "Cancelled",
};

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysInput(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function typeLabel(type: RoomType): string {
  return type === "Penthouse" ? "Penthouse" : `${type} room`;
}
