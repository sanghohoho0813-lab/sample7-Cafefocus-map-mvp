"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-coffee-800/95 py-2.5 pl-5 pr-3 text-[17px] font-medium text-cream-100 shadow-card-lg backdrop-blur animate-toast-in"
        >
          <span>{t.message}</span>
          {t.action && (
            <Link
              href={t.action.href}
              onClick={() => dismissToast(t.id)}
              className="rounded-full bg-forest-500 px-3 py-1 text-[15.5px] font-semibold text-white transition-colors hover:bg-forest-600"
            >
              {t.action.label}
            </Link>
          )}
          <button
            onClick={() => dismissToast(t.id)}
            className="rounded-full p-1 text-cream-200/70 transition-colors hover:text-cream-50"
            aria-label="닫기"
          >
            <X size={17.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
