"use client";

import { Bell, Menu } from "lucide-react";
import type { User } from "@/lib/types";
import { Avatar } from "./ui";

export function Topbar({
  onMenu,
  title,
  user,
}: {
  onMenu: () => void;
  title: string;
  user: User | null;
}) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-full p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              GrandStay
            </p>
            <h2 className="font-display text-lg leading-tight text-ink">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <p className="hidden text-[13px] text-ink/45 md:block">{today}</p>
          <div className="hidden h-6 w-px bg-ink/10 md:block" />
          <button
            type="button"
            className="relative rounded-full p-2 text-ink/50 transition hover:bg-ink/5 hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold ring-2 ring-cream" />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name ?? "GrandStay Staff"} size="sm" />
            <div className="hidden sm:block">
              <p className="text-[13px] font-medium leading-tight text-ink">
                {user?.name ?? "Staff"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-ink/40">
                {user?.role ?? "Receptionist"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
