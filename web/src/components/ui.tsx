"use client";

import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  bookingStatusLabel,
  bookingStatusStyles,
  initials,
  roomStatusStyles,
} from "@/lib/format";
import type { BookingStatus, RoomStatus } from "@/lib/types";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-cream hover:bg-forest-light shadow-sm shadow-forest/20",
  secondary: "bg-white text-ink ring-1 ring-inset ring-ink/10 hover:bg-parchment/50",
  ghost: "text-ink/65 hover:bg-ink/5 hover:text-ink",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
  gold: "bg-gold text-white hover:bg-[#9a7842] shadow-sm shadow-gold/25",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 gap-0",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
        buttonVariants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between text-[13px] font-medium text-ink/75"
      >
        <span>{label}</span>
        {hint && <span className="text-[11px] font-normal text-ink/40">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const controlClasses =
  "w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm shadow-ink/[0.02] outline-none transition placeholder:text-ink/30 focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:bg-parchment/40";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "min-h-24 resize-y", className)} {...props} />;
}

export function Badge({
  children,
  className,
  dot = false,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: RoomStatus | BookingStatus }) {
  const style =
    roomStatusStyles[status as RoomStatus] ??
    bookingStatusStyles[status as BookingStatus] ??
    "bg-slate-100 text-slate-600 ring-slate-200";
  const label = bookingStatusLabel[status as BookingStatus] ?? status;
  return (
    <Badge className={style} dot>
      {label}
    </Badge>
  );
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const palettes = [
    "bg-forest text-cream",
    "bg-gold text-white",
    "bg-[#425c4d] text-cream",
    "bg-[#7c5a3c] text-cream",
    "bg-[#3f5566] text-cream",
  ];
  const index = name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const palette = palettes[index % palettes.length];
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
        palette,
        sizes[size],
        className,
      )}
    >
      {initials(name) || "GS"}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream shadow-2xl shadow-ink/20 animate-rise sm:rounded-[28px]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-ink/10 px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
              GrandStay
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-ink/50">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-relaxed text-ink/60">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Keep it
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 font-display text-[32px] leading-tight text-ink sm:text-[38px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink/50">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-parchment text-gold">
        {icon}
      </div>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink/50">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-gold", className)} />;
}
