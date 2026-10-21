"use client";

import {
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { User } from "@/lib/types";
import { Avatar } from "./ui";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/bookings", label: "Reservations", icon: CalendarDays },
  { href: "/rooms", label: "Rooms & suites", icon: BedDouble },
  { href: "/guests", label: "Guests", icon: Users },
];

export function Sidebar({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-forest text-cream transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 pb-6 pt-7">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 font-display text-xl text-gold">
              G
            </span>
            <div>
              <p className="font-display text-xl leading-none tracking-wide">GrandStay</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.34em] text-cream/40">
                Hotel &amp; Suites
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-cream/50 transition hover:bg-cream/10 hover:text-cream lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-6 h-px bg-cream/10" />

        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cream/35">
            Workspace
          </p>
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-cream/[0.09] font-medium text-cream"
                    : "text-cream/55 hover:bg-cream/[0.05] hover:text-cream/90",
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition",
                    active ? "text-gold" : "text-cream/40 group-hover:text-cream/70",
                  )}
                />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cream/35">
              Front desk
            </p>
            <div className="mx-1 rounded-2xl border border-cream/10 bg-cream/[0.04] p-4">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Property status
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/60">
                All departments are online. Wishing you a calm, full house.
              </p>
            </div>
          </div>
        </nav>

        <div className="border-t border-cream/10 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar name={user?.name ?? "GrandStay Staff"} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">{user?.name ?? "Staff"}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.12em] text-cream/40">
                {user?.role ?? "Receptionist"}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full p-2 text-cream/40 transition hover:bg-cream/10 hover:text-cream"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
