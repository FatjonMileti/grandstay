"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { api, ApiError, getToken, saveSession } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";

const demoAccounts = [
  { role: "General manager", email: "admin@grandstay.com", password: "admin123" },
  { role: "Hotel manager", email: "manager@grandstay.com", password: "manager123" },
  { role: "Front desk", email: "frontdesk@grandstay.com", password: "frontdesk123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@grandstay.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token, data.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-forest px-12 py-10 text-cream lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #d8c39a 0, transparent 34%), radial-gradient(circle at 82% 68%, #7f9b89 0, transparent 40%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 47px, #f7f4ed 47px 48px)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 font-display text-xl text-gold">
            G
          </span>
          <div>
            <p className="font-display text-xl leading-none tracking-wide">GrandStay</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.34em] text-cream/45">
              Hotel &amp; Suites
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
            The art of hospitality
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.08] text-cream xl:text-6xl">
            Every stay,
            <br />
            <span className="italic text-gold-soft">remembered.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/55">
            One calm place for your rooms, guests and reservations — from the first
            enquiry to the final farewell.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-cream/10 pt-6">
            {[
              { value: "16", label: "Rooms & suites" },
              { value: "4.9", label: "Guest rating" },
              { value: "24/7", label: "Front desk" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-2xl text-gold-soft">{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-cream/40">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cream/35">
          <ShieldCheck className="h-4 w-4 text-gold/70" />
          Private staff workspace
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest font-display text-lg text-gold">
              G
            </span>
            <div>
              <p className="font-display text-lg leading-none">GrandStay</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-ink/40">
                Hotel &amp; Suites
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-gold-soft/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Front desk access
          </div>

          <h2 className="mt-5 font-display text-4xl text-ink">Welcome back</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/50">
            Sign in to manage today&apos;s arrivals, rooms and reservations.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Email address" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/35 transition hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700 ring-1 ring-inset ring-rose-200">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="h-12 w-full text-[15px]">
              Sign in to GrandStay
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-white/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Demo accounts
            </p>
            <div className="mt-2.5 space-y-1">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-ink/55 transition hover:bg-parchment/60 hover:text-ink"
                >
                  <span>{account.role}</span>
                  <span className="font-mono text-[11px] text-ink/40">{account.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] text-ink/35">
            GrandStay Hotel &amp; Suites · Internal management system
          </p>
        </div>
      </section>
    </div>
  );
}
