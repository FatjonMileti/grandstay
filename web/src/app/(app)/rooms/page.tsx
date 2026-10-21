"use client";

import {
  BedDouble,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { ROOM_STATUSES, ROOM_TYPES, type Room, type RoomStatus, type RoomType } from "@/lib/types";

interface RoomForm {
  number: string;
  type: RoomType;
  floor: string;
  capacity: string;
  pricePerNight: string;
  status: RoomStatus;
  amenities: string;
  description: string;
}

const emptyForm: RoomForm = {
  number: "",
  type: "Double",
  floor: "1",
  capacity: "2",
  pricePerNight: "129",
  status: "Available",
  amenities: "Free Wi-Fi, Smart TV",
  description: "",
};

export default function RoomsPage() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RoomStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | RoomType>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<Room[]>("/rooms");
      setRooms(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesStatus = statusFilter === "All" || room.status === statusFilter;
      const matchesType = typeFilter === "All" || room.type === typeFilter;
      const matchesSearch =
        !term ||
        room.number.toLowerCase().includes(term) ||
        room.type.toLowerCase().includes(term) ||
        room.description.toLowerCase().includes(term);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [rooms, search, statusFilter, typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm({
      number: room.number,
      type: room.type,
      floor: String(room.floor),
      capacity: String(room.capacity),
      pricePerNight: String(room.pricePerNight),
      status: room.status,
      amenities: room.amenities.join(", "),
      description: room.description,
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      number: form.number.trim(),
      type: form.type,
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      pricePerNight: Number(form.pricePerNight),
      status: form.status,
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: form.description.trim(),
    };

    try {
      if (editing) {
        await api(`/rooms/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast(`Room ${payload.number} updated.`);
      } else {
        await api("/rooms", { method: "POST", body: JSON.stringify(payload) });
        toast(`Room ${payload.number} added to the house.`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save the room.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/rooms/${deleting.id}`, { method: "DELETE" });
      toast(`Room ${deleting.number} removed.`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete the room.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function updateStatus(room: Room, status: RoomStatus) {
    setBusyId(room.id);
    try {
      await api(`/rooms/${room.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(`Room ${room.number} marked ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update the room.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const filters: ("All" | RoomStatus)[] = ["All", ...ROOM_STATUSES];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The house"
        title="Rooms & suites"
        description="Every key in the building, with rates, amenities and live housekeeping status."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add room
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/[0.06] lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by room number or view…"
            className="border-transparent bg-transparent pl-10 shadow-none focus:border-gold"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={
                statusFilter === filter
                  ? "rounded-full bg-forest px-3.5 py-1.5 text-[12px] font-medium text-cream"
                  : "rounded-full px-3.5 py-1.5 text-[12px] font-medium text-ink/50 transition hover:bg-parchment/60 hover:text-ink"
              }
            >
              {filter}
            </button>
          ))}
        </div>
        <Select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "All" | RoomType)}
          className="w-full border-ink/10 lg:w-40"
          aria-label="Filter by room type"
        >
          <option value="All">All types</option>
          {ROOM_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh rooms">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/40">
          <Spinner className="h-5 w-5" /> Counting the keys…
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
          icon={<BedDouble className="h-5 w-5" />}
          title="No rooms found"
          description={
            rooms.length === 0
              ? "Add your first room to start taking reservations."
              : "Nothing matches those filters. Try a different status or search."
          }
          action={
            rooms.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add the first room
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setTypeFilter("All");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-[12px] text-ink/40">
            Showing {filtered.length} of {rooms.length} rooms
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((room) => (
              <article
                key={room.id}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03] transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-ink/[0.06]"
              >
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/35">
                        Floor {room.floor}
                      </p>
                      <h3 className="mt-1 font-display text-[26px] leading-none text-ink">
                        Room {room.number}
                      </h3>
                      <p className="mt-1.5 text-[12px] text-ink/45">{room.type}</p>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>

                  <div className="mt-4 flex items-end justify-between border-b border-ink/[0.06] pb-4">
                    <p className="flex items-center gap-1.5 text-[12px] text-ink/45">
                      <Users className="h-3.5 w-3.5" />
                      Sleeps {room.capacity}
                    </p>
                    <p className="font-display text-xl text-ink">
                      {money(room.pricePerNight)}
                      <span className="ml-1 font-sans text-[10px] uppercase tracking-[0.12em] text-ink/35">
                        / night
                      </span>
                    </p>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-ink/45">
                    {room.description || "No description yet."}
                  </p>

                  {room.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-parchment/60 px-2 py-0.5 text-[10px] text-ink/50"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="rounded-full px-1 py-0.5 text-[10px] text-ink/35">
                          +{room.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-ink/[0.06] bg-parchment/20 px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                      Status
                    </span>
                    <select
                      value={room.status}
                      disabled={busyId === room.id}
                      onChange={(event) => updateStatus(room, event.target.value as RoomStatus)}
                      className="cursor-pointer rounded-lg border-0 bg-transparent py-1 pl-0 pr-6 text-[12px] font-medium text-ink/70 outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-50"
                      aria-label={`Status for room ${room.number}`}
                    >
                      {ROOM_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(room)}
                      aria-label={`Edit room ${room.number}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(room)}
                      aria-label={`Delete room ${room.number}`}
                      className="hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit room ${editing.number}` : "Add a room"}
        subtitle={
          editing
            ? "Update the details guests see when they book."
            : "Introduce a new room to the house."
        }
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Room number" htmlFor="room-number">
              <Input
                id="room-number"
                value={form.number}
                onChange={(event) => setForm({ ...form, number: event.target.value })}
                placeholder="e.g. 207"
                required
                maxLength={10}
              />
            </Field>
            <Field label="Room type" htmlFor="room-type">
              <Select
                id="room-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as RoomType })}
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Floor" htmlFor="room-floor">
              <Input
                id="room-floor"
                type="number"
                min={0}
                max={200}
                value={form.floor}
                onChange={(event) => setForm({ ...form, floor: event.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sleeps" htmlFor="room-capacity">
              <Input
                id="room-capacity"
                type="number"
                min={1}
                max={20}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                required
              />
            </Field>
            <Field label="Rate per night (USD)" htmlFor="room-price">
              <Input
                id="room-price"
                type="number"
                min={0}
                step="1"
                value={form.pricePerNight}
                onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })}
                required
              />
            </Field>
            <Field label="Housekeeping status" htmlFor="room-status">
              <Select
                id="room-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as RoomStatus })}
              >
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Amenities"
            hint="Separate with commas"
            htmlFor="room-amenities"
          >
            <Input
              id="room-amenities"
              value={form.amenities}
              onChange={(event) => setForm({ ...form, amenities: event.target.value })}
              placeholder="Free Wi-Fi, Balcony, Minibar"
            />
          </Field>

          <Field label="Description" htmlFor="room-description">
            <Textarea
              id="room-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="A few words about the room's character…"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add room"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete room ${deleting?.number ?? ""}?`}
        message="This removes the room from the house. Rooms with active bookings cannot be deleted."
        confirmLabel="Delete room"
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
