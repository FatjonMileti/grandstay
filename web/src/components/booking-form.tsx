"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { api, ApiError, nightsBetween, toDateInput } from "@/lib/api";
import { addDaysInput, formatDate, money, todayInput, typeLabel } from "@/lib/format";
import type { Booking, Guest, Room } from "@/lib/types";

export function BookingForm({
  open,
  booking,
  onClose,
  onSaved,
}: {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guestId, setGuestId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState(todayInput());
  const [checkOut, setCheckOut] = useState(addDaysInput(todayInput(), 1));
  const [guestsCount, setGuestsCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setError("");
    setCheckIn(booking ? toDateInput(booking.checkIn) : todayInput());
    setCheckOut(booking ? toDateInput(booking.checkOut) : addDaysInput(todayInput(), 1));
    setGuestId(booking?.guestId ?? "");
    setRoomId(booking?.roomId ?? "");
    setGuestsCount(String(booking?.guestsCount ?? 1));
    setNotes(booking?.notes ?? "");
    setRooms([]);
    setLoadingGuests(true);

    api<Guest[]>("/guests")
      .then((data) => {
        if (cancelled) return;
        setGuests(data);
        if (!booking && data.length > 0) {
          setGuestId((current) => current || data[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load guests.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGuests(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, booking]);

  useEffect(() => {
    if (!open) return;
    if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) <= 0) {
      setRooms([]);
      return;
    }

    let cancelled = false;
    setError("");
    setLoadingRooms(true);

    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guestsCount,
    });
    if (booking) query.set("excludeBookingId", booking.id);

    api<Room[]>(`/bookings/availability?${query.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setRooms(data);
        setRoomId((current) =>
          current && data.some((room) => room.id === current) ? current : "",
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setRooms([]);
          setError(err instanceof ApiError ? err.message : "Could not check availability.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, checkIn, checkOut, guestsCount, booking]);

  const nights = nightsBetween(checkIn, checkOut);
  const selectedRoom = rooms.find((room) => room.id === roomId) ?? null;
  const total = selectedRoom ? selectedRoom.pricePerNight * nights : 0;

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (nightsBetween(value, checkOut) <= 0) {
      setCheckOut(addDaysInput(value, 1));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!guestId) {
      setError("Choose a guest for this reservation.");
      return;
    }
    if (!roomId) {
      setError("Select an available room.");
      return;
    }
    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      return;
    }

    setSaving(true);
    const payload = {
      guestId,
      roomId,
      checkIn,
      checkOut,
      guestsCount: Number(guestsCount),
      notes,
    };

    try {
      if (booking) {
        await api(`/bookings/${booking.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        onSaved("Reservation updated.");
      } else {
        await api("/bookings", { method: "POST", body: JSON.stringify(payload) });
        onSaved("Reservation created.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the reservation.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={booking ? "Edit reservation" : "New reservation"}
      subtitle={
        booking
          ? `Booking ${booking.reference} · adjust the stay details below.`
          : "Reserve a room and welcome a guest to GrandStay."
      }
      wide
    >
      <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-[1fr_248px]">
        <div className="space-y-4">
          <Field
            label="Guest"
            hint={loadingGuests ? "Loading…" : `${guests.length} in the guest book`}
            htmlFor="booking-guest"
          >
            <Select
              id="booking-guest"
              value={guestId}
              onChange={(event) => setGuestId(event.target.value)}
              required
              disabled={loadingGuests}
            >
              <option value="">Choose a guest…</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.firstName} {guest.lastName}
                  {guest.email ? ` — ${guest.email}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          {!loadingGuests && guests.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800 ring-1 ring-inset ring-amber-200">
              There are no guests yet.{" "}
              <Link href="/guests" className="font-semibold underline underline-offset-2">
                Add a guest
              </Link>{" "}
              before creating a reservation.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in" htmlFor="booking-checkin">
              <Input
                id="booking-checkin"
                type="date"
                value={checkIn}
                min={todayInput()}
                onChange={(event) => changeCheckIn(event.target.value)}
                required
              />
            </Field>
            <Field label="Check-out" htmlFor="booking-checkout">
              <Input
                id="booking-checkout"
                type="date"
                value={checkOut}
                min={addDaysInput(checkIn || todayInput(), 1)}
                onChange={(event) => setCheckOut(event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of guests" htmlFor="booking-guests">
              <Input
                id="booking-guests"
                type="number"
                min={1}
                max={20}
                value={guestsCount}
                onChange={(event) => setGuestsCount(event.target.value)}
                required
              />
            </Field>
            <Field
              label="Room"
              hint={loadingRooms ? "Checking…" : `${rooms.length} available`}
              htmlFor="booking-room"
            >
              <div className="relative">
                <Select
                  id="booking-room"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  disabled={loadingRooms}
                  required
                >
                  <option value="">
                    {loadingRooms ? "Checking availability…" : "Choose a room…"}
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} · {room.type} · {money(room.pricePerNight)}
                    </option>
                  ))}
                </Select>
                {loadingRooms && (
                  <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                )}
              </div>
            </Field>
          </div>

          {!loadingRooms && rooms.length === 0 && nights > 0 && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700 ring-1 ring-inset ring-rose-200">
              No rooms are available for those dates. Try different dates or fewer guests.
            </p>
          )}

          <Field label="Notes" hint="Optional" htmlFor="booking-notes">
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Late arrival, celebration, special requests…"
              maxLength={500}
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700 ring-1 ring-inset ring-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={loadingRooms}>
              {booking ? "Save changes" : "Create reservation"}
            </Button>
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-forest p-5 text-cream">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            Stay summary
          </p>

          {selectedRoom ? (
            <>
              <p className="mt-3 font-display text-2xl leading-tight">
                Room {selectedRoom.number}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-cream/45">
                {typeLabel(selectedRoom.type)} · sleeps {selectedRoom.capacity}
              </p>

              <div className="mt-5 space-y-2.5 border-t border-cream/10 pt-4 text-[12px]">
                <div className="flex justify-between gap-2">
                  <span className="text-cream/45">Check-in</span>
                  <span>{formatDate(`${checkIn}T00:00:00Z`)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-cream/45">Check-out</span>
                  <span>{formatDate(`${checkOut}T00:00:00Z`)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-cream/45">Nights</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-cream/45">Rate</span>
                  <span>{money(selectedRoom.pricePerNight)} / night</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-cream/45">Guests</span>
                  <span>{guestsCount}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-cream/10 pt-4">
                <div className="flex items-end justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-cream/45">
                    Total
                  </span>
                  <span className="font-display text-2xl text-gold-soft">{money(total)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-cream/15 px-4 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-gold-soft">
                <UserRound className="h-5 w-5" />
              </span>
              <p className="text-[12px] leading-relaxed text-cream/45">
                Choose dates and a room to see the rate and stay total.
              </p>
            </div>
          )}
        </aside>
      </form>
    </Modal>
  );
}
