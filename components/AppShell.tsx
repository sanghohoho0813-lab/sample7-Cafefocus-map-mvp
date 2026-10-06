"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map as MapIcon, Target, Heart, Scale, CalendarCheck2, ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";
import TopBrandBar from "@/components/TopBrandBar";
import Toasts from "@/components/Toasts";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { CAFE_MAP } from "@/lib/data/cafes";
import { nextPlan } from "@/lib/plans";
import { hm, relativeDate } from "@/lib/time";

/* 지도 서비스의 정보 구조: 찾기 → 고르기 → 정하기 → 기록 */
const NAV = [
  { href: "/", label: "지도", icon: MapIcon },
  { href: "/recommend", label: "맞춤 추천", icon: Target },
  { href: "/favorites", label: "저장", icon: Heart },
  { href: "/compare", label: "비교", icon: Scale },
  { href: "/my", label: "내 작업", icon: CalendarCheck2 },
];

/* 모바일 하단 탭: 핵심 목적 4개 (비교는 '저장'에서 이어진다) */
const MOBILE_NAV = [
  { href: "/", label: "지도", icon: MapIcon },
  { href: "/recommend", label: "추천", icon: Target },
  { href: "/favorites", label: "저장", icon: Heart },
  { href: "/my", label: "내 작업", icon: CalendarCheck2 },
];

/** 하단 고정 CTA를 쓰는 집중 흐름에서는 탭 바를 숨긴다 (상세·계획·후기) */
const FOCUSED_ROUTE = /^\/cafe\//;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { favorites, compare, plans, hydrated } = useApp();
  const now = useNow();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/my" && pathname.startsWith("/plans"));

  const upcoming = hydrated ? nextPlan(plans, now) : null;
  const upcomingCafe = upcoming ? CAFE_MAP[upcoming.cafeId] : null;
  const plannedCount = hydrated ? plans.filter((p) => p.status === "planned").length : 0;

  const badgeFor = (href: string): number | null => {
    if (!hydrated) return null;
    if (href === "/favorites" && favorites.length) return favorites.length;
    if (href === "/compare" && compare.length) return compare.length;
    if (href === "/my" && plannedCount) return plannedCount;
    return null;
  };

  const hideMobileNav = FOCUSED_ROUTE.test(pathname);

  // 공용 뒤로·앞으로 버튼은 resize 때 자리를 다시 고른다.
  // 화면 전환 직후엔 하단 고정 바가 아직 없을 수 있어, 그려진 뒤 한 번 더 알려준다.
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
      {/* 키보드 사용자는 메뉴를 건너뛰고 바로 본문으로 */}
      <a
        href="#main"
        className="sr-only z-[90] rounded-lg bg-coffee-900 px-4 py-2 text-label text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        본문으로 건너뛰기
      </a>
      <TopBrandBar />
      <div className="flex min-h-0 flex-1">
        {/* ---------- Desktop sidebar ---------- */}
        <aside className="hidden w-[232px] shrink-0 flex-col bg-coffee-800 lg:flex">
          <div className="px-5 pb-6 pt-5">
            <Link href="/" aria-label="CafeFocus 지도로 이동">
              <Logo />
            </Link>
          </div>
          <nav className="flex flex-col gap-1 px-3" aria-label="주요 메뉴">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              const badge = badgeFor(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-body font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-coffee-600 text-white"
                      : "text-cream-100/85 hover:bg-coffee-700 hover:text-white"
                  }`}
                >
                  <Icon size={19} strokeWidth={2} className={active ? "text-white" : "text-cream-100/70"} />
                  <span className="flex-1">{label}</span>
                  {badge !== null && (
                    <span className="num rounded-full bg-cream-100/15 px-2 py-0.5 text-caption font-semibold text-cream-50">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 저장된 다음 작업 — 다른 화면에서 만든 결과가 여기서도 보인다 */}
          {upcoming && upcomingCafe && (
            <Link
              href={`/plans/${upcoming.id}`}
              className="group mx-3 mt-auto mb-4 block rounded-2xl bg-coffee-700/70 p-4 transition-colors duration-200 hover:bg-coffee-700"
            >
              <span className="text-caption font-semibold text-cream-100/70">다음 작업</span>
              <span className="mt-1 block truncate text-body font-semibold text-white">
                {upcomingCafe.name}
              </span>
              <span className="mt-0.5 flex items-center justify-between text-meta text-cream-100/80">
                <span className="num">
                  {relativeDate(upcoming.date, now)} {hm(upcoming.startHour)}
                </span>
                <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
        </aside>

        {/* ---------- Main ---------- */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-hidden focus:outline-none">
            {children}
          </main>

          {!hideMobileNav && (
            <nav
              data-bottom-bar
              className="sticky bottom-0 z-40 flex shrink-0 items-stretch border-t border-cream-300/70 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
              aria-label="하단 메뉴"
            >
              {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                const badge = badgeFor(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-16 flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200 ${
                      active ? "text-coffee-900" : "text-coffee-400"
                    }`}
                  >
                    <span className="relative">
                      <Icon size={22} strokeWidth={active ? 2.3 : 1.9} />
                      {badge !== null && (
                        <span className="num absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coffee-800 px-1 text-[11px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className={`text-caption ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <Toasts />
        </div>
      </div>
    </div>
  );
}
