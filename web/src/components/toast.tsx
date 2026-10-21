"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastKind, { icon: ReactNode; ring: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    ring: "ring-emerald-200",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-rose-600" />,
    ring: "ring-rose-200",
  },
  info: {
    icon: <Info className="h-5 w-5 text-gold" />,
    ring: "ring-gold-soft",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-ink/10 ring-1 animate-toast",
              styles[item.kind].ring,
            )}
          >
            <span className="mt-0.5 shrink-0">{styles[item.kind].icon}</span>
            <p className="flex-1 text-sm leading-relaxed text-ink">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-full p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
