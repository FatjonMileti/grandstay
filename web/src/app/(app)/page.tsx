"use client";

import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Gauge,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RevenueChart } from "@/components/revenue-chart";
import {
  Avatar,
  Button,
  LinkButton,
  PageHeader,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { api, ApiError, getUser } from "@/lib/api";
import {
  formatDateRange,
  money,
  typeLabel,
} from "@/lib/format";
import type { Booking, DashboardStats } from "@/lib/types";

const roomColors = [
  { key: "availableRooms", label: "Available", color: "#7d9f87" },
  { key: "occupiedRooms", label: "Occupied", color: "#526f83" },
  { key: "cleaningRooms", label: "Cleaning", color: "#d0a457" },
  { key: "maintenanceRooms", label: "Maintenance", color: "#bd7a74" },
] as const;

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("there");

  const load = useCallback(async () => {
    try {
      const data = await api<DashboardStats>("/dashboard/stats");
      setStats(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const user = getUser();
    if (user?.name) setFirstName(user.name.split(" ")[0]);
  }, [load]);

  async function moveBooking(booking: Booking, status: "CheckedIn" | "CheckedOut") {
    setBusyId(booking.id);
    try {
      await api(`/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(
        status === "CheckedIn"
          ? `${booking.guestName} checked into room ${booking.roomNumber}.`
          : `${booking.guestName} checked out. Room ${booking.roomNumber} is now in cleaning.`,
      );
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update the reservation.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk · Today"
        title={`${greeting}, ${firstName}`}
        description="A clear view of the house, your arrivals, and the day ahead."
        actions={
          <LinkButton href="/bookings?new=1">
            <Plus className="h-4 w-4" />
            New reservation
          </LinkButton>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-ink/10">
          <p className="text-sm text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Occupancy"
              value={`${stats.occupancyRate}%`}
              sub={`${stats.occupiedRooms} of ${stats.totalRooms} rooms occupied`}
              icon={<Gauge className="h-5 w-5" />}
              progress={stats.occupancyRate}
            />
            <StatCard
              label="Available rooms"
              value={String(stats.availableRooms)}
              sub={`${stats.cleaningRooms} in cleaning · ${stats.maintenanceRooms} offline`}
              icon={<BedDouble className="h-5 w-5" />}
            />
            <StatCard
              label="Arrivals today"
              value={String(stats.arrivalsToday)}
              sub={`${stats.departuresToday} departure${stats.departuresToday === 1 ? "" : "s"} expected`}
              icon={<LogIn className="h-5 w-5" />}
            />
            <StatCard
              label="Revenue this month"
              value={money(stats.revenueThisMonth)}
              sub={`${stats.activeBookings} active reservations`}
              icon={<Wallet className="h-5 w-5" />}
              dark
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <section className="rounded-3xl bg-white p-5 ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Revenue
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-ink">The last two weeks</h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-ink">
                    {money(stats.revenueSeries.reduce((total, point) => total + point.revenue, 0))}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">
                    Booked value
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <RevenueChart data={stats.revenueSeries} />
              </div>
            </section>

            <RoomMix stats={stats} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BookingList
              title="Today's arrivals"
              subtitle="Guests expected at the desk"
              icon={<LogIn className="h-4 w-4" />}
              bookings={stats.todaysArrivals}
              emptyTitle="No arrivals today"
              emptyDescription="The lobby is quiet — a rare and lovely thing."
              actionLabel="Check in"
              actionIcon={<CheckCircle2 className="h-4 w-4" />}
              busyId={busyId}
              onAction={(booking) => moveBooking(booking, "CheckedIn")}
            />
            <BookingList
              title="Today's departures"
              subtitle="Rooms turning over today"
              icon={<LogOut className="h-4 w-4" />}
              bookings={stats.todaysDepartures}
              emptyTitle="No departures today"
              emptyDescription="Every guest is staying a little longer."
              actionLabel="Check out"
              actionIcon={<LogOut className="h-4 w-4" />}
              busyId={busyId}
              onAction={(booking) => moveBooking(booking, "CheckedOut")}
            />
          </div>

          <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Reservations
                </p>
                <h3 className="mt-1 font-display text-2xl text-ink">Recently booked</h3>
              </div>
              <Link
                href="/bookings"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/50 transition hover:text-ink"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-y border-ink/[0.06] bg-parchment/30 text-[10px] uppercase tracking-[0.16em] text-ink/40">
                    <th className="px-5 py-3 font-semibold sm:px-6">Reference</th>
                    <th className="px-4 py-3 font-semibold">Guest</th>
                    <th className="px-4 py-3 font-semibold">Room</th>
                    <th className="px-4 py-3 font-semibold">Stay</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.06]">
                  {stats.recentBookings.map((booking) => (
                    <tr key={booking.id} className="text-sm transition hover:bg-parchment/20">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[11px] tracking-wide text-ink/45 sm:px-6">
                        {booking.reference}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={booking.guestName} size="sm" />
                          <div>
                            <p className="font-medium text-ink">{booking.guestName}</p>
                            <p className="text-[11px] text-ink/40">
                              {booking.guestEmail || "No email on file"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-medium text-ink">Room {booking.roomNumber}</p>
                        <p className="text-[11px] text-ink/40">{typeLabel(booking.roomType)}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-ink/60">
                        {formatDateRange(booking.checkIn, booking.checkOut)}
                        <span className="ml-1.5 text-[11px] text-ink/35">
                          · {booking.nights}n
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-ink sm:px-6">
                        {money(booking.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-ink/[0.06] border-t border-ink/[0.06] xl:hidden">
              {stats.recentBookings.map((booking) => (
                <div key={booking.id} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={booking.guestName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {booking.guestName}
                        </p>
                        <p className="truncate text-[11px] text-ink/40">
                          Room {booking.roomNumber} · {typeLabel(booking.roomType)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink/40">
                    <span>{formatDateRange(booking.checkIn, booking.checkOut)}</span>
                    <span className="text-[12px] font-medium text-ink">
                      {money(booking.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  progress,
  dark = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  progress?: number;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "relative overflow-hidden rounded-3xl bg-forest p-5 text-cream ring-1 ring-forest shadow-sm sm:p-6"
          : "rounded-3xl bg-white p-5 ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03] sm:p-6"
      }
    >
      {dark && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 10%, #d9c59c 0, transparent 45%)",
          }}
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className={
              dark
                ? "text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/45"
                : "text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40"
            }
          >
            {label}
          </p>
          <p
            className={
              dark
                ? "mt-2 font-display text-[30px] leading-none text-cream"
                : "mt-2 font-display text-[30px] leading-none text-ink"
            }
          >
            {value}
          </p>
        </div>
        <span
          className={
            dark
              ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-cream/10 text-gold-soft"
              : "flex h-10 w-10 items-center justify-center rounded-2xl bg-parchment text-gold"
          }
        >
          {icon}
        </span>
      </div>
      <div className="relative mt-4">
        {typeof progress === "number" && (
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
            <div
              className="h-full rounded-full bg-gold transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        <p className={dark ? "text-[11px] text-cream/45" : "text-[11px] text-ink/40"}>{sub}</p>
      </div>
    </div>
  );
}

function RoomMix({ stats }: { stats: DashboardStats }) {
  const segments = roomColors.map((item) => ({
    ...item,
    value: stats[item.key],
  }));
  const total = stats.totalRooms || 1;

  const cumulative = segments.map((_, index) =>
    segments.slice(0, index).reduce((sum, item) => sum + item.value, 0),
  );
  const stops = segments.map((segment, index) => {
    const start = (cumulative[index] / total) * 100;
    const end = ((cumulative[index] + segment.value) / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            House status
          </p>
          <h3 className="mt-1 font-display text-2xl text-ink">Room mix</h3>
        </div>
        <CalendarCheck className="h-5 w-5 text-ink/25" />
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-[132px] w-[132px] shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${stops.join(", ") || "#e7e1d5 0 100%"})` }}
          />
          <div className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="font-display text-[26px] leading-none text-ink">
              {stats.occupancyRate}%
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ink/35">
              Occupied
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[12px] text-ink/60">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="text-[12px] font-medium tabular-nums text-ink">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink/[0.06] pt-4">
        <p className="text-[11px] text-ink/40">{stats.totalRooms} rooms in total</p>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-ink/55 transition hover:text-ink"
        >
          Manage rooms
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function BookingList({
  title,
  subtitle,
  icon,
  bookings,
  emptyTitle,
  emptyDescription,
  actionLabel,
  actionIcon,
  busyId,
  onAction,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bookings: Booking[];
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
  actionIcon: React.ReactNode;
  busyId: string | null;
  onAction: (booking: Booking) => void;
}) {
  return (
    <section className="rounded-3xl bg-white ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-parchment text-gold">
            {icon}
          </span>
          <div>
            <h3 className="font-display text-xl leading-tight text-ink">{title}</h3>
            <p className="text-[11px] text-ink/40">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-parchment/60 px-2.5 py-1 text-[11px] font-semibold text-ink/50">
          {bookings.length}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="px-5 pb-6 sm:px-6">
          <div className="rounded-2xl border border-dashed border-ink/10 px-5 py-8 text-center">
            <p className="text-sm font-medium text-ink/70">{emptyTitle}</p>
            <p className="mt-1 text-xs text-ink/40">{emptyDescription}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-ink/[0.06] border-t border-ink/[0.06]">
          {bookings.slice(0, 5).map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-parchment/20 sm:px-6"
            >
              <Avatar name={booking.guestName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{booking.guestName}</p>
                <p className="text-[11px] text-ink/40">
                  Room {booking.roomNumber} · {booking.nights} night
                  {booking.nights === 1 ? "" : "s"} · {booking.guestsCount} guest
                  {booking.guestsCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={busyId === booking.id}
                onClick={() => onAction(booking)}
              >
                {actionIcon}
                {actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[148px] animate-pulse rounded-3xl bg-white ring-1 ring-ink/[0.06]"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-[340px] animate-pulse rounded-3xl bg-white ring-1 ring-ink/[0.06]" />
        <div className="h-[340px] animate-pulse rounded-3xl bg-white ring-1 ring-ink/[0.06]" />
      </div>
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink/40">
        <Spinner className="h-4 w-4" /> Loading the front desk…
      </div>
    </div>
  );
}
