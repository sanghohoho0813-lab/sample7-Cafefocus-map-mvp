"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * 화면 아래쪽에 깔린 고정 바(탭 바·저장 버튼 바·비교 바 등, data-bottom-bar)를 재서
 * 그 위에 알림을 띄운다. 공용 뒤로·앞으로 버튼이 있으면 그 자리도 비켜 간다.
 */
function bottomOffset(): number {
  const vh = window.innerHeight;
  let covered = 0;
  for (const el of document.querySelectorAll<HTMLElement>("[data-bottom-bar]")) {
    const r = el.getBoundingClientRect();
    if (!r.height || getComputedStyle(el).display === "none") continue;
    if (r.bottom >= vh - 2) covered = Math.max(covered, vh - r.top);
  }
  const pill = document.querySelector("[data-mirae-history-nav]") ? 52 : 0;
  return covered + 12 + (window.innerWidth < 1024 ? pill : 0);
}

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  const [bottom, setBottom] = useState(80);

  useLayoutEffect(() => {
    if (toasts.length) setBottom(bottomOffset());
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
      style={{ bottom }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-coffee-900/95 py-2.5 pl-4 pr-2 text-meta font-medium text-cream-50 shadow-card-lg animate-toast-in"
        >
          <span>{t.message}</span>
          {t.action?.href && (
            <Link
              href={t.action.href}
              onClick={() => dismissToast(t.id)}
              className="whitespace-nowrap rounded-lg px-2 py-1 font-semibold text-amber2-400 underline-offset-4 hover:underline"
            >
              {t.action.label}
            </Link>
          )}
          {t.action?.onClick && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick?.();
                dismissToast(t.id);
              }}
              className="whitespace-nowrap rounded-lg px-2 py-1 font-semibold text-amber2-400 underline-offset-4 hover:underline"
            >
              {t.action.label}
            </button>
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
