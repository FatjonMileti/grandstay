"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Spinner } from "@/components/ui";
import { clearSession, getToken, getUser } from "@/lib/api";
import type { User } from "@/lib/types";

const titles: Record<string, string> = {
  "/": "Overview",
  "/bookings": "Reservations",
  "/rooms": "Rooms & suites",
  "/guests": "Guests",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
    setReady(true);
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-forest font-display text-2xl text-gold">
          G
        </span>
        <div className="flex items-center gap-2 text-sm text-ink/40">
          <Spinner className="h-4 w-4" />
          Preparing the front desk…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream lg:pl-[264px]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      <Topbar
        onMenu={() => setSidebarOpen(true)}
        title={titles[pathname] ?? "GrandStay"}
        user={user}
      />
      <main className="mx-auto w-full max-w-[1480px] px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
