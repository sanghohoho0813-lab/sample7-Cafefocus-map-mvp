"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  LayoutList,
  Heart,
  Scale,
  Sparkles,
  User,
  Map as MapIcon,
} from "lucide-react";
import Logo from "@/components/Logo";
import Toasts from "@/components/Toasts";
import { useApp } from "@/lib/store";

const NAV = [
  { href: "/", label: "지도", icon: MapPin },
  { href: "/cafes", label: "카페 리스트", icon: LayoutList },
  { href: "/favorites", label: "즐겨찾기", icon: Heart },
  { href: "/compare", label: "카페 비교", icon: Scale },
  { href: "/recommend", label: "맞춤 추천", icon: Sparkles },
  { href: "/my", label: "마이페이지", icon: User },
];

/** 메뉴별 아이콘 컬러 — 어두운 사이드바에서 또렷하게 보이는 밝은 톤 */
const NAV_ICON_COLOR: Record<string, string> = {
  "/": "text-sky-300",
  "/cafes": "text-amber-300",
  "/favorites": "text-rose-300",
  "/compare": "text-violet-300",
  "/recommend": "text-emerald-300",
  "/my": "text-teal-300",
};
const NAV_ICON_ACTIVE: Record<string, string> = {
  "/": "text-sky-200",
  "/cafes": "text-amber-200",
  "/favorites": "text-rose-200",
  "/compare": "text-violet-200",
  "/recommend": "text-emerald-200",
  "/my": "text-teal-200",
};

/** 모바일 하단 탭 아이콘 컬러 (밝은 배경) */
const MOBILE_ICON_COLOR: Record<string, string> = {
  "/": "text-sky-500",
  "/cafes": "text-amber-500",
  "/favorites": "text-rose-500",
  "/my": "text-teal-500",
};

const WEEK_BARS = [42, 68, 55, 90, 74, 30, 22];
const WEEK_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const MOBILE_NAV = [
  { href: "/", label: "지도", icon: MapIcon },
  { href: "/cafes", label: "리스트", icon: LayoutList },
  { href: "/recommend", label: "추천", icon: Sparkles, emphasized: true },
  { href: "/favorites", label: "저장", icon: Heart },
  { href: "/my", label: "마이", icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { favorites, compare, hydrated } = useApp();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-coffee-800 lg:flex">
        <div className="px-5 pb-6 pt-6">
          <Link href="/" aria-label="CafeFocus 홈">
            <Logo />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const badge =
              hydrated && href === "/favorites" && favorites.length > 0
                ? favorites.length
                : hydrated && href === "/compare" && compare.length > 0
                  ? compare.length
                  : null;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[17.5px] font-semibold transition-colors duration-200 ${
                  active
                    ? "bg-coffee-600 text-white shadow-marker"
                    : "text-cream-50/90 hover:bg-coffee-700 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={2.2}
                  className={active ? NAV_ICON_ACTIVE[href] : NAV_ICON_COLOR[href]}
                />
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span className="rounded-full bg-forest-500 px-1.5 py-0.5 text-[13px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* 이번 주 집중 시간 위젯 */}
        <div className="mx-4 mb-5 rounded-2xl bg-coffee-700/70 p-4">
          <div className="text-[14.5px] font-medium text-cream-100/90">
            이번 주 집중 시간
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">24.5</span>
            <span className="text-sm font-medium text-cream-100/90">h</span>
          </div>
          <div className="mt-0.5 text-[13.5px] font-semibold text-emerald-300">
            지난 주 대비 +12%
          </div>
          <div className="mt-3 flex h-12 items-end justify-between gap-1.5">
            {WEEK_BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm transition-all ${
                    i === 3 ? "bg-forest-400" : "bg-coffee-500/80"
                  }`}
                  style={{ height: `${Math.max(h * 0.4, 6)}px` }}
                />
                <span className="text-[11.5px] font-medium text-cream-100/70">
                  {WEEK_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="z-40 flex shrink-0 items-stretch justify-around border-t border-cream-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {MOBILE_NAV.map(({ href, label, icon: Icon, emphasized }) => {
            const active = isActive(href);
            if (emphasized) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex flex-1 flex-col items-center justify-end pb-1.5 pt-1"
                  aria-label={label}
                >
                  <span
                    className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-card-lg transition-transform duration-200 active:scale-95 ${
                      active ? "bg-forest-600 text-white" : "bg-coffee-700 text-cream-100"
                    }`}
                  >
                    <Icon size={25} strokeWidth={2.1} />
                  </span>
                  <span
                    className={`mt-0.5 text-[13px] font-medium ${
                      active ? "text-forest-700" : "text-coffee-400"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                  active ? "text-coffee-800" : "text-coffee-400"
                }`}
                aria-label={label}
              >
                <Icon
                  size={24}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? MOBILE_ICON_COLOR[href] : "text-coffee-300"}
                />
                <span className="text-[13px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Toasts />
      </div>
    </div>
  );
}
