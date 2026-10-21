"use client";

import {
  Ban,
  CalendarDays,
  Eye,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingForm } from "@/components/booking-form";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { api, ApiError, toDateInput } from "@/lib/api";
import {
  bookingStatusLabel,
  formatDate,
  formatDateRange,
  money,
  todayInput,
  typeLabel,
} from "@/lib/format";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";

type Filter = "All" | BookingStatus;

export default function BookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<Booking[]>("/bookings");
      setBookings(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      window.history.replaceState(null, "", "/bookings");
    }
  }, []);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      All: bookings.length,
      Confirmed: 0,
      CheckedIn: 0,
      CheckedOut: 0,
      Cancelled: 0,
    };
    bookings.forEach((booking) => {
      base[booking.status] += 1;
    });
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (filter !== "All" && booking.status !== filter) return false;
      if (!term) return true;
      return [
        booking.reference,
        booking.guestName,
        booking.guestEmail,
        booking.roomNumber,
        booking.roomType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [bookings, filter, search]);

  async function updateStatus(booking: Booking, status: BookingStatus) {
    setBusyId(booking.id);
    try {
      const updated = await api<Booking>(`/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(
        status === "CheckedIn"
          ? `${booking.guestName} is checked into room ${booking.roomNumber}.`
          : status === "CheckedOut"
            ? `${booking.guestName} checked out. Room ${booking.roomNumber} needs cleaning.`
            : `${booking.reference} cancelled.`,
      );
      setDetail((current) => (current?.id === booking.id ? updated : current));
      setCancelTarget(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update the reservation.", "error");
    } finally {
      setBusyId(null);
      setCancelLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(booking: Booking) {
    setEditing(booking);
    setDetail(null);
    setFormOpen(true);
  }

  function handleSaved(message: string) {
    setFormOpen(false);
    setEditing(null);
    toast(message);
    load();
  }

  const canCheckIn = (booking: Booking) =>
    booking.status === "Confirmed" && toDateInput(booking.checkIn) <= todayInput();

  const filters: Filter[] = ["All", ...BOOKING_STATUSES];

  const renderActions = (booking: Booking) => (
    <>
      {canCheckIn(booking) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus(booking, "CheckedIn")}
          loading={busyId === booking.id}
          aria-label={`Check in ${booking.guestName}`}
          title="Check in"
          className="text-emerald-700 hover:bg-emerald-50"
        >
          <LogIn className="h-4 w-4" />
        </Button>
      )}
      {booking.status === "CheckedIn" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateStatus(booking, "CheckedOut")}
          loading={busyId === booking.id}
          aria-label={`Check out ${booking.guestName}`}
          title="Check out"
          className="text-blue-700 hover:bg-blue-50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
      {booking.status === "Confirmed" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCancelTarget(booking)}
          aria-label={`Cancel ${booking.reference}`}
          title="Cancel reservation"
          className="hover:bg-rose-50 hover:text-rose-600"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDetail(booking)}
        aria-label={`View ${booking.reference}`}
        title="View details"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk"
        title="Reservations"
        description="From enquiry to check-out — every stay, neatly in one place."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New reservation
          </Button>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? "inline-flex items-center gap-2 rounded-full bg-forest px-3.5 py-1.5 text-[12px] font-medium text-cream"
                  : "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-ink/50 transition hover:bg-parchment/60 hover:text-ink"
              }
            >
              {value === "All" ? "All stays" : bookingStatusLabel[value]}
              <span
                className={
                  filter === value
                    ? "rounded-full bg-cream/15 px-1.5 text-[10px] text-cream/80"
                    : "rounded-full bg-ink/[0.05] px-1.5 text-[10px] text-ink/40"
                }
              >
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, guest or room…"
              className="pl-10"
            />
          </div>
          <Button variant="secondary" size="icon" onClick={load} aria-label="Refresh reservations">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/40">
          <Spinner className="h-5 w-5" /> Reading the reservation book…
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-ink/10">
          <p className="text-sm text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={load}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={bookings.length === 0 ? "No reservations yet" : "No stays match"}
          description={
            bookings.length === 0
              ? "Create the first reservation and the house will start filling up."
              : "Try another status, or search by guest, room or reference."
          }
          action={
            bookings.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New reservation
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03]">
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-parchment/30 text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Reference</th>
                  <th className="px-4 py-3.5 font-semibold">Guest</th>
                  <th className="px-4 py-3.5 font-semibold">Room</th>
                  <th className="px-4 py-3.5 font-semibold">Stay</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Total</th>
                  <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="text-sm transition hover:bg-parchment/20">
                    <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                      <p className="font-mono text-[11px] tracking-wide text-ink/60">
                        {booking.reference}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink/30">
                        {formatDate(booking.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={booking.guestName} size="sm" />
                        <div>
                          <p className="font-medium text-ink">{booking.guestName}</p>
                          <p className="text-[11px] text-ink/40">
                            {booking.guestEmail || booking.guestPhone || "No contact details"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="font-medium text-ink">Room {booking.roomNumber}</p>
                      <p className="text-[11px] text-ink/40">{typeLabel(booking.roomType)}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="text-ink/70">
                        {formatDateRange(booking.checkIn, booking.checkOut)}
                      </p>
                      <p className="text-[11px] text-ink/40">
                        {booking.nights} night{booking.nights === 1 ? "" : "s"} ·{" "}
                        {booking.guestsCount} guest{booking.guestsCount === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-ink">
                      {money(booking.totalAmount)}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center justify-end gap-1">
                        {renderActions(booking)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-ink/[0.06] xl:hidden">
            {filtered.map((booking) => (
              <div key={booking.id} className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-wide text-ink/45">
                    {booking.reference}
                  </span>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={booking.guestName} size="sm" />
                    <div>
                      <p className="text-[13px] font-medium text-ink">{booking.guestName}</p>
                      <p className="text-[11px] text-ink/40">
                        Room {booking.roomNumber} · {typeLabel(booking.roomType)}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-sm font-medium text-ink">
                    {money(booking.totalAmount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-ink/40">
                  <span>{formatDateRange(booking.checkIn, booking.checkOut)}</span>
                  <span>
                    {booking.nights} night{booking.nights === 1 ? "" : "s"} ·{" "}
                    {booking.guestsCount} guest{booking.guestsCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-end gap-1">
                  {renderActions(booking)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookingForm
        open={formOpen}
        booking={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Reservation ${detail.reference}` : "Reservation"}
        subtitle={detail ? `Booked ${formatDate(detail.createdAt)}` : undefined}
        wide
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={detail.guestName} size="lg" />
                <div>
                  <p className="font-display text-xl text-ink">{detail.guestName}</p>
                  <p className="text-[12px] text-ink/45">
                    {detail.guestEmail || "No email"} · {detail.guestPhone || "No phone"}
                  </p>
                </div>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/35">
                  Stay
                </p>
                <p className="mt-1.5 font-display text-lg text-ink">
                  {formatDateRange(detail.checkIn, detail.checkOut)}
                </p>
                <p className="mt-1 text-[12px] text-ink/45">
                  {detail.nights} night{detail.nights === 1 ? "" : "s"} ·{" "}
                  {detail.guestsCount} guest{detail.guestsCount === 1 ? "" : "s"}
                </p>
                <p className="mt-3 text-[11px] text-ink/40">
                  Check-in from 3:00 PM · Check-out by 11:00 AM
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/35">
                  Room & total
                </p>
                <p className="mt-1.5 font-display text-lg text-ink">
                  Room {detail.roomNumber}
                </p>
                <p className="mt-1 text-[12px] text-ink/45">{typeLabel(detail.roomType)}</p>
                <p className="mt-3 font-display text-xl text-gold">
                  {money(detail.totalAmount)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/35">
                Notes
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">
                {detail.notes || "No special requests noted for this stay."}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-4">
              {detail.status === "Confirmed" && (
                <>
                  <Button variant="secondary" onClick={() => openEdit(detail)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCancelTarget(detail)}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    <Ban className="h-4 w-4" />
                    Cancel
                  </Button>
                  {canCheckIn(detail) && (
                    <Button
                      loading={busyId === detail.id}
                      onClick={() => updateStatus(detail, "CheckedIn")}
                    >
                      <LogIn className="h-4 w-4" />
                      Check in
                    </Button>
                  )}
                </>
              )}
              {detail.status === "CheckedIn" && (
                <Button
                  loading={busyId === detail.id}
                  onClick={() => updateStatus(detail, "CheckedOut")}
                >
                  <LogOut className="h-4 w-4" />
                  Check out
                </Button>
              )}
              {detail.status === "CheckedOut" && (
                <p className="flex items-center gap-2 text-[12px] text-ink/40">
                  <Users className="h-4 w-4" />
                  This stay is complete.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={`Cancel ${cancelTarget?.reference ?? "reservation"}?`}
        message={
          cancelTarget
            ? `${cancelTarget.guestName}'s stay in room ${cancelTarget.roomNumber} will be released. This cannot be undone.`
            : ""
        }
        confirmLabel="Cancel reservation"
        loading={cancelLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            setCancelLoading(true);
            updateStatus(cancelTarget, "Cancelled");
          }
        }}
      />
    </div>
  );
}
