"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";

/** raised: 하단 고정 CTA가 있는 화면에서 CTA 위로 띄운다 */
export default function Toasts({ raised = false }: { raised?: boolean }) {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8 ${
        raised ? "bottom-28" : "bottom-20"
      }`}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-coffee-900/95 py-2.5 pl-4 pr-2 text-meta font-medium text-cream-50 shadow-card-lg animate-toast-in"
        >
          <span>{t.message}</span>
          {t.action && (
            <Link
              href={t.action.href}
              onClick={() => dismissToast(t.id)}
              className="whitespace-nowrap rounded-lg px-2 py-1 font-semibold text-amber2-400 underline-offset-4 hover:underline"
            >
              {t.action.label}
            </Link>
          )}
          <button
            onClick={() => dismissToast(t.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cream-100/70 transition-colors hover:text-white"
            aria-label="알림 닫기"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
