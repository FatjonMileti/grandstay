"use client";

import { Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Textarea,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Guest } from "@/lib/types";

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  idNumber: string;
  notes: string;
}

const emptyForm: GuestForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  idNumber: "",
  notes: "",
};

export default function GuestsPage() {
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Guest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<Guest[]>("/guests");
      setGuests(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load guests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return guests;
    return guests.filter((guest) => {
      const haystack = [
        guest.firstName,
        guest.lastName,
        guest.email,
        guest.phone,
        guest.country,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [guests, search]);

  const returning = guests.filter((guest) => guest.bookingCount >= 2).length;
  const countries = new Set(guests.map((guest) => guest.country).filter(Boolean)).size;

  const renderActions = (guest: Guest) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openEdit(guest)}
        aria-label={`Edit ${guest.firstName} ${guest.lastName}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleting(guest)}
        className="hover:bg-rose-50 hover:text-rose-600"
        aria-label={`Delete ${guest.firstName} ${guest.lastName}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </>
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditing(guest);
    setForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      country: guest.country,
      idNumber: guest.idNumber,
      notes: guest.notes,
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      idNumber: form.idNumber.trim(),
      notes: form.notes.trim(),
    };

    try {
      if (editing) {
        await api(`/guests/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast(`${payload.firstName} ${payload.lastName}'s profile updated.`);
      } else {
        await api("/guests", { method: "POST", body: JSON.stringify(payload) });
        toast(`${payload.firstName} ${payload.lastName} added to the guest book.`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save the guest.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/guests/${deleting.id}`, { method: "DELETE" });
      toast(`${deleting.firstName} ${deleting.lastName} removed.`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete the guest.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guest book"
        title="Guests"
        description="The people behind every reservation — contact details, history and the little notes that make a stay personal."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add guest
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-ink/40">
          <span className="font-medium text-ink/60">{guests.length}</span> guests ·{" "}
          <span className="font-medium text-ink/60">{returning}</span> returning ·{" "}
          <span className="font-medium text-ink/60">{countries}</span> countries
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guests…"
              className="pl-10"
            />
          </div>
          <Button variant="secondary" size="icon" onClick={load} aria-label="Refresh guests">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/40">
          <Spinner className="h-5 w-5" /> Opening the guest book…
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
          icon={<Users className="h-5 w-5" />}
          title={guests.length === 0 ? "The guest book is empty" : "No guests match"}
          description={
            guests.length === 0
              ? "Add your first guest to begin creating reservations."
              : "Try a different name, email or country."
          }
          action={
            guests.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add the first guest
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] shadow-sm shadow-ink/[0.03]">
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-parchment/30 text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Guest</th>
                  <th className="px-4 py-3.5 font-semibold">Phone</th>
                  <th className="px-4 py-3.5 font-semibold">Country</th>
                  <th className="px-4 py-3.5 font-semibold">Stays</th>
                  <th className="px-4 py-3.5 font-semibold">Joined</th>
                  <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((guest) => (
                  <tr key={guest.id} className="text-sm transition hover:bg-parchment/20">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${guest.firstName} ${guest.lastName}`} />
                        <div>
                          <p className="font-medium text-ink">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <p className="text-[11px] text-ink/40">
                            {guest.email || "No email on file"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-ink/55">
                      {guest.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-ink/55">
                      {guest.country || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-parchment/70 px-2 py-1 text-[11px] font-semibold text-ink/60">
                        {guest.bookingCount}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[12px] text-ink/45">
                      {formatDate(guest.createdAt)}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center justify-end gap-1">
                        {renderActions(guest)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-ink/[0.06] xl:hidden">
            {filtered.map((guest) => (
              <div key={guest.id} className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={`${guest.firstName} ${guest.lastName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="truncate text-[11px] text-ink/40">
                      {guest.email || "No email on file"}
                    </p>
                  </div>
                  <span className="rounded-full bg-parchment/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
                    {guest.bookingCount} stay{guest.bookingCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-parchment/25 px-3 py-2.5 text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-ink/30">Phone</p>
                    <p className="mt-0.5 text-ink/60">{guest.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-ink/30">Country</p>
                    <p className="mt-0.5 text-ink/60">{guest.country || "—"}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-ink/35">Joined {formatDate(guest.createdAt)}</p>
                  <div className="flex items-center gap-1">{renderActions(guest)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit guest profile" : "Add a guest"}
        subtitle={
          editing
            ? "Keep contact details and preferences up to date."
            : "A few details now make every future stay smoother."
        }
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="guest-first">
              <Input
                id="guest-first"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                placeholder="Elena"
                required
                maxLength={80}
              />
            </Field>
            <Field label="Last name" htmlFor="guest-last">
              <Input
                id="guest-last"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                placeholder="Rossi"
                required
                maxLength={80}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="guest-email">
              <Input
                id="guest-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="elena@example.com"
                maxLength={160}
              />
            </Field>
            <Field label="Phone" htmlFor="guest-phone">
              <Input
                id="guest-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+39 340 555 0182"
                maxLength={40}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" htmlFor="guest-country">
              <Input
                id="guest-country"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                placeholder="Italy"
                maxLength={80}
              />
            </Field>
            <Field label="ID / passport number" htmlFor="guest-id">
              <Input
                id="guest-id"
                value={form.idNumber}
                onChange={(event) => setForm({ ...form, idNumber: event.target.value })}
                placeholder="IT-YA1234567"
                maxLength={60}
              />
            </Field>
          </div>

          <Field label="Notes & preferences" htmlFor="guest-notes">
            <Textarea
              id="guest-notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Allergies, preferences, special occasions…"
              maxLength={500}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add guest"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Remove ${deleting?.firstName ?? ""} ${deleting?.lastName ?? ""}?`}
        message="Guests with booking history cannot be removed. This keeps your reservation records intact."
        confirmLabel="Remove guest"
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
