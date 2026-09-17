"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    ({ title, description, type = "success", duration = 3500 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";
          const isInfo = t.type === "info";

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-200 transition-all",
                isSuccess && "bg-[#0D0D0D]/95 border-emerald-500/40 text-emerald-200",
                isError && "bg-[#0D0D0D]/95 border-rose-500/40 text-rose-200",
                isWarning && "bg-[#0D0D0D]/95 border-neutral-400/40 text-neutral-200",
                isInfo && "bg-[#0D0D0D]/95 border-white/20 text-neutral-100"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {isError && <AlertCircle className="h-5 w-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="h-5 w-5 text-neutral-300" />}
                {isInfo && <Info className="h-5 w-5 text-neutral-300" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <h4 className="text-xs font-bold leading-tight">{t.title}</h4>
                {t.description && (
                  <p className="text-[11px] opacity-90 leading-relaxed text-neutral-400">{t.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity text-neutral-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
